import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CreditCard, MapPin, Phone, Mail, ArrowLeft, Lock } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { initializePayment, generateReference } from '../../lib/paystack'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/helpers'

export const Checkout = () => {
  const location = useLocation()
  const directBuyItem = location.state?.directBuyItem

  const { cartItems: contextCartItems, cartTotal: contextCartTotal, clearCart } = useCart()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)

  const cartItems = directBuyItem ? [directBuyItem] : contextCartItems
  const cartTotal = directBuyItem ? directBuyItem.price * directBuyItem.quantity : contextCartTotal

  const [formData, setFormData] = useState({
    fullName: profile?.full_name || '',
    email: profile?.email || user?.email || '',
    phone: profile?.phone || '',
    address: '',
    city: '',
  })

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handlePayment = async () => {
    if (!formData.fullName || !formData.email || !formData.phone) {
      addToast('Please fill in all required fields', 'error')
      return
    }

    setLoading(true)
    addToast('Initializing payment...', 'loading', 0)

    const reference = generateReference()

    try {
      const response = await initializePayment({
        email: formData.email,
        amount: cartTotal,
        reference,
        metadata: {
          custom_fields: [
            { display_name: 'Full Name', variable_name: 'full_name', value: formData.fullName },
            { display_name: 'Phone', variable_name: 'phone', value: formData.phone },
            { display_name: 'Address', variable_name: 'address', value: formData.address },
          ]
        },
        onSuccess: async (response) => {
          // Save order to Supabase
          const orderItems = cartItems.map(item => ({
            product_id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image_url: item.image_url,
            file_url: item.file_url,
            metadata: item.metadata,
          }))

          const { error } = await supabase.from('orders').insert({
            user_id: user.id,
            items: orderItems,
            subtotal: cartTotal,
            total: cartTotal,
            status: 'paid',
            paystack_ref: response.reference,
          })

          if (error) {
            console.error('Order save error:', error)
            addToast('Payment successful but order save failed. Contact support.', 'error')
            return
          }

          if (!directBuyItem) {
            await clearCart()
          }

          // ----------------------------------------------------
          // Email Notifications (Runs in background)
          // ----------------------------------------------------

          try {
            const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
            const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
            const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
            const ownerEmail = import.meta.env.VITE_OWNER_EMAIL
            const itemsText = cartItems.map(item => `${item.name} x${item.quantity} (${formatCurrency(item.price * item.quantity)})`).join('\n')

            if (serviceId && templateId && publicKey && ownerEmail) {
              fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  service_id: serviceId,
                  template_id: templateId,
                  user_id: publicKey,
                  template_params: {
                    to_email: ownerEmail,
                    order_ref: response.reference,
                    customer_name: formData.fullName,
                    customer_email: formData.email,
                    customer_phone: formData.phone,
                    order_details: itemsText,
                    total_amount: formatCurrency(cartTotal)
                  }
                })
              }).catch(emailErr => console.error('Email send fail:', emailErr))
            }
          } catch (emailError) {
            console.error('Email preparation error:', emailError)
          }
          // ----------------------------------------------------

          addToast('Payment successful!', 'success')
          navigate(`/order-confirmation?ref=${response.reference}`)
        },
        onClose: () => {
          addToast('Payment cancelled', 'warning')
          setLoading(false)
        },
      })
    } catch (error) {
      addToast(error.message || 'Payment failed', 'error')
      setLoading(false)
    }
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
        <Button onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Continue Shopping
        </Button>
      </div>
    )
  }

  const inputClass = "w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => directBuyItem ? navigate('/category/data-bundles') : navigate('/cart')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {directBuyItem ? 'Back to Data Bundles' : 'Back to Cart'}
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary-600" />
              Contact & Delivery Info
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="+233 20 123 4567"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="123 Street Name, Area"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={inputClass.replace('pl-10', 'pl-4')}
                  placeholder="Accra"
                />
              </div>
            </div>
          </div>

          {/* Paystack Notice */}
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 flex items-start gap-3">
            <Lock className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-primary-800">Secure Payment</p>
              <p className="text-sm text-primary-700 mt-1">
                Your payment is processed securely by Paystack. We do not store your card details.
              </p>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>

            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {cartItems.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-gray-900">{item.name}</p>
                    <p className="text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-medium text-gray-900 ml-4">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium text-green-600">Free</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-primary-600">{formatCurrency(cartTotal)}</span>
              </div>
            </div>

            <Button
              className="w-full mt-6"
              size="lg"
              onClick={handlePayment}
              loading={loading}
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Pay with Paystack
            </Button>

            <p className="text-xs text-gray-500 text-center mt-3">
              You'll be redirected to Paystack to complete your payment
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
