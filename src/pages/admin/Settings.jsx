import { useState, useEffect } from 'react'
import { Save, Store, CreditCard, Mail, AlertTriangle } from 'lucide-react'
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
    momoNumber: '',
    momoNetwork: 'MTN',
    momoName: '',
    isMaintenance: false,
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
        momoNumber: row.momo_number || '',
        momoNetwork: row.momo_network || 'MTN',
        momoName: row.momo_name || '',
        isMaintenance: row.is_maintenance || false,
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
        momo_number: settings.momoNumber,
        momo_network: settings.momoNetwork,
        momo_name: settings.momoName,
        is_maintenance: settings.isMaintenance,
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
              <div className="border-t pt-5 mt-5">
                <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary-600" />
                  Direct MoMo Payments Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">MoMo Network</label>
                    <select
                      value={settings.momoNetwork}
                      onChange={(e) => setSettings(p => ({ ...p, momoNetwork: e.target.value }))}
                      className={inputClass}
                    >
                      <option value="MTN">MTN MoMo</option>
                      <option value="Telecel">Telecel Cash</option>
                      <option value="AirtelTigo">AirtelTigo Money</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">MoMo Number</label>
                    <input
                      type="text"
                      value={settings.momoNumber}
                      onChange={(e) => setSettings(p => ({ ...p, momoNumber: e.target.value }))}
                      className={inputClass}
                      placeholder="0558802783"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">MoMo Account Name</label>
                    <input
                      type="text"
                      value={settings.momoName}
                      onChange={(e) => setSettings(p => ({ ...p, momoName: e.target.value }))}
                      className={inputClass}
                      placeholder="Joyce Marfo"
                    />
                  </div>
                </div>
              </div>

              {/* Maintenance Mode */}
              <div className="border-t pt-5 mt-5">
                <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-505 text-amber-500" />
                  System Status & Maintenance
                </h3>
                <div className="flex items-center gap-2.5 bg-amber-50/50 border border-amber-100 p-4 rounded-xl">
                  <input
                    type="checkbox"
                    id="isMaintenance"
                    checked={settings.isMaintenance}
                    onChange={(e) => setSettings(p => ({ ...p, isMaintenance: e.target.checked }))}
                    className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500 cursor-pointer"
                  />
                  <label htmlFor="isMaintenance" className="text-sm text-gray-805 text-gray-800 font-semibold select-none cursor-pointer">
                    Enable Maintenance Mode (closes the storefront to customers)
                  </label>
                </div>
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
