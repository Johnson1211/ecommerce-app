import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, Users, Package, ShoppingBag, 
  Settings, ChevronLeft, ChevronRight, LogOut,
  Database, FolderOpen, CreditCard, Menu, X, AlertCircle, Bell, Trophy
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { cn } from '../../lib/helpers'

const menuItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/rankings', icon: Trophy, label: 'Rankings' },
  { to: '/admin/categories', icon: FolderOpen, label: 'Categories' },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/data-packages', icon: Database, label: 'Data Packages' },
  { to: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
  { to: '/admin/announcements', icon: Bell, label: 'Announcements' },
  { to: '/admin/reports', icon: AlertCircle, label: 'Reports' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
]

export const AdminSidebar = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed left-0 top-0 h-full bg-gray-900 text-white z-40 transition-all duration-300',
        collapsed ? 'w-20' : 'w-64',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
            {!collapsed && (
              <Link to="/admin" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="font-bold text-sm">A</span>
                </div>
                <span className="font-bold text-lg">Admin</span>
              </Link>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {menuItems.map(item => {
              const isActive = location.pathname === item.to
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                    isActive 
                      ? 'bg-primary-600 text-white' 
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-gray-800">
            <Link
              to="/"
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors',
                collapsed && 'justify-center'
              )}
            >
              <CreditCard className="w-5 h-5" />
              {!collapsed && <span className="text-sm font-medium">Storefront</span>}
            </Link>
            <button
              onClick={handleSignOut}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-red-900/50 hover:text-red-400 transition-colors w-full mt-1',
                collapsed && 'justify-center'
              )}
            >
              <LogOut className="w-5 h-5" />
              {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
