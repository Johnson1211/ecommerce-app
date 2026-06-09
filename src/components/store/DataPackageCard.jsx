import { useState } from 'react'
import { Wifi, Clock, CreditCard } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { useToast } from '../ui/Toast'
import { formatCurrency, cn } from '../../lib/helpers'

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
  const [showPhoneInput, setShowPhoneInput] = useState(false)
  const [recipientPhone, setRecipientPhone] = useState('')

  const isSubAgent = profile?.role === 'sub_agent'
  const hasSubAgentPrice = pkg.sub_agent_price !== null && pkg.sub_agent_price !== undefined
  const finalPrice = (isSubAgent && hasSubAgentPrice) ? pkg.sub_agent_price : pkg.price

  const handleBuyNow = () => {
    if (!showPhoneInput) {
      setShowPhoneInput(true)
      return
    }

    if (recipientPhone.length < 9) {
      addToast('Please enter a valid recipient phone number', 'warning')
      return
    }

    setBuying(true)
    const directBuyItem = {
      id: `data-${pkg.id}`,
      name: `${pkg.network} ${pkg.label}`,
      price: finalPrice,
      sub_agent_price: pkg.sub_agent_price,
      image_url: null,
      category_id: null,
      quantity: 1,
      metadata: { 
        network: pkg.network, 
        size_gb: pkg.size_gb, 
        validity: pkg.validity_days,
        recipient_phone: recipientPhone
      },
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

  const isMashup = pkg.is_mashup || false

  return (
    <div className={cn(
      "rounded-xl p-5 hover:shadow-xl transition-all border relative overflow-hidden flex flex-col justify-between min-h-[350px]",
      isMashup 
        ? "bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 border-none text-white shadow-lg animate-in fade-in duration-300" 
        : "bg-white border-gray-200 text-gray-950 hover:shadow-md"
    )}>
      {isMashup && (
        <div className="absolute top-0 right-0 bg-gradient-to-l from-pink-500 to-purple-600 text-white font-extrabold text-[9px] uppercase tracking-wider px-3 py-1 rounded-bl-lg animate-pulse shadow-md z-10">
          Special Offer 🔥
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${networkColors[pkg.network]}`} />
            <Badge variant={isMashup ? "secondary" : "primary"} className="text-xs">
              {pkg.network}
            </Badge>
          </div>
          <Badge variant={isMashup ? "secondary" : "outline"} className={cn("text-xs", isMashup && "text-white border-white/20 bg-white/10")}>
            <Clock className="w-3 h-3 mr-1" />
            {pkg.validity_days} days
          </Badge>
        </div>

        <div className="text-center mb-4">
          <div className={cn(
            "inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 mx-auto",
            isMashup ? "bg-white/10 text-pink-300" : "bg-primary-50 text-primary-600"
          )}>
            <Wifi className="w-8 h-8" />
          </div>
          <h3 className={cn("text-2xl font-bold", isMashup ? "text-white" : "text-gray-900")}>{pkg.label}</h3>
          <p className={cn("text-sm mt-1", isMashup ? "text-gray-300" : "text-gray-500")}>
            {isMashup ? "Mashup Special Offer 🚀" : `${pkg.network} Data Bundle`}
          </p>
        </div>

        <div className="text-center mb-4 min-h-[50px] flex flex-col justify-center items-center">
          {isSubAgent && hasSubAgentPrice ? (
            <>
              <span className={cn("text-xs line-through", isMashup ? "text-gray-400" : "text-gray-405")}>{formatCurrency(pkg.price)}</span>
              <span className="text-3xl font-bold text-amber-500 flex items-center gap-1.5 justify-center">
                {formatCurrency(finalPrice)}
                <Badge variant="warning" className="text-[9px] py-0.5 px-1.5 uppercase font-bold tracking-wider">Agent</Badge>
              </span>
            </>
          ) : (
            <span className={cn("text-3xl font-bold", isMashup ? "text-pink-400 drop-shadow-sm" : "text-primary-600")}>
              {formatCurrency(pkg.price)}
            </span>
          )}
        </div>

        {showPhoneInput && (
          <div className="mb-4 text-left animate-in slide-in-from-top duration-200">
            <label className={cn("block text-xs font-semibold mb-1", isMashup ? "text-gray-300" : "text-gray-500")}>Recipient Phone *</label>
            <input
              type="tel"
              required
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 0551234567"
              className={cn(
                "w-full px-3 py-2 text-sm rounded-lg border focus:ring-2 outline-none transition-all",
                isMashup 
                  ? "bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-pink-500 focus:ring-pink-500/20" 
                  : "border-gray-300 focus:border-primary-500 focus:ring-primary-200 bg-white text-gray-950"
              )}
              autoFocus
            />
          </div>
        )}
      </div>

      <Button
        className={cn(
          "w-full",
          isMashup 
            ? "bg-gradient-to-r from-pink-500 to-purple-650 hover:from-pink-600 hover:to-purple-700 text-white border-none shadow-md" 
            : ""
        )}
        onClick={handleBuyNow}
        loading={buying}
      >
        <CreditCard className="w-4 h-4 mr-2" />
        {showPhoneInput ? 'Confirm & Buy' : 'Buy Now'}
      </Button>
    </div>
  )
}
