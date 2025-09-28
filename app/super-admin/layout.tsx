import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { isSuperAdmin } from '@/lib/auth/isSuperAdmin'

export default async function SuperAdminLayout({ children }: { children: ReactNode }) {
  const allowed = await isSuperAdmin()
  if (!allowed) redirect('/dashboard')
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Super Admin</h1>
      <nav className="flex gap-4 mb-6 text-sm">
        <a href="/super-admin" className="underline">Overview</a>
        <a href="/super-admin/organizations" className="underline">Organizations</a>
        <a href="/super-admin/licenses" className="underline">Licenses</a>
      </nav>
      {children}
    </div>
  )
}
