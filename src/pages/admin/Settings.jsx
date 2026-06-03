import { useState, useEffect } from 'react'
import { Save, Store, CreditCard, Mail } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'

export const Settings = () => {
  const [settings, setSettings] = useState({
    storeName: 'BIG-BENZ SHOP',
    logoUrl: '',
    contactEmail: '',
    paystackPublicKey: '',
  })
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const { data } = await supabase.from('store_settings').select('*').limit(1)
    if (data && data.length > 0) {
      const row = data[0]
      setSettings({
        storeName: row.store_name || 'BIG-BENZ SHOP',
        logoUrl: row.logo_url || '',
        contactEmail: row.contact_email || '',
        paystackPublicKey: row.paystack_public_key || '',
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data: existing } = await supabase.from('store_settings').select('id').limit(1)
      
      const payload = {
        store_name: settings.storeName,
        logo_url: settings.logoUrl,
        contact_email: settings.contactEmail,
        paystack_public_key: settings.paystackPublicKey,
        updated_at: new Date().toISOString(),
      }

      let error
      if (existing && existing.length > 0) {
        const result = await supabase.from('store_settings').update(payload).eq('id', existing[0].id)
        error = result.error
      } else {
        const result = await supabase.from('store_settings').insert(payload)
        error = result.error
      }

      if (error) throw error
      addToast('Settings saved', 'success')
      loadSettings()
    } catch (error) {
      addToast(error.message || 'Failed to save', 'error')
    }
    setLoading(false)
  }

  const inputClass = "w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Configure your store settings</p>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Store className="w-5 h-5 text-primary-600" />
              Store Configuration
            </h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Store Name</label>
                <input type="text" value={settings.storeName} onChange={(e) => setSettings(p => ({ ...p, storeName: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Logo URL</label>
                <input type="text" value={settings.logoUrl} onChange={(e) => setSettings(p => ({ ...p, logoUrl: e.target.value }))} className={inputClass} placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Contact Email
                </label>
                <input type="email" value={settings.contactEmail} onChange={(e) => setSettings(p => ({ ...p, contactEmail: e.target.value }))} className={inputClass} placeholder="support@store.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Paystack Public Key
                </label>
                <input type="text" value={settings.paystackPublicKey} onChange={(e) => setSettings(p => ({ ...p, paystackPublicKey: e.target.value }))} className={inputClass} placeholder="pk_test_..." />
                <p className="text-xs text-gray-500 mt-1.5">This is also set in your .env file as VITE_PAYSTACK_PUBLIC_KEY</p>
              </div>
              <div className="pt-2">
                <Button type="submit" loading={loading} className="w-full sm:w-auto">
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
