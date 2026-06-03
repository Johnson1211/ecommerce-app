import { useState, useEffect } from 'react'
import { Search, Plus, Trash2, User, ChevronDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import { formatDate } from '../../lib/helpers'

export const Users = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const { addToast } = useToast()

  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', phone: '', role: 'user',
  })

  useEffect(() => { loadUsers() }, [])

  const loadUsers = async () => {
    setLoading(true)
    let query = supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (roleFilter !== 'all') query = query.eq('role', roleFilter)
    const { data } = await query
    if (data) setUsers(data)
    setLoading(false)
  }

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddUser = async (e) => {
    e.preventDefault()
    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { full_name: formData.fullName, role: formData.role, phone: formData.phone } },
      })
      if (error) throw error
      addToast('User created successfully', 'success')
      setShowAddModal(false)
      setFormData({ fullName: '', email: '', password: '', phone: '', role: 'user' })
      loadUsers()
    } catch (error) {
      addToast(error.message || 'Failed to create user', 'error')
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', selectedUser.id)
      if (error) throw error
      addToast('User deleted', 'success')
      setShowDeleteModal(false)
      setSelectedUser(null)
      loadUsers()
    } catch (error) {
      addToast(error.message || 'Failed to delete', 'error')
    }
  }

  const handleUpdateRole = async (userId, newRole) => {
    try {
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
      if (error) throw error
      addToast(`Role updated to ${newRole}`, 'success')
      loadUsers()
    } catch (error) {
      addToast(error.message || 'Failed to update role', 'error')
    }
  }

  const inputClass = "w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">Manage your store users and admins</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search users..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none bg-white">
          <option value="all">All Roles</option>
          <option value="user">Users</option>
          <option value="admin">Admins</option>
        </select>
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
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-6">User</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-6">Role</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-6">Phone</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-6">Joined</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase py-3 px-6">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-primary-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">{user.full_name || 'No Name'}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="relative inline-block">
                          <select value={user.role} onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                            className="appearance-none bg-transparent pr-8 py-1 text-sm font-medium focus:outline-none cursor-pointer">
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                          <ChevronDown className="w-4 h-4 text-gray-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">{user.phone || '—'}</td>
                      <td className="py-4 px-6 text-sm text-gray-500">{formatDate(user.created_at)}</td>
                      <td className="py-4 px-6 text-right">
                        <button onClick={() => { setSelectedUser(user); setShowDeleteModal(true) }}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {filteredUsers.length === 0 && !loading && (
            <div className="text-center py-12"><p className="text-gray-500">No users found</p></div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New User" size="md">
        <form onSubmit={handleAddUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <input type="text" required value={formData.fullName}
              onChange={(e) => setFormData(p => ({ ...p, fullName: e.target.value }))}
              className={inputClass} placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input type="email" required value={formData.email}
              onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
              className={inputClass} placeholder="user@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <input type="password" required minLength={6} value={formData.password}
              onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
              className={inputClass} placeholder="Min 6 characters" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
            <input type="tel" value={formData.phone}
              onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
              className={inputClass} placeholder="+233 20 123 4567" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
            <select value={formData.role} onChange={(e) => setFormData(p => ({ ...p, role: e.target.value }))}
              className={inputClass}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1"><Plus className="w-4 h-4 mr-2" />Create User</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete User" size="sm">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-gray-900 font-medium mb-2">Are you sure?</p>
          <p className="text-sm text-gray-500 mb-6">This will permanently delete {selectedUser?.full_name || 'this user'}.</p>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)} className="flex-1">Cancel</Button>
            <Button variant="danger" onClick={handleDeleteUser} className="flex-1">Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
