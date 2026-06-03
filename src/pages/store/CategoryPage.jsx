import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ProductCard } from '../../components/store/ProductCard'
import { ProductSkeleton } from '../../components/ui/Skeleton'
import { Badge } from '../../components/ui/Badge'

export const CategoryPage = () => {
  const { slug } = useParams()
  const [category, setCategory] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCategoryData()
  }, [slug])

  const loadCategoryData = async () => {
    setLoading(true)

    const { data: catData } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single()

    if (catData) {
      setCategory(catData)
      const { data: prodData } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', catData.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (prodData) setProducts(prodData)
    }

    setLoading(false)
  }

  if (!category && !loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Category Not Found</h2>
        <p className="text-gray-600">The category you're looking for doesn't exist.</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{category?.icon}</span>
          <h1 className="text-3xl font-bold text-gray-900">{category?.name}</h1>
        </div>
        <p className="text-gray-600">{products.length} product{products.length !== 1 ? 's' : ''} available</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => <ProductSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {products.length === 0 && !loading && (
        <div className="text-center py-20">
          <Badge variant="outline" className="text-lg px-4 py-2">
            No products in this category yet
          </Badge>
        </div>
      )}
    </div>
  )
}
