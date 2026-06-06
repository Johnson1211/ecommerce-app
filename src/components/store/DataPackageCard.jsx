import { useState } from 'react'
import { Wifi, Clock, CreditCard } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { useToast } from '../ui/Toast'
import { formatCurrency } from '../../lib/helpers'

const networkColors = {
  MTN: 'bg-yellow-500',
  AirtelTigo: 'bg-red-500',
  Telecel: 'bg-blue-500',
}

export const DataPackageCard = ({ pkg }) => {
  const { user, profile } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [buying, setBuying] = useState(false)

  const isSubAgent = profile?.role === 'sub_agent'
  const hasSubAgentPrice = pkg.sub_agent_price !== null && pkg.sub_agent_price !== undefined
  const finalPrice = (isSubAgent && hasSubAgentPrice) ? pkg.sub_agent_price : pkg.price

  const handleBuyNow = () => {
    setBuying(true)
    const directBuyItem = {
      id: `data-${pkg.id}`,
      name: `${pkg.network} ${pkg.label}`,
      price: finalPrice,
      sub_agent_price: pkg.sub_agent_price,
      image_url: null,
      category_id: null,
      quantity: 1,
      metadata: { network: pkg.network, size_gb: pkg.size_gb, validity: pkg.validity_days },
      file_url: null,
    }

    if (!user) {
      addToast('Please sign in or register to buy a data bundle.', 'warning')
      navigate('/login', {
        state: {
          from: '/checkout',
          directBuyItem,
        }
      })
      return
    }

    navigate('/checkout', {
      state: {
        directBuyItem,
      }
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${networkColors[pkg.network]}`} />
          <Badge variant="primary" className="text-xs">{pkg.network}</Badge>
        </div>
        <Badge variant="outline" className="text-xs">
          <Clock className="w-3 h-3 mr-1" />
          {pkg.validity_days} days
        </Badge>
      </div>

      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-50 mb-3">
          <Wifi className="w-8 h-8 text-primary-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">{pkg.label}</h3>
        <p className="text-sm text-gray-500 mt-1">{pkg.network} Data Bundle</p>
      </div>

      <div className="text-center mb-4 min-h-[50px] flex flex-col justify-center items-center">
        {isSubAgent && hasSubAgentPrice ? (
          <>
            <span className="text-sm text-gray-400 line-through">{formatCurrency(pkg.price)}</span>
            <span className="text-3xl font-bold text-amber-600 flex items-center gap-1.5 justify-center">
              {formatCurrency(finalPrice)}
              <Badge variant="warning" className="text-[9px] py-0.5 px-1.5 uppercase font-bold tracking-wider">Agent</Badge>
            </span>
          </>
        ) : (
          <span className="text-3xl font-bold text-primary-600">{formatCurrency(pkg.price)}</span>
        )}
      </div>

      <Button
        className="w-full"
        onClick={handleBuyNow}
        loading={buying}
      >
        <CreditCard className="w-4 h-4 mr-2" />
        Buy Now
      </Button>
    </div>
  )
}
