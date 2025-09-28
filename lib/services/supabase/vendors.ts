import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

const supabase = createClient()

export async function addVendor(vendor: Omit<Database['public']['Tables']['vendors']['Insert'], 'id' | 'created_at' | 'updated_at'>) {
  return supabase.from('vendors').insert([vendor]).select()
}

export async function listVendors() {
  return supabase.from('vendors').select('*')
}

export async function linkVendorToProject(vendorId: string, projectId: string) {
  return supabase.from('vendor_projects').insert([{ vendor_id: vendorId, project_id: projectId }]).select()
}

export async function uploadVendorQuotation(vendorId: string, projectId: string, fileUrl: string, description?: string) {
  return supabase.from('vendor_quotations').insert([{ vendor_id: vendorId, project_id: projectId, file_url: fileUrl, description }]).select()
}
