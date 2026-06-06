import { useState, useEffect } from 'react'

export const WhatsAppFAB = () => {
  const [showBadge, setShowBadge] = useState(true)

  // Subtle reminder pulse every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Re-trigger badge scale if dismissed or just pulse
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed bottom-6 left-6 z-50 flex items-center justify-center">
      {/* Outer pulsing radar ring */}
      <span className="absolute inline-flex h-16 w-16 rounded-full bg-[#25D366]/30 animate-ping duration-1000" />
      
      {/* WhatsApp Link button */}
      <a
        href="https://whatsapp.com/channel/0029VbCe7I7Au3aOr58ezH35"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => setShowBadge(false)}
        className="relative flex items-center justify-center w-14 h-14 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 group"
        aria-label="Join our WhatsApp Community"
      >
        <svg 
          viewBox="0 0 24 24" 
          className="w-7 h-7 fill-current transition-transform duration-300 group-hover:rotate-12"
        >
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.488 1.459 5.407 1.46h.007c5.432 0 9.854-4.42 9.858-9.853.002-2.633-1.02-5.107-2.879-6.97-1.859-1.862-4.332-2.887-6.968-2.888-5.439 0-9.863 4.42-9.867 9.855-.001 1.928.502 3.815 1.458 5.419L1.872 22.14l4.775-1.252zm12.383-7.534c-.33-.165-1.951-.963-2.251-1.072-.3-.11-.518-.165-.736.165-.218.33-.84 1.072-1.03 1.291-.19.218-.38.245-.71.08-1.12-.56-1.986-.82-2.825-1.574-.675-.58-1.21-1.32-1.565-2.079-.19-.33-.02-.508.145-.674.15-.15.33-.385.495-.58.165-.195.22-.33.33-.55.11-.22.055-.412-.028-.58-.083-.165-.736-1.774-1.01-2.434-.268-.644-.542-.556-.736-.566l-.627-.012c-.218 0-.573.082-.872.407-.3.33-1.146 1.12-1.146 2.729s1.17 3.163 1.334 3.385c.163.22 2.3 3.51 5.57 4.92.777.336 1.384.537 1.858.687.781.248 1.492.213 2.054.129.627-.094 1.951-.798 2.224-1.57.272-.77.272-1.43.19-1.57-.083-.14-.3-.22-.63-.385z" />
        </svg>

        {/* Floating Notification Badge */}
        {showBadge && (
          <span className="absolute -top-1.5 -right-1.5 flex h-6 w-6">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-6 w-6 bg-red-500 text-white font-bold text-[11px] items-center justify-center border border-white shadow-sm">
              1
            </span>
          </span>
        )}
      </a>
    </div>
  )
}
