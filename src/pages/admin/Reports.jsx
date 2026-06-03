import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, Trash2, Eye } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import { formatDate } from '../../lib/helpers'

export const Reports = () => {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const { addToast } = useToast()

  useEffect(() => {
    loadReports()
  }, [statusFilter])

  const loadReports = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('order_reports')
        .select('*, user:profiles(full_name, email, phone), order:orders(total, status)')
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query
      if (error) throw error
      setReports(data || [])
    } catch (error) {
      addToast(error.message || 'Failed to load reports', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleResolveReport = async (reportId) => {
    try {
      const { error } = await supabase
        .from('order_reports')
        .update({ status: 'resolved' })
        .eq('id', reportId)

      if (error) throw error
      addToast('Issue marked as Solved', 'success')
      loadReports()
    } catch (error) {
      addToast(error.message || 'Failed to resolve issue', 'error')
    }
  }

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm("Are you sure you want to delete this report record?")) return
    try {
      const { error } = await supabase
        .from('order_reports')
        .delete()
        .eq('id', reportId)

      if (error) throw error
      addToast('Report record deleted', 'success')
      loadReports()
    } catch (error) {
      addToast(error.message || 'Failed to delete report', 'error')
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Reports</h1>
          <p className="text-gray-500 mt-1">Manage issues reported by customers regarding undelivered orders</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none bg-white text-sm"
        >
          <option value="all">All Issues</option>
          <option value="pending">Pending</option>
          <option value="resolved">Solved</option>
        </select>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
          </div>
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">All clear! No reported issues found.</p>
            </CardContent>
          </Card>
        ) : (
          reports.map(report => (
            <Card key={report.id} className={report.status === 'resolved' ? 'border-gray-200 opacity-80' : 'border-amber-200 bg-amber-50/10'}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  {/* Left Column: Report Details */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <Badge variant={report.status === 'resolved' ? 'success' : 'warning'}>
                        {report.status === 'resolved' ? 'Solved' : 'Pending'}
                      </Badge>
                      <span className="text-xs text-gray-400">Reported on {formatDate(report.created_at)}</span>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Order Ref: <span className="font-mono text-gray-900 font-semibold">{report.order_ref}</span>
                      </p>
                      <p className="text-sm font-medium text-gray-700 mt-1">
                        Data Package / Item: <span className="text-primary-700 font-semibold">{report.data_package_info}</span>
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-150">
                      <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Customer Description:</p>
                      <p className="text-sm text-gray-800 leading-relaxed font-medium italic">"{report.message}"</p>
                    </div>
                  </div>

                  {/* Right Column: Customer Info & Actions */}
                  <div className="md:w-64 flex flex-col justify-between border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-6 space-y-4">
                    <div className="space-y-1.5 text-xs text-gray-600">
                      <p className="font-semibold text-gray-900 text-sm mb-1">Reporter Details</p>
                      <p><span className="font-medium">Name:</span> {report.user?.full_name || 'N/A'}</p>
                      <p><span className="font-medium">Email:</span> {report.user?.email || 'N/A'}</p>
                      <p><span className="font-medium">Phone:</span> {report.user?.phone || 'N/A'}</p>
                      <p><span className="font-medium">Order Status:</span> <span className="capitalize font-semibold">{report.order?.status || 'N/A'}</span></p>
                    </div>

                    <div className="flex gap-2">
                      {report.status === 'pending' && (
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleResolveReport(report.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1.5" />
                          Mark Solved
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="danger"
                        className={report.status === 'resolved' ? 'flex-1' : 'w-10 px-0'}
                        onClick={() => handleDeleteReport(report.id)}
                        title="Delete Report"
                      >
                        <Trash2 className="w-4 h-4" />
                        {report.status === 'resolved' && <span className="ml-1.5">Delete</span>}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
