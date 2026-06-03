import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { DataPackageCard } from '../../components/store/DataPackageCard'
import { Skeleton } from '../../components/ui/Skeleton'
import { cn } from '../../lib/helpers'

const networks = ['MTN', 'AirtelTigo', 'Telecel']

export const DataBundles = () => {
  const [activeTab, setActiveTab] = useState('MTN')
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPackages()
  }, [activeTab])

  const loadPackages = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('data_packages')
      .select('*')
      .eq('network', activeTab)
      .eq('is_active', true)
      .order('size_gb')

    if (data) setPackages(data)
    setLoading(false)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Data Bundles</h1>
        <p className="text-gray-600 max-w-xl mx-auto">
          Purchase affordable data bundles for MTN, AirtelTigo, and Telecel. 
          Instant delivery after payment.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex bg-gray-100 rounded-xl p-1">
          {networks.map(network => (
            <button
              key={network}
              onClick={() => setActiveTab(network)}
              className={cn(
                'px-6 py-2.5 rounded-lg text-sm font-medium transition-all',
                activeTab === network
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {network}
            </button>
          ))}
        </div>
      </div>

      {/* Packages Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
              <Skeleton className="h-6 w-20 mx-auto mb-4" />
              <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
              <Skeleton className="h-8 w-24 mx-auto mb-4" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {packages.map(pkg => (
            <DataPackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      )}

      {packages.length === 0 && !loading && (
        <div className="text-center py-16">
          <p className="text-gray-500">No data packages available for {activeTab} at the moment.</p>
        </div>
      )}
    </div>
  )
}
