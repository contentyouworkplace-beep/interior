"use client"
import { useEffect, useState } from 'react'

export default function OrganizationsPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/super-admin/organizations')
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to load')
        setData(json.organizations || [])
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Organizations</h2>
      {loading && <div>Loading…</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2">Name</th>
                <th className="p-2">City</th>
                <th className="p-2">Plan</th>
                <th className="p-2">Status</th>
                <th className="p-2">Ends</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.organization_id} className="border-t">
                  <td className="p-2">{row.organization_name}</td>
                  <td className="p-2">{row.city || '-'}</td>
                  <td className="p-2">{row.plan_name || '-'}</td>
                  <td className="p-2">{row.status || '-'}</td>
                  <td className="p-2">{row.ends_on || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
