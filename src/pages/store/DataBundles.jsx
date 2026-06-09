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
  }, [])

  const loadPackages = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('data_packages')
      .select('*')
      .eq('is_active', true)
      .order('size_gb')

    if (data) setPackages(data)
    setLoading(false)
  }

  const specialOffers = packages.filter(p => p.is_mashup)
  const regularPackages = packages.filter(p => !p.is_mashup && p.network === activeTab)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Data Bundles</h1>
        <p className="text-gray-600 max-w-xl mx-auto">
          Purchase affordable data bundles for MTN, AirtelTigo, and Telecel. 
          Instant delivery after payment.
        </p>
      </div>

      {loading ? (
        <>
          <div className="flex justify-center mb-10">
            <div className="inline-flex bg-gray-100 rounded-xl p-1">
              {networks.map(network => (
                <button
                  key={network}
                  disabled
                  className={cn(
                    'px-6 py-2.5 rounded-lg text-sm font-medium transition-all opacity-50 cursor-not-allowed',
                    activeTab === network ? 'bg-white text-primary-600' : 'text-gray-600'
                  )}
                >
                  {network}
                </button>
              ))}
            </div>
          </div>
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
        </>
      ) : (
        <>
          {/* Special Offers Section */}
          {specialOffers.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">🔥</span>
                <div>
                  <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600">
                    Mashup Special Offers
                  </h2>
                  <p className="text-sm text-gray-500">Exclusive, high-value bundles available for a limited time</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {specialOffers.map(pkg => (
                  <DataPackageCard key={pkg.id} pkg={pkg} />
                ))}
              </div>
              <div className="border-b border-gray-200/80 my-12" />
            </div>
          )}

          {/* Network Tabs Header */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-1">Standard Bundles</h3>
            <p className="text-sm text-gray-500">Select your network provider below</p>
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

          {/* Regular Packages Grid */}
          {regularPackages.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {regularPackages.map(pkg => (
                <DataPackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-500">No standard data packages available for {activeTab} at the moment.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
