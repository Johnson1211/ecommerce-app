import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, Download, ShoppingBag, ArrowRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { useToast } from '../../components/ui/Toast'
import { formatCurrency, formatDate } from '../../lib/helpers'

export const OrderConfirmation = () => {
  const [searchParams] = useSearchParams()
  const reference = searchParams.get('ref')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const { addToast, removeToast } = useToast()

  useEffect(() => {
    if (reference) loadOrder()
  }, [reference])

  const loadOrder = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('paystack_ref', reference)
        .single()

      if (error) throw error
      if (data) setOrder(data)
    } catch (err) {
      console.error('Failed to load order:', err)
      addToast('Failed to load order details.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (fileUrl, fileName) => {
    const loaderId = addToast('Generating secure download link...', 'loading', 0)
    try {
      const bucketName = 'digital-files'
      let filePath = ''
      
      const searchStr = `/storage/v1/object/public/${bucketName}/`
      const index = fileUrl.indexOf(searchStr)
      if (index !== -1) {
        filePath = fileUrl.substring(index + searchStr.length)
      } else {
        filePath = fileUrl.split(`${bucketName}/`).pop()
      }

      if (!filePath) {
        removeToast(loaderId)
        addToast('Invalid file URL', 'error')
        return
      }

      filePath = decodeURIComponent(filePath)

      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, 60)

      if (error) throw error

      if (data?.signedUrl) {
        removeToast(loaderId)
        addToast('Secure link generated! Downloading...', 'success')
        window.open(data.signedUrl, '_blank')
      } else {
        throw new Error('Failed to generate secure URL')
      }
    } catch (err) {
      console.error('Download error:', err)
      removeToast(loaderId)
      addToast('Download failed. Ensure you are signed in and have paid for this item.', 'error')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      processing: 'primary',
      done: 'success',
      paid: 'success',
      failed: 'danger',
      delivered: 'success',
    }
    return colors[status] || 'default'
  }

  const hasDigitalItems = order?.items?.some(item => item.file_url || item.metadata?.network)

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4" />
          <div className="h-6 bg-gray-200 rounded w-48 mx-auto mb-2" />
          <div className="h-4 bg-gray-200 rounded w-64 mx-auto" />
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
        <p className="text-gray-600 mb-6">We couldn't find your order details.</p>
        <Link to="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Submitted!</h1>
        <p className="text-gray-600">Your order has been received and is awaiting payment verification.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Order Reference</p>
              <p className="font-mono font-semibold text-gray-900">{order.paystack_ref}</p>
            </div>
            <Badge variant={getStatusColor(order.status)} className="capitalize">
              {order.status}
            </Badge>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {order.items?.map((item, i) => (
              <div key={i} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  {item.metadata?.network && (
                    <p className="text-sm text-primary-600">
                      {item.metadata.network} — {item.metadata.size_gb}GB
                    </p>
                  )}
                  {item.file_url && order.status === 'done' && (
                    <button
                      onClick={() => handleDownload(item.file_url, item.name)}
                      className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 mt-1 cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                    >
                      <Download className="w-3 h-3" />
                      Download File
                    </button>
                  )}
                  {item.file_url && order.status !== 'done' && (
                    <p className="text-xs text-amber-600 mt-1 italic">
                      Download will be available once payment is verified.
                    </p>
                  )}
                </div>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t mt-4 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg">
              <span className="text-gray-900">Total</span>
              <span className="text-primary-600">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Ordered on {formatDate(order.created_at)}
          </p>
        </div>
      </div>

      {hasDigitalItems && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-primary-800 mb-2">Digital Delivery</h3>
          <p className="text-sm text-primary-700">
            Once payment is verified, your digital download links will be enabled above. 
            For data bundles, you'll receive delivery via the phone number provided during checkout.
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/profile">
          <Button variant="outline" className="w-full sm:w-auto">
            View Order History
          </Button>
        </Link>
        <Link to="/">
          <Button className="w-full sm:w-auto">
            Continue Shopping
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
