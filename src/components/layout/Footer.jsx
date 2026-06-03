import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin } from 'lucide-react'

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">TS</span>
              </div>
              <span className="text-xl font-bold text-white">TechStore</span>
            </div>
            <p className="text-sm text-gray-400">
              Your one-stop shop for premium electronics, data bundles, and digital products in Ghana.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-primary-400 transition-colors">Home</Link></li>
              <li><Link to="/category/data-bundles" className="hover:text-primary-400 transition-colors">Data Bundles</Link></li>
              <li><Link to="/category/laptops" className="hover:text-primary-400 transition-colors">Laptops</Link></li>
              <li><Link to="/category/phones" className="hover:text-primary-400 transition-colors">Phones</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Categories</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/category/psd-files" className="hover:text-primary-400 transition-colors">PSD Files</Link></li>
              <li><Link to="/category/t-shirts" className="hover:text-primary-400 transition-colors">T-Shirts</Link></li>
              <li><Link to="/cart" className="hover:text-primary-400 transition-colors">Cart</Link></li>
              <li><Link to="/profile" className="hover:text-primary-400 transition-colors">My Account</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary-400" />
                support@techstore.com
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary-400" />
                +233 20 123 4567
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-400" />
                Accra, Ghana
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
          <p>© 2026 TechStore. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
