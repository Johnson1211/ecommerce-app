import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { ToastProvider } from './components/ui/Toast'
import { useAuth } from './context/AuthContext'
import { Navbar } from './components/layout/Navbar'
import { Footer } from './components/layout/Footer'
import { AdminSidebar } from './components/layout/AdminSidebar'
import { WhatsAppFAB } from './components/ui/WhatsAppFAB'
import { AnnouncementModal } from './components/ui/AnnouncementModal'

// Auth Pages
import { Login } from './pages/auth/Login'
import { Register } from './pages/auth/Register'

// Store Pages
import { Home } from './pages/store/Home'
import { DataBundles } from './pages/store/DataBundles'
import { CategoryPage } from './pages/store/CategoryPage'
import { Cart } from './pages/store/Cart'
import { Checkout } from './pages/store/Checkout'
import { OrderConfirmation } from './pages/store/OrderConfirmation'
import { Profile } from './pages/store/Profile'

// Admin Pages
import { Dashboard } from './pages/admin/Dashboard'
import { Users } from './pages/admin/Users'
import { Categories } from './pages/admin/Categories'
import { Products } from './pages/admin/Products'
import { DataPackages } from './pages/admin/DataPackages'
import { Orders } from './pages/admin/Orders'
import { Reports } from './pages/admin/Reports'
import { Settings } from './pages/admin/Settings'
import { Announcements } from './pages/admin/Announcements'
import { Rankings } from './pages/admin/Rankings'

const StoreLayout = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-transparent">
    <Navbar />
    <main className="flex-1 pt-16">{children}</main>
    <Footer />
    <WhatsAppFAB />
    <AnnouncementModal />
  </div>
)

const AdminLayout = ({ children }) => (
  <div className="min-h-screen bg-gray-50 flex">
    <AdminSidebar />
    <main className="flex-1 lg:ml-64 p-6 lg:p-8">{children}</main>
  </div>
)

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />
  if (requireAdmin && profile?.role !== 'admin') return <Navigate to="/" replace />

  return children
}

const AuthRedirect = ({ children }) => {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (user) {
    if (profile?.role === 'admin') return <Navigate to="/admin" replace />
    const from = location.state?.from || '/'
    const directBuyItem = location.state?.directBuyItem
    return <Navigate to={from} state={{ directBuyItem }} replace />
  }

  return children
}

const AppRoutes = () => (
  <Routes>
    {/* Auth Routes */}
    <Route path="/login" element={<AuthRedirect><Login /></AuthRedirect>} />
    <Route path="/register" element={<AuthRedirect><Register /></AuthRedirect>} />

    {/* Store Routes */}
    <Route path="/" element={<StoreLayout><Home /></StoreLayout>} />
    <Route path="/category/data-bundles" element={<StoreLayout><DataBundles /></StoreLayout>} />
    <Route path="/category/:slug" element={<StoreLayout><CategoryPage /></StoreLayout>} />
    <Route path="/cart" element={<StoreLayout><Cart /></StoreLayout>} />
    <Route path="/checkout" element={<ProtectedRoute><StoreLayout><Checkout /></StoreLayout></ProtectedRoute>} />
    <Route path="/order-confirmation" element={<ProtectedRoute><StoreLayout><OrderConfirmation /></StoreLayout></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><StoreLayout><Profile /></StoreLayout></ProtectedRoute>} />

    {/* Admin Routes */}
    <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminLayout><Dashboard /></AdminLayout></ProtectedRoute>} />
    <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminLayout><Users /></AdminLayout></ProtectedRoute>} />
    <Route path="/admin/categories" element={<ProtectedRoute requireAdmin><AdminLayout><Categories /></AdminLayout></ProtectedRoute>} />
    <Route path="/admin/products" element={<ProtectedRoute requireAdmin><AdminLayout><Products /></AdminLayout></ProtectedRoute>} />
    <Route path="/admin/data-packages" element={<ProtectedRoute requireAdmin><AdminLayout><DataPackages /></AdminLayout></ProtectedRoute>} />
    <Route path="/admin/orders" element={<ProtectedRoute requireAdmin><AdminLayout><Orders /></AdminLayout></ProtectedRoute>} />
    <Route path="/admin/reports" element={<ProtectedRoute requireAdmin><AdminLayout><Reports /></AdminLayout></ProtectedRoute>} />
    <Route path="/admin/announcements" element={<ProtectedRoute requireAdmin><AdminLayout><Announcements /></AdminLayout></ProtectedRoute>} />
    <Route path="/admin/rankings" element={<ProtectedRoute requireAdmin><AdminLayout><Rankings /></AdminLayout></ProtectedRoute>} />
    <Route path="/admin/settings" element={<ProtectedRoute requireAdmin><AdminLayout><Settings /></AdminLayout></ProtectedRoute>} />

    {/* Catch all */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
)

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
