import { useState, useEffect } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export const AnnouncementModal = () => {
  const [announcement, setAnnouncement] = useState(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    fetchActiveAnnouncement()
  }, [])

  const fetchActiveAnnouncement = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) throw error

      if (data && data.length > 0) {
        const activeNotice = data[0]
        const dismissedId = localStorage.getItem('dismissed_announcement_id')
        if (dismissedId !== activeNotice.id) {
          setAnnouncement(activeNotice)
          setIsOpen(true)
        }
      }
    } catch (err) {
      console.error('Failed to fetch active announcement:', err)
    }
  }

  const handleDismiss = () => {
    if (announcement) {
      localStorage.setItem('dismissed_announcement_id', announcement.id)
    }
    setIsOpen(false)
  }

  if (!isOpen || !announcement) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
        onClick={handleDismiss}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 z-10 flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-950/40 hover:bg-slate-950/80 text-gray-400 hover:text-white transition-all z-20 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Banner Illustration */}
        <div className="relative h-48 w-full bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-800">
          <img
            src={announcement.image_url || '/announcement-banner.png'}
            alt="Announcement"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 flex flex-col items-center">
          
          {/* Important Notice Badge */}
          <div className="px-3.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-center">
            <span className="text-[11px] font-bold tracking-wider text-amber-500 uppercase">
              Important Notice
            </span>
          </div>

          {/* Title */}
          <h3 className="text-xl sm:text-2xl font-bold text-center text-white flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500 animate-pulse flex-shrink-0" />
            {announcement.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-300 leading-relaxed text-center whitespace-pre-line max-h-48 overflow-y-auto px-1">
            {announcement.content}
          </p>

          {/* Disclaimer / Warning Box */}
          <div className="w-full p-3.5 bg-slate-950 border border-slate-850 rounded-xl flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500/80 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-400 leading-normal">
              Please read carefully — dismissing hides this until a new announcement is posted.
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={handleDismiss}
            className="w-full py-3 px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-all shadow-md active:scale-98 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          >
            I Understand — Dismiss
          </button>

        </div>
      </div>
    </div>
  )
}
