import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Download, Eye, Image } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { useToast } from '../ui/Toast'
import { Modal } from '../ui/Modal'
import { formatCurrency } from '../../lib/helpers'

export const ProductCard = ({ product }) => {
  const { addToCart } = useCart()
  const { addToast } = useToast()
  const [showSpecsModal, setShowSpecsModal] = useState(false)

  const handleAddToCart = () => {
    addToCart(product)
    addToast(`${product.name} added to cart`, 'success')
  }

  const isDigital = !!product.file_url
  const hasStock = product.stock === null || product.stock > 0

  return (
    <div className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Image className="w-12 h-12" />
          </div>
        )}

        {isDigital && (
          <Badge variant="primary" className="absolute top-3 left-3">
            <Download className="w-3 h-3 mr-1" />
            Digital
          </Badge>
        )}

        {!hasStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="danger" className="text-sm">Out of Stock</Badge>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1">
          {product.name}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">
          {product.description}
        </p>

        {product.metadata?.specs && (
          <div className="flex flex-wrap gap-1 mb-3">
            {Object.entries(product.metadata.specs).slice(0, 2).map(([key, value]) => value && (
              <Badge key={key} variant="outline" className="text-xs">
                {value}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary-600">
            {formatCurrency(product.price)}
          </span>
          <div className="flex gap-2">
            {product.metadata?.specs && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSpecsModal(true)}
                title="View Specs"
              >
                <Eye className="w-4 h-4" />
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleAddToCart}
              disabled={!hasStock}
            >
              <ShoppingCart className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </div>

      {/* Product Specifications & Details Modal */}
      <Modal
        isOpen={showSpecsModal}
        onClose={() => setShowSpecsModal(false)}
        title={product.name}
        size="md"
      >
        <div className="space-y-6">
          <div className="aspect-video w-full rounded-xl overflow-hidden bg-gray-100">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Image className="w-12 h-12" />
              </div>
            )}
          </div>

          <div>
            <span className="text-2xl font-bold text-primary-600">{formatCurrency(product.price)}</span>
            <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{product.description}</p>
          </div>

          {product.metadata?.specs && (
            <div className="border-t pt-4">
              <h5 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wider">Specifications</h5>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                {Object.entries(product.metadata.specs).map(([key, value]) => value && (
                  <div key={key} className="space-y-1">
                    <span className="text-xs text-gray-500 font-medium block">{key}</span>
                    <span className="text-sm text-gray-800 font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 border-t pt-4">
            <Button
              variant="ghost"
              onClick={() => setShowSpecsModal(false)}
              className="flex-1"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                handleAddToCart()
                setShowSpecsModal(false)
              }}
              disabled={!hasStock}
              className="flex-1"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
