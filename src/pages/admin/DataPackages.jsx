import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, AlertTriangle, ToggleLeft, ToggleRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import { formatCurrency } from '../../lib/helpers'

const networks = ['MTN', 'AirtelTigo', 'Telecel']

export const DataPackages = () => {
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [networkFilter, setNetworkFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingPkg, setEditingPkg] = useState(null)
  const [deletePkg, setDeletePkg] = useState(null)
  const { addToast } = useToast()

  const [formData, setFormData] = useState({
    network: 'MTN',
    sizeGb: '',
    label: '',
    price: '',
    validityDays: 30,
    isActive: true,
  })

  useEffect(() => { loadPackages() }, [networkFilter])

  const loadPackages = async () => {
    setLoading(true)
    let query = supabase.from('data_packages').select('*').order('size_gb')
    if (networkFilter !== 'all') query = query.eq('network', networkFilter)
    const { data } = await query
    if (data) setPackages(data)
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      network: formData.network,
      size_gb: parseFloat(formData.sizeGb),
      label: formData.label,
      price: parseFloat(formData.price),
      validity_days: parseInt(formData.validityDays),
      is_active: formData.isActive,
    }

    try {
      if (editingPkg) {
        const { error } = await supabase.from('data_packages').update(payload).eq('id', editingPkg.id)
        if (error) throw error
        addToast('Package updated', 'success')
      } else {
        const { error } = await supabase.from('data_packages').insert(payload)
        if (error) throw error
        addToast('Package created', 'success')
      }
      setShowModal(false)
      setEditingPkg(null)
      resetForm()
      loadPackages()
    } catch (error) {
      addToast(error.message || 'Operation failed', 'error')
    }
  }

  const handleDelete = async () => {
    if (!deletePkg) return
    try {
      const { error } = await supabase.from('data_packages').delete().eq('id', deletePkg.id)
      if (error) throw error
      addToast('Package deleted', 'success')
      setShowDeleteModal(false)
      setDeletePkg(null)
      loadPackages()
    } catch (error) {
      addToast(error.message || 'Failed to delete', 'error')
    }
  }

  const handleToggleActive = async (pkg) => {
    try {
      const { error } = await supabase.from('data_packages').update({ is_active: !pkg.is_active }).eq('id', pkg.id)
      if (error) throw error
      addToast(`Package ${pkg.is_active ? 'deactivated' : 'activated'}`, 'success')
      loadPackages()
    } catch (error) {
      addToast(error.message || 'Failed to toggle', 'error')
    }
  }

  const resetForm = () => {
    setFormData({ network: 'MTN', sizeGb: '', label: '', price: '', validityDays: 30, isActive: true })
  }

  const openEdit = (pkg) => {
    setEditingPkg(pkg)
    setFormData({
      network: pkg.network,
      sizeGb: pkg.size_gb.toString(),
      label: pkg.label,
      price: pkg.price.toString(),
      validityDays: pkg.validity_days,
      isActive: pkg.is_active,
    })
    setShowModal(true)
  }

  const inputClass = "w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"

  const groupedPackages = networks.reduce((acc, network) => {
    acc[network] = packages.filter(p => p.network === network)
    return acc
  }, {})

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Packages</h1>
          <p className="text-gray-500 mt-1">Manage mobile data bundles</p>
        </div>
        <Button onClick={() => { setEditingPkg(null); resetForm(); setShowModal(true) }}>
          <Plus className="w-4 h-4 mr-2" />Add Package
        </Button>
      </div>

      <div className="mb-6">
        <select value={networkFilter} onChange={(e) => setNetworkFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none bg-white">
          <option value="all">All Networks</option>
          {networks.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <Skeleton className="h-6 w-24 mb-3" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, j) => <Skeleton key={j} className="h-32" />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {(networkFilter === 'all' ? networks : [networkFilter]).map(network => {
            const pkgs = groupedPackages[network] || []
            if (pkgs.length === 0 && networkFilter !== 'all') return null
            return (
              <div key={network}>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Badge variant="primary">{network}</Badge>
                  <span className="text-sm font-normal text-gray-500">({pkgs.length} packages)</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {pkgs.map(pkg => (
                    <Card key={pkg.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="primary" className="text-xs">{pkg.network}</Badge>
                          <button onClick={() => handleToggleActive(pkg)} className="p-1 rounded hover:bg-gray-100">
                            {pkg.is_active ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                          </button>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{pkg.label}</h3>
                        <p className="text-sm text-gray-500 mb-3">{pkg.validity_days} days validity</p>
                        <p className="text-2xl font-bold text-primary-600 mb-4">{formatCurrency(pkg.price)}</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(pkg)}>
                            <Pencil className="w-3 h-3 mr-1" />Edit
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => { setDeletePkg(pkg); setShowDeleteModal(true) }}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {packages.length === 0 && !loading && (
        <div className="text-center py-12"><p className="text-gray-500">No data packages found</p></div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingPkg ? 'Edit Package' : 'Add Package'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Network</label>
            <select value={formData.network} onChange={(e) => setFormData(p => ({ ...p, network: e.target.value }))} className={inputClass}>
              {networks.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Size (GB)</label>
              <input type="number" step="0.5" min="0.5" required value={formData.sizeGb} onChange={(e) => setFormData(p => ({ ...p, sizeGb: e.target.value }))} className={inputClass} placeholder="e.g. 5" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Label</label>
              <input type="text" required value={formData.label} onChange={(e) => setFormData(p => ({ ...p, label: e.target.value }))} className={inputClass} placeholder="e.g. 5GB" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (GHS)</label>
              <input type="number" step="0.01" min="0" required value={formData.price} onChange={(e) => setFormData(p => ({ ...p, price: e.target.value }))} className={inputClass} placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Validity (days)</label>
              <input type="number" min="1" required value={formData.validityDays} onChange={(e) => setFormData(p => ({ ...p, validityDays: e.target.value }))} className={inputClass} placeholder="30" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="pkgActive" checked={formData.isActive} onChange={(e) => setFormData(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500" />
            <label htmlFor="pkgActive" className="text-sm text-gray-700">Active</label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">{editingPkg ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Package" size="sm">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-gray-900 font-medium mb-2">Delete {deletePkg?.label}?</p>
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
