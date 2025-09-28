import { createClient } from '@/lib/supabase/server'

export default async function SuperAdminOverviewPage() {
  const supabase = createClient() as any

  const [{ data: orgs }, { data: plans }, { data: activeLicenses }] = await Promise.all([
    supabase.from('orgs_with_license').select('organization_id').then((r: any) => ({ data: r.data })),
    supabase.from('subscription_plans').select('id').then((r: any) => ({ data: r.data })),
    supabase.from('licenses').select('id').eq('status', 'active').then((r: any) => ({ data: r.data })),
  ])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Organizations" value={orgs?.length || 0} />
        <Stat label="Active Licenses" value={activeLicenses?.length || 0} />
        <Stat label="Plans" value={plans?.length || 0} />
      </div>
      <p className="text-sm text-muted-foreground">This is a minimal overview. Build charts and city-wise reports here.</p>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border p-4">
      <div className="text-muted-foreground text-sm">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  )
}
