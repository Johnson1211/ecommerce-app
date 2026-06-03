import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { User, Mail, Phone, ShoppingBag, Calendar, Package, Trash2, AlertTriangle, CheckCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { formatCurrency, formatDate } from '../../lib/helpers'

export const Profile = () => {
  const { profile, user } = useAuth()
  const [orders, setOrders] = useState([])
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()

  // Reporting state
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportingOrder, setReportingOrder] = useState(null)
  const [selectedItemName, setSelectedItemName] = useState('')
  const [reportMessage, setReportMessage] = useState('')
  const [submittingReport, setSubmittingReport] = useState(false)

  useEffect(() => {
    if (user) {
      loadOrders()
      loadReports()
    }
  }, [user])

  const loadOrders = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .eq('user_hidden', false)
      .order('created_at', { ascending: false })

    if (data) setOrders(data)
    setLoading(false)
  }

  const loadReports = async () => {
    try {
      const { data } = await supabase
        .from('order_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) setReports(data)
    } catch (err) {
      console.error('Failed to load support reports:', err)
    }
  }

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to delete this order from your history?")) return
    try {
      const { error } = await supabase.from('orders').update({ user_hidden: true }).eq('id', orderId).eq('user_id', user.id)
      if (error) throw error
      addToast('Order deleted from history', 'success')
      setOrders(prev => prev.filter(o => o.id !== orderId))
    } catch (error) {
      addToast(error.message || 'Failed to delete order', 'error')
    }
  }

  const handleClearAllHistory = async () => {
    if (!window.confirm("Are you sure you want to clear your entire order history? This will delete all order records from your account.")) return
    try {
      const { error } = await supabase.from('orders').update({ user_hidden: true }).eq('user_id', user.id)
      if (error) throw error
      addToast('Order history cleared', 'success')
      setOrders([])
    } catch (error) {
      addToast(error.message || 'Failed to clear history', 'error')
    }
  }

  const handleOpenReportModal = (order) => {
    setReportingOrder(order)
    if (order.items && order.items.length > 0) {
      setSelectedItemName(order.items[0].name)
    } else {
      setSelectedItemName('')
    }
    setReportMessage('')
    setShowReportModal(true)
  }

  const handleSubmitReport = async (e) => {
    e.preventDefault()
    if (!selectedItemName) {
      addToast('Please select the item with the issue', 'error')
      return
    }
    if (!reportMessage.trim()) {
      addToast('Please enter a description of the issue', 'error')
      return
    }
    setSubmittingReport(true)
    try {
      const { error } = await supabase.from('order_reports').insert({
        user_id: user.id,
        order_id: reportingOrder.id,
        order_ref: reportingOrder.paystack_ref,
        data_package_info: selectedItemName,
        message: reportMessage,
        status: 'pending'
      })
      if (error) throw error
      addToast('Report submitted successfully! Support will contact you shortly.', 'success')
      setShowReportModal(false)
      setReportMessage('')
      setSelectedItemName('')
      setReportingOrder(null)
      loadReports() // Refresh reports list
    } catch (error) {
      addToast(error.message || 'Failed to submit report', 'error')
    }
    setSubmittingReport(false)
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">My Account</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-primary-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{profile?.full_name || 'User'}</h2>
              <Badge variant={profile?.role === 'admin' ? 'primary' : 'default'} className="mt-2 capitalize">
                {profile?.role || 'user'}
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{profile?.email || user?.email}</span>
              </div>
              {profile?.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{profile.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">
                  Member since {profile?.created_at ? formatDate(profile.created_at).split(',')[0] : 'N/A'}
                </span>
              </div>
            </div>

            <div className="border-t mt-6 pt-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-primary-600">{orders.length}</p>
                  <p className="text-xs text-gray-500 mt-1">Orders</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-primary-600">
                    {formatCurrency(orders.reduce((sum, o) => sum + (o.total || 0), 0))}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Total Spent</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Orders */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary-600" />
              Order History
            </h2>
            {orders.length > 0 && (
              <button
                onClick={handleClearAllHistory}
                className="text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-200 transition-colors"
              >
                Clear History
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
                  <Skeleton className="h-5 w-32 mb-3" />
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-500 mb-4">Start shopping to see your orders here.</p>
              <Link to="/" className="text-primary-600 font-medium hover:text-primary-700">
                Browse Products →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Order #{order.paystack_ref?.slice(-8)}</p>
                      <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(order.status)} className="capitalize">
                        {order.status}
                      </Badge>
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete from history"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="px-6 py-4">
                    <div className="space-y-2">
                      {order.items?.slice(0, 3).map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-gray-700">{item.name} x{item.quantity}</span>
                          <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
                      {order.items?.length > 3 && (
                        <p className="text-xs text-gray-500">+{order.items.length - 3} more items</p>
                      )}
                    </div>
                    {order.momo_transaction_id && (
                      <div className="mt-2 pt-2 border-t border-dashed border-gray-100 flex items-center justify-between text-xs text-gray-500">
                        <span>MoMo Transaction: ({order.momo_network})</span>
                        <span className="font-mono font-semibold bg-gray-50 px-2 py-0.5 rounded border border-gray-100">{order.momo_transaction_id}</span>
                      </div>
                    )}
                    <div className="border-t mt-3 pt-3 flex justify-between items-center">
                      <div>
                        <span className="text-sm font-semibold text-gray-900">Total: </span>
                        <span className="font-bold text-primary-600">{formatCurrency(order.total)}</span>
                      </div>
                      {order.status !== 'failed' && (
                        <button
                          onClick={() => handleOpenReportModal(order)}
                          className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-2.5 py-1.5 rounded-lg border border-primary-200 transition-colors"
                        >
                          Report Issue
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Support Tickets / Reported Issues Section */}
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              My Support Tickets
            </h2>
            
            {reports.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-sm text-gray-500">
                No support tickets filed yet.
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map(ticket => (
                  <div key={ticket.id} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Badge variant={ticket.status === 'resolved' ? 'success' : 'warning'} className="capitalize">
                          {ticket.status === 'resolved' ? 'Solved' : 'Pending'}
                        </Badge>
                        <span className="text-xs text-gray-400">{formatDate(ticket.created_at)}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800">
                        Order #{ticket.order_ref?.slice(-8)} — <span className="text-primary-700 font-semibold">{ticket.data_package_info}</span>
                      </p>
                      <p className="text-xs text-gray-500 italic">" {ticket.message} "</p>
                    </div>
                    {ticket.status === 'resolved' && (
                      <div className="bg-green-50 border border-green-200 text-green-800 text-xs font-semibold px-3 py-1.5 rounded-lg text-center flex items-center gap-1.5 self-start sm:self-auto">
                        <CheckCircle className="w-4 h-4 text-green-600 animate-pulse" />
                        Solved
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <Modal isOpen={showReportModal} onClose={() => setShowReportModal(false)} title="Report Order Issue" size="md">
        {reportingOrder && (
          <form onSubmit={handleSubmitReport} className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Order Reference</p>
              <p className="font-mono font-semibold text-sm">{reportingOrder.paystack_ref}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Which package/product did you not receive?
              </label>
              <select
                value={selectedItemName}
                onChange={(e) => setSelectedItemName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none bg-white text-sm"
              >
                {reportingOrder.items?.map((item, i) => (
                  <option key={i} value={item.name}>{item.name} x{item.quantity}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Issue Details
              </label>
              <textarea
                value={reportMessage}
                onChange={(e) => setReportMessage(e.target.value)}
                rows={4}
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none text-sm"
                placeholder="E.g., I made payment but the data bundle has not been sent to my phone number (055xxxxxxx)."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowReportModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" loading={submittingReport} className="flex-1">
                Submit Report
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
