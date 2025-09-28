import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const vendorId = searchParams.get("vendorId")

  if (!vendorId) {
    return NextResponse.json({ 
      error: "Vendor ID is required" 
    }, { status: 400 })
  }

  // Return demo data for any vendor ID - this is a pure fallback API
  // with no actual database dependencies to ensure we always have a response
  
  const demoFiles = [
    {
      id: `demo-${vendorId}-1`,
      vendor_id: vendorId,
      file_name: "Vendor Contract.pdf",
      file_path: `vendors/${vendorId}/contract.pdf`,
      file_type: "pdf",
      file_size: 1254789,
      description: "Master service agreement",
      category: "Contract",
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      uploaded_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
    },
    {
      id: `demo-${vendorId}-2`,
      vendor_id: vendorId,
      file_name: "Price List 2025.xlsx",
      file_path: `vendors/${vendorId}/price-list.xlsx`,
      file_type: "xlsx",
      file_size: 587432,
      description: "Current year price catalog",
      category: "Pricing",
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
      uploaded_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() // 15 days ago
    },
    {
      id: `demo-${vendorId}-3`,
      vendor_id: vendorId,
      file_name: "Material Sample.jpg",
      file_path: `vendors/${vendorId}/sample.jpg`,
      file_type: "jpg",
      file_size: 1845632,
      description: "High-res photo of fabric sample",
      category: "Samples",
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      uploaded_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
    }
  ]
    
  return NextResponse.json({
    data: demoFiles,
    notice: "Using demo data - this is not real data from your database",
    fallback: true
  })
}