"use client"
import { useEffect, useState } from 'react'

export default function LicensesPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ organization_id: '', plan_code: 'STARTER', starts_on: '' })

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/super-admin/licenses')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load')
      setData(json.licenses || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/super-admin/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      setForm({ organization_id: '', plan_code: 'STARTER', starts_on: '' })
      await load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Licenses</h2>
      <form onSubmit={submit} className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="block text-xs">Organization ID</label>
          <input className="border px-2 py-1" value={form.organization_id} onChange={(e) => setForm({ ...form, organization_id: e.target.value })} required />
        </div>
        <div>
          <label className="block text-xs">Plan Code</label>
          <input className="border px-2 py-1" value={form.plan_code} onChange={(e) => setForm({ ...form, plan_code: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs">Starts On</label>
          <input type="date" className="border px-2 py-1" value={form.starts_on} onChange={(e) => setForm({ ...form, starts_on: e.target.value })} />
        </div>
        <button type="submit" className="px-3 py-1 border rounded" disabled={creating}>{creating ? 'Creating…' : 'Create'}</button>
      </form>

      {loading && <div>Loading…</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2">Org</th>
                <th className="p-2">Plan</th>
                <th className="p-2">Status</th>
                <th className="p-2">Start</th>
                <th className="p-2">End</th>
                <th className="p-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="p-2">{row.organizations?.name || row.organization_id}</td>
                  <td className="p-2">{row.subscription_plans?.code}</td>
                  <td className="p-2">{row.status}</td>
                  <td className="p-2">{row.starts_on}</td>
                  <td className="p-2">{row.ends_on || '-'}</td>
                  <td className="p-2">{row.amount_cents ? `₹${(row.amount_cents/100).toFixed(2)}` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
