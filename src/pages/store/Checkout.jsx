import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { MapPin, Phone, Mail, ArrowLeft, Lock, CreditCard, AlertTriangle } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { generateReference } from '../../lib/paystack'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/helpers'

export const Checkout = () => {
  const location = useLocation()
  const directBuyItem = location.state?.directBuyItem

  const { cartItems: contextCartItems, cartTotal: contextCartTotal, clearCart } = useCart()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const { addToast, removeToast } = useToast()
  const [loading, setLoading] = useState(false)

  const isSubAgent = profile?.role === 'sub_agent'
  const cartItems = (directBuyItem ? [directBuyItem] : contextCartItems).map(item => {
    if (item.id.toString().startsWith('data-') && isSubAgent && item.sub_agent_price !== null && item.sub_agent_price !== undefined) {
      return { ...item, price: item.sub_agent_price }
    }
    return item
  })
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const [formData, setFormData] = useState({
    fullName: profile?.full_name || '',
    email: profile?.email || user?.email || '',
    phone: directBuyItem?.metadata?.recipient_phone || '',
    address: '',
    city: '',
  })

  // Merchant MoMo state
  const [merchantMomo, setMerchantMomo] = useState({
    number: '',
    network: 'MTN',
    name: ''
  })

  // Customer MoMo input state
  const [momoDetails, setMomoDetails] = useState({
    network: directBuyItem?.metadata?.network || 'MTN',
    number: directBuyItem?.metadata?.recipient_phone || '',
    senderName: '',
    transactionId: ''
  })

  useEffect(() => {
    loadMerchantMomo()
  }, [])

  const loadMerchantMomo = async () => {
    try {
      const { data } = await supabase.from('store_settings').select('momo_number, momo_network, momo_name').limit(1)
      if (data && data.length > 0) {
        setMerchantMomo({
          number: data[0].momo_number || '',
          network: data[0].momo_network || 'MTN',
          name: data[0].momo_name || ''
        })
      }
    } catch (err) {
      console.error('Failed to load merchant MoMo settings:', err)
    }
  }

  const handleChange = (e) => {
    const value = e.target.name === 'phone' ? e.target.value.replace(/\D/g, '') : e.target.value
    setFormData(prev => ({ ...prev, [e.target.name]: value }))
  }

  const handleSubmitOrder = async () => {
    if (!formData.fullName || !formData.email || !formData.phone) {
      addToast('Please fill in all required fields', 'error')
      return
    }

    if (!momoDetails.number || !momoDetails.senderName || !momoDetails.transactionId) {
      addToast('Please complete step 2 by entering your MoMo payment details', 'error')
      return
    }

    setLoading(true)
    const loaderId = addToast('Submitting your order...', 'loading', 0)

    const reference = generateReference()

    try {
      const orderItems = cartItems.map(item => ({
        product_id: item.id.toString().startsWith('data-') ? item.id.substring(5) : item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image_url: item.image_url,
        file_url: item.file_url,
        metadata: item.metadata,
      }))

      const { error } = await supabase.from('orders').insert({
        user_id: user.id,
        phone: formData.phone.trim(),
        items: orderItems,
        subtotal: cartTotal,
        total: cartTotal,
        status: 'pending',
        paystack_ref: reference,
        momo_transaction_id: momoDetails.transactionId.trim(),
        momo_number: momoDetails.number.trim(),
        momo_network: momoDetails.network,
        momo_sender_name: momoDetails.senderName.trim()
      })

      if (error) throw error

      if (!directBuyItem) {
        await clearCart()
      }

      // Email notifications to owner
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
                order_ref: reference,
                customer_name: formData.fullName,
                customer_email: formData.email,
                customer_phone: formData.phone,
                order_details: `${itemsText}\n\nIncoming MoMo Payment Details:\nNetwork: ${momoDetails.network}\nNumber: ${momoDetails.number}\nSender Name: ${momoDetails.senderName}\nTransaction ID: ${momoDetails.transactionId}`,
                total_amount: formatCurrency(cartTotal)
              }
            })
          }).catch(emailErr => console.error('Email send fail:', emailErr))
        }
      } catch (emailError) {
        console.error('Email preparation error:', emailError)
      }

      removeToast(loaderId)
      addToast('Order submitted! Awaiting payment verification.', 'success')
      navigate(`/order-confirmation?ref=${reference}`)
    } catch (error) {
      removeToast(loaderId)
      addToast(error.message || 'Failed to submit order', 'error')
    } finally {
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
          {/* Contact Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary-600" />
              Contact Info
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Kwame Boateng"
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
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formData.phone}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="e.g., 0551234567"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* MoMo Send Instruction */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm">1</span>
              Send Payment Manually
            </h2>
            <div className="bg-primary-50 rounded-lg p-5 border border-primary-100 text-primary-950">
              <p className="text-sm font-medium mb-3">Please transfer exactly <span className="text-lg font-bold text-primary-700">{formatCurrency(cartTotal)}</span> to the MoMo account below:</p>
              <div className="space-y-2.5 text-sm font-semibold">
                <div className="flex justify-between border-b border-primary-100/50 pb-1.5">
                  <span className="text-primary-700">Network:</span>
                  <span>{merchantMomo.network || 'MTN'}</span>
                </div>
                <div className="flex justify-between border-b border-primary-100/50 pb-1.5">
                  <span className="text-primary-700">Number:</span>
                  <span className="text-base text-primary-900 font-bold">{merchantMomo.number || '0558802783'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary-700">Account Name:</span>
                  <span>{merchantMomo.name || 'Joyce Marfo'}</span>
                </div>
              </div>
              <p className="text-xs text-primary-700 mt-4 leading-relaxed font-normal">
                * Complete the transfer using your phone, copy the **Transaction ID** from your receipt, and fill in the details below.
              </p>
            </div>
          </div>

          {/* MoMo Submission Form */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm">2</span>
              Enter Your Payment Receipt Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Your MoMo Network *</label>
                <select
                  value={momoDetails.network}
                  onChange={(e) => setMomoDetails(prev => ({ ...prev, network: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none bg-white text-sm"
                >
                  <option value="MTN">MTN MoMo</option>
                  <option value="Telecel">Telecel Cash</option>
                  <option value="AirtelTigo">AirtelTigo Money</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Your MoMo Number *</label>
                <input
                  type="tel"
                  required
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={momoDetails.number}
                  onChange={(e) => setMomoDetails(prev => ({ ...prev, number: e.target.value.replace(/\D/g, '') }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm"
                  placeholder="e.g., 0551234567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Sender Name (On MoMo Account) *</label>
                <input
                  type="text"
                  required
                  value={momoDetails.senderName}
                  onChange={(e) => setMomoDetails(prev => ({ ...prev, senderName: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm"
                  placeholder="e.g., Kwame Boateng"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">MoMo Transaction ID *</label>
                <input
                  type="text"
                  required
                  value={momoDetails.transactionId}
                  onChange={(e) => setMomoDetails(prev => ({ ...prev, transactionId: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-primary-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm font-semibold"
                  placeholder="e.g., 28394850384"
                />
                <p className="text-xs text-red-650 mt-1.5 font-medium flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                  Wrong transaction ID will result in your order NOT being processed.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Verification & Processing Notice</p>
              <p className="text-sm text-amber-700 mt-1">
                Your order is verified manually. <strong>Please double-check that your Transaction ID is 100% correct.</strong> Submitting an incorrect or wrong ID will result in your order being rejected and marked as "Wrong Payment Info" (unprocessed).
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
              onClick={handleSubmitOrder}
              loading={loading}
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Submit Order
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
