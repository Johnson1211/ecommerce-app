import { useState, useEffect } from 'react'
import { Eye, Trash2, AlertTriangle, Package, ChevronDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import { formatCurrency, formatDate } from '../../lib/helpers'

const statusOptions = ['pending', 'paid', 'failed', 'delivered']

export const Orders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [deleteOrder, setDeleteOrder] = useState(null)
  const { addToast } = useToast()

  useEffect(() => { loadOrders() }, [statusFilter])

  const loadOrders = async () => {
    setLoading(true)
    let query = supabase.from('orders').select('*, user:profiles(full_name, email, phone)').order('created_at', { ascending: false })
    if (statusFilter !== 'all') query = query.eq('status', statusFilter)
    const { data } = await query
    if (data) setOrders(data)
    setLoading(false)
  }

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
      if (error) throw error
      addToast(`Status updated to ${newStatus}`, 'success')
      loadOrders()
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }))
      }
    } catch (error) {
      addToast(error.message || 'Failed to update status', 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteOrder) return
    try {
      const { error } = await supabase.from('orders').delete().eq('id', deleteOrder.id)
      if (error) throw error
      addToast('Order deleted', 'success')
      setShowDeleteModal(false)
      setDeleteOrder(null)
      loadOrders()
    } catch (error) {
      addToast(error.message || 'Failed to delete', 'error')
    }
  }

  const getStatusColor = (status) => {
    const colors = { pending: 'warning', paid: 'success', failed: 'danger', delivered: 'primary' }
    return colors[status] || 'default'
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 mt-1">Manage customer orders</p>
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none bg-white">
          <option value="all">All Statuses</option>
          {statusOptions.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-6">Customer</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-6">Items</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-6">Total</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-6">Status</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-6">Date</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase py-3 px-6">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-medium text-sm text-gray-900">{order.user?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{order.user?.email}</p>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">{order.items?.length || 0} items</td>
                      <td className="py-4 px-6 font-medium text-sm text-gray-900">{formatCurrency(order.total)}</td>
                      <td className="py-4 px-6">
                        <div className="relative inline-block">
                          <select value={order.status} onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                            className="appearance-none bg-transparent pr-6 py-1 text-xs font-medium focus:outline-none cursor-pointer">
                            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <ChevronDown className="w-3 h-3 text-gray-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-500">{formatDate(order.created_at)}</td>
                      <td className="py-4 px-6 text-right">
                        <button onClick={() => { setSelectedOrder(order); setShowDetailModal(true) }} className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors mr-1">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setDeleteOrder(order); setShowDeleteModal(true) }} className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {orders.length === 0 && !loading && (
            <div className="text-center py-12"><p className="text-gray-500">No orders found</p></div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Order Details" size="lg">
        {selectedOrder && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Order Reference</p>
                <p className="font-mono font-semibold">{selectedOrder.paystack_ref}</p>
              </div>
              <Badge variant={getStatusColor(selectedOrder.status)} className="capitalize text-sm">{selectedOrder.status}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
              <div>
                <p className="text-xs text-gray-500 uppercase">Customer</p>
                <p className="font-medium">{selectedOrder.user?.full_name}</p>
                <p className="text-sm text-gray-600">{selectedOrder.user?.email}</p>
                <p className="text-sm text-gray-600">{selectedOrder.user?.phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Date</p>
                <p className="font-medium">{formatDate(selectedOrder.created_at)}</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Items</h4>
              <div className="space-y-3">
                {selectedOrder.items?.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.image_url ? <img src={item.image_url} alt="" className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-gray-400" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Subtotal: {formatCurrency(selectedOrder.subtotal)}</p>
                <p className="text-xl font-bold text-primary-600">Total: {formatCurrency(selectedOrder.total)}</p>
              </div>
              <div className="flex gap-2">
                {statusOptions.filter(s => s !== selectedOrder.status).map(s => (
                  <Button key={s} size="sm" variant="outline" onClick={() => handleUpdateStatus(selectedOrder.id, s)}>
                    Mark {s}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Order" size="sm">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-gray-900 font-medium mb-2">Delete this order?</p>
          <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)} className="flex-1">Cancel</Button>
            <Button variant="danger" onClick={handleDelete} className="flex-1">Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
