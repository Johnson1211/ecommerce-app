import { useState, useEffect } from 'react'
import { Trophy, Users, TrendingUp, DollarSign, Package } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Card, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import { formatCurrency } from '../../lib/helpers'

export const Rankings = () => {
  const [rankings, setRankings] = useState([])
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()

  useEffect(() => {
    loadRankings()
  }, [])

  const loadRankings = async () => {
    setLoading(true)
    try {
      // Fetch all user profiles
      const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, phone')
      
      if (pError) throw pError

      // Fetch all successful orders
      const { data: orders, error: oError } = await supabase
        .from('orders')
        .select('user_id, total')
        .in('status', ['processing', 'done', 'paid', 'delivered'])

      if (oError) throw oError

      // Group orders by user_id
      const statsMap = {}
      orders?.forEach(order => {
        if (!order.user_id) return
        if (!statsMap[order.user_id]) {
          statsMap[order.user_id] = { totalSpent: 0, orderCount: 0 }
        }
        statsMap[order.user_id].totalSpent += parseFloat(order.total || 0)
        statsMap[order.user_id].orderCount += 1
      })

      // Combine profiles and stats
      const customerRankings = (profiles || [])
        .filter(p => p.role !== 'admin') // Exclude admins from shopper rankings
        .map(p => {
          const stats = statsMap[p.id] || { totalSpent: 0, orderCount: 0 }
          return {
            id: p.id,
            name: p.full_name || 'No Name',
            email: p.email || 'N/A',
            phone: p.phone || 'N/A',
            totalSpent: stats.totalSpent,
            orderCount: stats.orderCount
          }
        })
        .sort((a, b) => b.totalSpent - a.totalSpent) // Sort by spending desc

      // Calculate ranks
      let rank = 1
      let previousSpent = -1
      const rankedData = customerRankings.map((user, idx) => {
        if (previousSpent !== -1 && user.totalSpent < previousSpent) {
          rank = idx + 1
        }
        previousSpent = user.totalSpent
        return {
          ...user,
          rank
        }
      })

      setRankings(rankedData)
    } catch (err) {
      console.error('Failed to load admin rankings:', err)
      addToast(err.message || 'Failed to load rankings', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Summary stats
  const totalSpent = rankings.reduce((sum, r) => sum + r.totalSpent, 0)
  const averageSpent = rankings.length > 0 ? totalSpent / rankings.length : 0
  const topPerformer = rankings[0] || null

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-500" />
          User Rankings & Leaderboard
        </h1>
        <p className="text-gray-500 mt-1">
          Monitor shopping performance and customer leaderboards based on total order spending
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600 flex-shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Ranked Shoppers</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{loading ? '...' : rankings.length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center text-amber-500 flex-shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium">Top Performer</p>
              <h3 className="text-sm font-bold text-gray-900 truncate mt-1">
                {loading ? '...' : topPerformer ? topPerformer.name : 'N/A'}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center text-green-600 flex-shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Cumulative Spending</p>
              <h3 className="text-lg font-bold text-gray-900 mt-1">{loading ? '...' : formatCurrency(totalSpent)}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Average Spend</p>
              <h3 className="text-lg font-bold text-gray-900 mt-1">{loading ? '...' : formatCurrency(averageSpent)}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rankings Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-150 bg-gray-50 text-xs text-gray-500 font-semibold uppercase">
                    <th className="py-3.5 px-6 w-24">Rank</th>
                    <th className="py-3.5 px-6">Customer Details</th>
                    <th className="py-3.5 px-6 w-44">Phone</th>
                    <th className="py-3.5 px-6 text-center w-36">Total Orders</th>
                    <th className="py-3.5 px-6 text-right w-44">Total Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
                  {rankings.map(user => {
                    const isGold = user.rank === 1
                    const isSilver = user.rank === 2
                    const isBronze = user.rank === 3
                    
                    return (
                      <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-6 font-semibold">
                          <div className="flex items-center gap-1.5">
                            {isGold && <span className="text-lg">🥇</span>}
                            {isSilver && <span className="text-lg">🥈</span>}
                            {isBronze && <span className="text-lg">🥉</span>}
                            {!isGold && !isSilver && !isBronze && (
                              <span className="text-gray-400 font-bold ml-1">#{user.rank}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-semibold text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </td>
                        <td className="py-4 px-6 font-mono text-xs">{user.phone}</td>
                        <td className="py-4 px-6 text-center font-medium">
                          <Badge variant="default" className="inline-flex items-center gap-1 bg-gray-100 text-gray-800">
                            <Package className="w-3 h-3 text-gray-400" />
                            {user.orderCount}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-right font-semibold font-mono text-primary-600">
                          {formatCurrency(user.totalSpent)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {rankings.length === 0 && !loading && (
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No customer rankings computed yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
