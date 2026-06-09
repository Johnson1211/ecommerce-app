import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Menu, X, User, LogOut, Shield, Search, Bell, Check, Trash2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useToast } from '../ui/Toast'
import { supabase } from '../../lib/supabase'
import { cn } from '../../lib/helpers'

export const Navbar = () => {
  const { user, profile, isAdmin, signOut } = useAuth()
  const { cartCount } = useCart()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [scrolled, setScrolled] = useState(false)

  const { addToast } = useToast()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (!error && data) {
        setNotifications(data)
        setUnreadCount(data.filter(n => !n.is_read).length)
      }
    }

    fetchNotifications()

    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNotif = payload.new
            setNotifications(prev => [newNotif, ...prev])
            setUnreadCount(c => c + 1)
            addToast(newNotif.message, 'success')
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev => {
              const updated = prev.map(n => n.id === payload.new.id ? payload.new : n)
              setUnreadCount(updated.filter(n => !n.is_read).length)
              return updated
            })
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => {
              const filtered = prev.filter(n => n.id !== payload.old.id)
              setUnreadCount(filtered.filter(n => !n.is_read).length)
              return filtered
            })
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [user])

  const handleMarkAsRead = async (notifId) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notifId)

    if (!error) {
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n))
      setUnreadCount(c => Math.max(0, c - 1))
    }
  }

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
      addToast('All notifications marked as read', 'success')
    }
  }

  const handleDeleteNotification = async (notifId) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notifId)

    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== notifId))
      setNotifications(prev => {
        setUnreadCount(prev.filter(n => !n.is_read).length)
        return prev
      })
    }
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name')
    if (data) setCategories(data)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
    setIsMenuOpen(false)
  }

  const navLinks = [
    { to: '/', label: 'Home' },
    ...categories.map(cat => ({
      to: `/category/${cat.slug}`,
      label: cat.name,
    })),
  ]

  return (
    <nav className={cn(
      'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
      scrolled ? 'bg-white/95 backdrop-blur-md shadow-md' : 'bg-white shadow-sm'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src="/favicon.png" alt="BIG-BENZ SHOP" className="w-8 h-8 rounded-lg object-cover" />
            <span className="text-xl font-bold text-gray-900">BIG-BENZ SHOP</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link
                to="/admin"
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors"
              >
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            )}

            <Link
              to="/cart"
              className="relative p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Notification Dropdown */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer focus:outline-none"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 bg-transparent" 
                      onClick={() => setShowNotifications(false)} 
                    />
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[420px]">
                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <span className="font-semibold text-sm text-gray-900">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors cursor-pointer"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>

                      {/* List */}
                      <div className="flex-1 overflow-y-auto max-h-[350px]">
                        {notifications.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                            <Bell className="w-8 h-8 text-gray-300 mb-2" />
                            <p className="text-xs text-gray-505 font-medium">No notifications yet</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-50">
                            {notifications.map(notif => (
                              <div
                                key={notif.id}
                                className={cn(
                                  "p-3 flex gap-3 transition-colors",
                                  notif.is_read ? "bg-white" : "bg-primary-50/20"
                                )}
                              >
                                {/* Unread indicator */}
                                <div className="flex-shrink-0 mt-1.5">
                                  {!notif.is_read ? (
                                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                                  ) : (
                                    <div className="w-2 h-2" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-gray-950">{notif.title}</p>
                                  <p className="text-xs text-gray-650 mt-0.5 leading-normal">{notif.message}</p>
                                  <p className="text-[9px] text-gray-400 mt-1">{new Date(notif.created_at).toLocaleDateString()} {new Date(notif.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                </div>
                                {/* Actions */}
                                <div className="flex flex-col justify-between items-end gap-2 flex-shrink-0">
                                  {!notif.is_read && (
                                    <button
                                      onClick={() => handleMarkAsRead(notif.id)}
                                      className="p-1 text-gray-400 hover:text-primary-600 hover:bg-gray-100 rounded transition-all cursor-pointer"
                                      title="Mark as read"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteNotification(notif.id)}
                                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all cursor-pointer"
                                    title="Delete notification"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {user ? (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/profile"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <User className="w-4 h-4" />
                  {profile?.full_name?.split(' ')[0] || 'Account'}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors"
              >
                Sign In
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-600"
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-primary-600 hover:bg-primary-50"
              >
                <Shield className="w-4 h-4" />
                Admin Panel
              </Link>
            )}
            <div className="border-t pt-2 mt-2">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    <User className="w-4 h-4" />
                    My Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white text-center"
                >
                  Sign In / Register
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
