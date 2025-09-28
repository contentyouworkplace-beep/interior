import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(request)
    
    // Apply the branding RLS fix
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
-- Fix branding table RLS policies
DROP POLICY IF EXISTS "branding_policy" ON public.branding;
DROP POLICY IF EXISTS "org_members_select_branding" ON public.branding;
DROP POLICY IF EXISTS "org_members_insert_branding" ON public.branding;
DROP POLICY IF EXISTS "org_members_update_branding" ON public.branding;

-- Create separate policies for different operations
CREATE POLICY "branding_select_policy" ON public.branding 
FOR SELECT USING (
  auth.uid() IN (
    SELECT om.user_id 
    FROM public.organization_members om 
    WHERE om.organization_id = branding.organization_id
  )
);

CREATE POLICY "branding_insert_policy" ON public.branding 
FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT om.user_id 
    FROM public.organization_members om 
    WHERE om.organization_id = branding.organization_id
  )
);

CREATE POLICY "branding_update_policy" ON public.branding 
FOR UPDATE USING (
  auth.uid() IN (
    SELECT om.user_id 
    FROM public.organization_members om 
    WHERE om.organization_id = branding.organization_id
  )
) WITH CHECK (
  auth.uid() IN (
    SELECT om.user_id 
    FROM public.organization_members om 
    WHERE om.organization_id = branding.organization_id
  )
);`
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Branding RLS policies fixed successfully' 
    })
  } catch (error) {
    console.error('Fix branding RLS error:', error)
    return NextResponse.json({ 
      error: 'Failed to fix branding RLS policies' 
    }, { status: 500 })
  }
}