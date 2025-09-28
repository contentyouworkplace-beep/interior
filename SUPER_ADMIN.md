# Super Admin & Licensing

This adds a platform-level Super Admin to manage interior design businesses (organizations), licenses/plans, and city-wise sales insights.

What’s included
- Database: platform_admins, subscription_plans, licenses, view orgs_with_license, function is_super_admin().
- RLS: Only super admins can manage platform tables; additive super admin policies on org-related tables.
- API: /api/super-admin/organizations, /api/super-admin/licenses.
- UI: /super-admin dashboard with Overview, Organizations, and Licenses pages.

Setup
1) Apply migration in Supabase SQL editor (or your migration runner):
   supabase/migrations/20250922_super_admin.sql

2) Seed a super admin user (replace with your auth user id):
   INSERT INTO public.platform_admins(user_id) VALUES ('<your-user-id>')
   ON CONFLICT (user_id) DO NOTHING;

3) Optional: app_metadata role shortcut
   You can also set auth.users.app_metadata.role = 'super_admin' for quick local gating (still uses DB check as source of truth).

City-wise reporting
- licenses.sales_city captures the sales location per license; orgs_with_license also pulls city from company_profiles.city if not set.
- Build charts in /super-admin using this view (e.g., group by city, plan, status).

Next steps
- Payment integration for license purchases (Razorpay/Stripe) and webhooks.
- Seat enforcement using organization_members counts vs plan.max_users.
- Expiry automation: scheduled job to set status = 'expired' when ends_on < today.

Security notes
- All platform tables are RLS-enabled. Policies restrict write access to super admins only.
- Existing org-member RLS remains intact; super admins get additive manage-all policies.