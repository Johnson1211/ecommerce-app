import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import { slugify } from '../../lib/helpers'

export const Categories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [deleteCategory, setDeleteCategory] = useState(null)
  const [productCount, setProductCount] = useState(0)
  const { addToast } = useToast()

  const [formData, setFormData] = useState({ name: '', slug: '', icon: '📦', isActive: true })

  useEffect(() => { loadCategories() }, [])

  const loadCategories = async () => {
    setLoading(true)
    const { data } = await supabase.from('categories').select('*').order('name')
    if (data) setCategories(data)
    setLoading(false)
  }

  const checkProducts = async (categoryId) => {
    const { count } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('category_id', categoryId)
    setProductCount(count || 0)
    return count || 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = { name: formData.name, slug: formData.slug || slugify(formData.name), icon: formData.icon, is_active: formData.isActive }
    try {
      if (editingCategory) {
        const { error } = await supabase.from('categories').update(payload).eq('id', editingCategory.id)
        if (error) throw error
        addToast('Category updated', 'success')
      } else {
        const { error } = await supabase.from('categories').insert(payload)
        if (error) throw error
        addToast('Category created', 'success')
      }
      setShowModal(false)
      setEditingCategory(null)
      setFormData({ name: '', slug: '', icon: '📦', isActive: true })
      loadCategories()
    } catch (error) {
      addToast(error.message || 'Operation failed', 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteCategory) return
    try {
      const { error } = await supabase.from('categories').delete().eq('id', deleteCategory.id)
      if (error) throw error
      addToast('Category deleted', 'success')
      setShowDeleteModal(false)
      setDeleteCategory(null)
      loadCategories()
    } catch (error) {
      addToast(error.message || 'Failed to delete', 'error')
    }
  }

  const openEdit = (category) => {
    setEditingCategory(category)
    setFormData({ name: category.name, slug: category.slug, icon: category.icon, isActive: category.is_active })
    setShowModal(true)
  }

  const openDelete = async (category) => {
    await checkProducts(category.id)
    setDeleteCategory(category)
    setShowDeleteModal(true)
  }

  const inputClass = "w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500 mt-1">Manage product categories</p>
        </div>
        <Button onClick={() => { setEditingCategory(null); setFormData({ name: '', slug: '', icon: '📦', isActive: true }); setShowModal(true) }}>
          <Plus className="w-4 h-4 mr-2" />Add Category
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-6">Icon</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-6">Name</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-6">Slug</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-6">Status</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase py-3 px-6">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(cat => (
                    <tr key={cat.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 text-2xl">{cat.icon}</td>
                      <td className="py-4 px-6 font-medium text-gray-900">{cat.name}</td>
                      <td className="py-4 px-6 text-sm text-gray-500 font-mono">{cat.slug}</td>
                      <td className="py-4 px-6">
                        <Badge variant={cat.is_active ? 'success' : 'default'}>{cat.is_active ? 'Active' : 'Inactive'}</Badge>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button onClick={() => openEdit(cat)} className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors mr-1">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => openDelete(cat)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingCategory ? 'Edit Category' : 'Add Category'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
            <input type="text" required value={formData.name}
              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value, slug: slugify(e.target.value) }))}
              className={inputClass} placeholder="e.g. Laptops" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug</label>
            <input type="text" value={formData.slug}
              onChange={(e) => setFormData(p => ({ ...p, slug: e.target.value }))}
              className={inputClass} placeholder="auto-generated" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Icon (emoji)</label>
            <input type="text" value={formData.icon}
              onChange={(e) => setFormData(p => ({ ...p, icon: e.target.value }))}
              className={inputClass} placeholder="📦" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" checked={formData.isActive}
              onChange={(e) => setFormData(p => ({ ...p, isActive: e.target.checked }))}
              className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500" />
            <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">{editingCategory ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Category" size="sm">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-gray-900 font-medium mb-2">Delete {deleteCategory?.name}?</p>
          {productCount > 0 && (
            <p className="text-sm text-red-600 mb-2">Warning: {productCount} product(s) exist under this category.</p>
          )}
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
