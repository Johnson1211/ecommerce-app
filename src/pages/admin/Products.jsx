import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, AlertTriangle, Image, FileText, ToggleLeft, ToggleRight } from 'lucide-react'
import { supabase, uploadFile } from '../../lib/supabase'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import { formatCurrency } from '../../lib/helpers'

export const Products = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [deleteProduct, setDeleteProduct] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const imageInputRef = useRef(null)
  const fileInputRef = useRef(null)
  const { addToast } = useToast()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    stock: '',
    imageUrl: '',
    fileUrl: '',
    isActive: true,
    metadata: {},
  })

  const [laptopSpecs, setLaptopSpecs] = useState({
    ram: '',
    storage: '',
    cpu: '',
    gpu: '',
    display: '',
    os: '',
  })

  useEffect(() => { loadData() }, [categoryFilter])

  const loadData = async () => {
    setLoading(true)
    const [{ data: cats }, { data: prods }] = await Promise.all([
      supabase.from('categories').select('*').eq('is_active', true).order('name'),
      supabase.from('products')
        .select('*, category:categories(name)')
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
    ])
    if (cats) setCategories(cats)
    if (prods) {
      const filtered = categoryFilter === 'all' 
        ? prods 
        : prods.filter(p => p.category_id === categoryFilter)
      setProducts(filtered)
    }
    setLoading(false)
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const fileName = `products/${Date.now()}-${file.name}`
      const url = await uploadFile('product-images', file, fileName)
      setFormData(p => ({ ...p, imageUrl: url }))
      addToast('Image uploaded', 'success')
    } catch (error) {
      addToast('Image upload failed', 'error')
    }
    setUploadingImage(false)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingFile(true)
    try {
      const fileName = `digital/${Date.now()}-${file.name}`
      const url = await uploadFile('digital-files', file, fileName)
      setFormData(p => ({ ...p, fileUrl: url }))
      addToast('File uploaded', 'success')
    } catch (error) {
      addToast('File upload failed', 'error')
    }
    setUploadingFile(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const isLaptopCategory = categories.find(c => c.id === formData.categoryId)?.slug === 'laptops'
    const payload = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      category_id: formData.categoryId || null,
      stock: formData.stock === '' ? null : parseInt(formData.stock),
      image_url: formData.imageUrl || null,
      file_url: formData.fileUrl || null,
      is_active: formData.isActive,
      metadata: {
        ...formData.metadata,
        specs: isLaptopCategory ? {
          RAM: laptopSpecs.ram,
          Storage: laptopSpecs.storage,
          CPU: laptopSpecs.cpu,
          GPU: laptopSpecs.gpu,
          Display: laptopSpecs.display,
          OS: laptopSpecs.os,
        } : undefined
      },
    }

    try {
      if (editingProduct) {
        const { error } = await supabase.from('products').update(payload).eq('id', editingProduct.id)
        if (error) throw error
        addToast('Product updated', 'success')
      } else {
        const { error } = await supabase.from('products').insert(payload)
        if (error) throw error
        addToast('Product created', 'success')
      }
      setShowModal(false)
      setEditingProduct(null)
      resetForm()
      loadData()
    } catch (error) {
      addToast(error.message || 'Operation failed', 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteProduct) return
    try {
      const { error } = await supabase.from('products').delete().eq('id', deleteProduct.id)
      if (error) throw error
      addToast('Product deleted', 'success')
      setShowDeleteModal(false)
      setDeleteProduct(null)
      loadData()
    } catch (error) {
      addToast(error.message || 'Failed to delete', 'error')
    }
  }

  const handleToggleActive = async (product) => {
    try {
      const { error } = await supabase.from('products').update({ is_active: !product.is_active }).eq('id', product.id)
      if (error) throw error
      addToast(`Product ${product.is_active ? 'deactivated' : 'activated'}`, 'success')
      loadData()
    } catch (error) {
      addToast(error.message || 'Failed to toggle', 'error')
    }
  }

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '', categoryId: '', stock: '', imageUrl: '', fileUrl: '', isActive: true, metadata: {} })
    setLaptopSpecs({ ram: '', storage: '', cpu: '', gpu: '', display: '', os: '' })
  }

  const openEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      categoryId: product.category_id || '',
      stock: product.stock === null ? '' : product.stock.toString(),
      imageUrl: product.image_url || '',
      fileUrl: product.file_url || '',
      isActive: product.is_active,
      metadata: product.metadata || {},
    })
    const specs = product.metadata?.specs || {}
    setLaptopSpecs({
      ram: specs.RAM || '',
      storage: specs.Storage || '',
      cpu: specs.CPU || '',
      gpu: specs.GPU || '',
      display: specs.Display || '',
      os: specs.OS || '',
    })
    setShowModal(true)
  }

  const inputClass = "w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
  const textareaClass = "w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all min-h-[100px] resize-y"

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-1">Manage your store products</p>
        </div>
        <Button onClick={() => { setEditingProduct(null); resetForm(); setShowModal(true) }}>
          <Plus className="w-4 h-4 mr-2" />Add Product
        </Button>
      </div>

      <div className="mb-6">
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none bg-white">
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-6">Product</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-6">Category</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-6">Price</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-6">Stock</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-6">Status</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase py-3 px-6">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {product.image_url ? (
                              <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Image className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">{product.name}</p>
                            {product.file_url && <Badge variant="primary" className="text-xs mt-0.5">Digital</Badge>}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">{product.category?.name || '—'}</td>
                      <td className="py-4 px-6 font-medium text-sm text-gray-900">{formatCurrency(product.price)}</td>
                      <td className="py-4 px-6 text-sm text-gray-600">{product.stock === null ? '∞' : product.stock}</td>
                      <td className="py-4 px-6">
                        <button onClick={() => handleToggleActive(product)} className="p-1 rounded hover:bg-gray-200 transition-colors">
                          {product.is_active ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                        </button>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button onClick={() => openEdit(product)} className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors mr-1">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setDeleteProduct(product); setShowDeleteModal(true) }} className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {products.length === 0 && !loading && (
            <div className="text-center py-12"><p className="text-gray-500">No products found</p></div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingProduct ? 'Edit Product' : 'Add Product'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} className={inputClass} placeholder="Product name" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} className={textareaClass} placeholder="Product description" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (GHS)</label>
              <input type="number" step="0.01" min="0" required value={formData.price} onChange={(e) => setFormData(p => ({ ...p, price: e.target.value }))} className={inputClass} placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <select value={formData.categoryId} onChange={(e) => setFormData(p => ({ ...p, categoryId: e.target.value }))} className={inputClass}>
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock (leave empty for unlimited)</label>
              <input type="number" min="0" value={formData.stock} onChange={(e) => setFormData(p => ({ ...p, stock: e.target.value }))} className={inputClass} placeholder="Unlimited" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Image</label>
              <div className="flex gap-2">
                <input type="text" value={formData.imageUrl} onChange={(e) => setFormData(p => ({ ...p, imageUrl: e.target.value }))} className={inputClass} placeholder="Image URL or upload" />
                <input type="file" ref={imageInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                <Button type="button" variant="outline" size="sm" onClick={() => imageInputRef.current?.click()} loading={uploadingImage}>
                  <Image className="w-4 h-4" />
                </Button>
              </div>
              {formData.imageUrl && <img src={formData.imageUrl} alt="Preview" className="mt-2 w-20 h-20 object-cover rounded-lg" />}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Digital File (for downloads)</label>
              <div className="flex gap-2">
                <input type="text" value={formData.fileUrl} onChange={(e) => setFormData(p => ({ ...p, fileUrl: e.target.value }))} className={inputClass} placeholder="File URL or upload" />
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} loading={uploadingFile}>
                  <FileText className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {categories.find(c => c.id === formData.categoryId)?.slug === 'laptops' && (
              <div className="md:col-span-2 border-t pt-4 mt-2">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Laptop Specifications</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">RAM</label>
                    <input type="text" value={laptopSpecs.ram} onChange={(e) => setLaptopSpecs(p => ({ ...p, ram: e.target.value }))} className={inputClass} placeholder="e.g. 16GB DDR5" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Storage</label>
                    <input type="text" value={laptopSpecs.storage} onChange={(e) => setLaptopSpecs(p => ({ ...p, storage: e.target.value }))} className={inputClass} placeholder="e.g. 512GB NVMe SSD" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Processor (CPU)</label>
                    <input type="text" value={laptopSpecs.cpu} onChange={(e) => setLaptopSpecs(p => ({ ...p, cpu: e.target.value }))} className={inputClass} placeholder="e.g. Intel Core i7 13700H" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Graphics (GPU)</label>
                    <input type="text" value={laptopSpecs.gpu} onChange={(e) => setLaptopSpecs(p => ({ ...p, gpu: e.target.value }))} className={inputClass} placeholder="e.g. NVIDIA RTX 4060" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Display</label>
                    <input type="text" value={laptopSpecs.display} onChange={(e) => setLaptopSpecs(p => ({ ...p, display: e.target.value }))} className={inputClass} placeholder="e.g. 15.6' QHD 165Hz" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Operating System (OS)</label>
                    <input type="text" value={laptopSpecs.os} onChange={(e) => setLaptopSpecs(p => ({ ...p, os: e.target.value }))} className={inputClass} placeholder="e.g. Windows 11 Home" />
                  </div>
                </div>
              </div>
            )}
            <div className="md:col-span-2 flex items-center gap-2">
              <input type="checkbox" id="prodActive" checked={formData.isActive} onChange={(e) => setFormData(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500" />
              <label htmlFor="prodActive" className="text-sm text-gray-700">Active</label>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">{editingProduct ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Product" size="sm">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-gray-900 font-medium mb-2">Delete {deleteProduct?.name}?</p>
          <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)} className="flex-1">Cancel</Button>
            <Button variant="danger" onClick={handleDelete} className="flex-1">Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
