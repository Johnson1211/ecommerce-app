import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Megaphone, ToggleLeft, ToggleRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'

export const Announcements = () => {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingAnn, setEditingAnn] = useState(null)
  const [deleteAnn, setDeleteAnn] = useState(null)
  const { addToast } = useToast()

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    imageUrl: '',
    isActive: true,
  })

  useEffect(() => {
    loadAnnouncements()
  }, [])

  const loadAnnouncements = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) setAnnouncements(data)
    } catch (err) {
      addToast(err.message || 'Failed to load announcements', 'error')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ title: '', content: '', imageUrl: '', isActive: true })
  }

  const openEdit = (ann) => {
    setEditingAnn(ann)
    setFormData({
      title: ann.title,
      content: ann.content,
      imageUrl: ann.image_url || '',
      isActive: ann.is_active,
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.title || !formData.content) {
      addToast('Please fill in title and content fields', 'error')
      return
    }

    const payload = {
      title: formData.title.trim(),
      content: formData.content.trim(),
      image_url: formData.imageUrl.trim() || null,
      is_active: formData.isActive,
    }

    try {
      // If setting this announcement to active, deactivate all others
      if (payload.is_active) {
        await supabase
          .from('announcements')
          .update({ is_active: false })
          .eq('is_active', true)
      }

      if (editingAnn) {
        const { error } = await supabase
          .from('announcements')
          .update(payload)
          .eq('id', editingAnn.id)

        if (error) throw error
        addToast('Announcement updated successfully', 'success')
      } else {
        const { error } = await supabase
          .from('announcements')
          .insert(payload)

        if (error) throw error
        addToast('Announcement created successfully', 'success')
      }

      setShowModal(false)
      setEditingAnn(null)
      resetForm()
      loadAnnouncements()
    } catch (error) {
      addToast(error.message || 'Failed to save announcement', 'error')
    }
  }

  const handleToggleActive = async (ann) => {
    try {
      const targetState = !ann.is_active

      // Deactivate other announcements first if setting to true
      if (targetState) {
        await supabase
          .from('announcements')
          .update({ is_active: false })
          .eq('is_active', true)
      }

      const { error } = await supabase
        .from('announcements')
        .update({ is_active: targetState })
        .eq('id', ann.id)

      if (error) throw error
      addToast(`Announcement ${targetState ? 'activated' : 'deactivated'}`, 'success')
      loadAnnouncements()
    } catch (error) {
      addToast(error.message || 'Failed to toggle status', 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteAnn) return
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', deleteAnn.id)

      if (error) throw error
      addToast('Announcement deleted successfully', 'success')
      setShowDeleteModal(false)
      setDeleteAnn(null)
      loadAnnouncements()
    } catch (error) {
      addToast(error.message || 'Failed to delete announcement', 'error')
    }
  }

  const inputClass = "w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all text-sm"

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-500 mt-1">Manage global notifications & alert popups shown to users</p>
        </div>
        <Button onClick={() => { setEditingAnn(null); resetForm(); setShowModal(true) }}>
          <Plus className="w-4 h-4 mr-2" />Add Announcement
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                    <th className="py-3 px-6">Announcement Details</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {announcements.map(ann => (
                    <tr key={ann.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 text-amber-500">
                            <Megaphone className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-gray-900 text-sm">{ann.title}</h4>
                            <p className="text-xs text-gray-500 line-clamp-2 mt-1 whitespace-pre-line">{ann.content}</p>
                            {ann.image_url && (
                              <p className="text-[10px] text-primary-500 font-mono mt-1 truncate">{ann.image_url}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <button 
                          onClick={() => handleToggleActive(ann)} 
                          className="flex items-center gap-1 cursor-pointer focus:outline-none"
                        >
                          {ann.is_active ? (
                            <span className="flex items-center text-green-600 text-xs font-semibold gap-1">
                              <ToggleRight className="w-6 h-6 text-green-500" />
                              Active Notice
                            </span>
                          ) : (
                            <span className="flex items-center text-gray-400 text-xs font-medium gap-1">
                              <ToggleLeft className="w-6 h-6 text-gray-300" />
                              Inactive
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEdit(ann)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-red-500 hover:bg-red-50"
                            onClick={() => { setDeleteAnn(ann); setShowDeleteModal(true) }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {announcements.length === 0 && !loading && (
            <div className="text-center py-16">
              <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No announcements configured yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Announcement Modal */}
      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title={editingAnn ? 'Edit Announcement' : 'Create Announcement'} 
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Announcement Title *</label>
            <input 
              type="text" 
              required 
              value={formData.title}
              onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
              className={inputClass} 
              placeholder="e.g. MTN (Yello) Delivery Delays" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Announcement Message *</label>
            <textarea 
              required 
              rows={4}
              value={formData.content}
              onChange={(e) => setFormData(p => ({ ...p, content: e.target.value }))}
              className={inputClass} 
              placeholder="Describe the notice detailedly..." 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Image URL (Optional)</label>
            <input 
              type="text" 
              value={formData.imageUrl}
              onChange={(e) => setFormData(p => ({ ...p, imageUrl: e.target.value }))}
              className={inputClass} 
              placeholder="Leave empty for the default system template image" 
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              id="annActive" 
              checked={formData.isActive} 
              onChange={(e) => setFormData(p => ({ ...p, isActive: e.target.checked }))} 
              className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500" 
            />
            <label htmlFor="annActive" className="text-sm font-medium text-gray-700 select-none">
              Make Active (deactivates previous notices)
            </label>
          </div>

          <div className="flex gap-3 pt-3 border-t">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">{editingAnn ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        title="Delete Announcement" 
        size="sm"
      >
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-gray-900 font-medium mb-2">Are you sure?</p>
          <p className="text-sm text-gray-500 mb-6">This will delete "{deleteAnn?.title}" permanently.</p>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)} className="flex-1">Cancel</Button>
            <Button variant="danger" onClick={handleDelete} className="flex-1">Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
