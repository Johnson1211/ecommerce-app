import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Users, ShoppingBag, Package, DollarSign, 
  TrendingUp, ArrowUpRight 
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { Button } from '../../components/ui/Button'
import { formatCurrency, formatDate } from '../../lib/helpers'

export const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)

    const [
      { count: userCount },
      { count: orderCount },
      { data: revenueData },
      { count: productCount },
      { data: recentOrdersData }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('total').eq('status', 'paid'),
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('orders')
        .select('*, user:profiles(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    const totalRevenue = revenueData?.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0) || 0

    setStats({
      totalUsers: userCount || 0,
      totalOrders: orderCount || 0,
      totalRevenue,
      totalProducts: productCount || 0,
    })
    setRecentOrders(recentOrdersData || [])
    setLoading(false)
  }

  const statCards = [
    { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-blue-500', link: '/admin/users' },
    { title: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'bg-green-500', link: '/admin/orders' },
    { title: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: 'bg-purple-500', link: '/admin/orders' },
    { title: 'Total Products', value: stats.totalProducts, icon: Package, color: 'bg-orange-500', link: '/admin/products' },
  ]

  const getStatusColor = (status) => {
    const colors = { pending: 'warning', paid: 'success', failed: 'danger', delivered: 'primary' }
    return colors[status] || 'default'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of your store performance</p>
        </div>
        <Button onClick={loadDashboardData} variant="outline">
          <TrendingUp className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, i) => (
          <Link key={i} to={stat.link}>
            <Card className="hover:border-primary-300 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          <Link to="/admin/orders">
            <Button variant="ghost" size="sm">
              View All
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No orders yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">Customer</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">Items</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">Total</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">Status</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(order => (
                    <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-medium text-sm text-gray-900">{order.user?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{order.user?.email}</p>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{order.items?.length || 0} items</td>
                      <td className="py-3 px-4 font-medium text-sm text-gray-900">{formatCurrency(order.total)}</td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusColor(order.status)} className="capitalize">{order.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">{formatDate(order.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
