import { NextResponse } from "next/server"

// Fallback demo data for vendor files when database connection fails
const DEMO_VENDOR_FILES = {
  "demo-vendor-1": [
    {
      id: "demofile1",
      vendor_id: "demo-vendor-1",
      file_name: "contract-agreement.pdf",
      file_path: "vendors/demo-vendor-1/contract-agreement.pdf",
      file_type: "pdf",
      file_size: 2456789,
      description: "Service contract agreement",
      uploaded_at: "2023-05-15T10:30:00Z",
      updated_at: "2023-05-15T10:30:00Z"
    },
    {
      id: "demofile2",
      vendor_id: "demo-vendor-1",
      file_name: "product-catalog.pdf",
      file_path: "vendors/demo-vendor-1/product-catalog.pdf",
      file_type: "pdf",
      file_size: 5678901,
      description: "Complete product catalog 2023",
      uploaded_at: "2023-06-20T14:45:00Z",
      updated_at: "2023-06-20T14:45:00Z"
    },
    {
      id: "demofile3",
      vendor_id: "demo-vendor-1",
      file_name: "invoice-2023-07.xlsx",
      file_path: "vendors/demo-vendor-1/invoice-2023-07.xlsx",
      file_type: "xlsx",
      file_size: 356789,
      description: "July 2023 invoice",
      uploaded_at: "2023-07-05T09:15:00Z",
      updated_at: "2023-07-05T09:15:00Z"
    }
  ],
  "demo-vendor-2": [
    {
      id: "demofile4",
      vendor_id: "demo-vendor-2",
      file_name: "vendor-agreement.pdf",
      file_path: "vendors/demo-vendor-2/vendor-agreement.pdf",
      file_type: "pdf",
      file_size: 1245678,
      description: "Signed vendor agreement",
      uploaded_at: "2023-04-10T11:20:00Z",
      updated_at: "2023-04-10T11:20:00Z"
    },
    {
      id: "demofile5",
      vendor_id: "demo-vendor-2",
      file_name: "material-samples.jpg",
      file_path: "vendors/demo-vendor-2/material-samples.jpg",
      file_type: "jpg",
      file_size: 2345678,
      description: "Photos of material samples",
      uploaded_at: "2023-04-25T15:30:00Z",
      updated_at: "2023-04-25T15:30:00Z"
    }
  ],
  "demo-vendor-3": [
    {
      id: "demofile6",
      vendor_id: "demo-vendor-3",
      file_name: "quote-project-abc.pdf",
      file_path: "vendors/demo-vendor-3/quote-project-abc.pdf",
      file_type: "pdf",
      file_size: 789456,
      description: "Quotation for Project ABC",
      uploaded_at: "2023-03-18T13:40:00Z",
      updated_at: "2023-03-18T13:40:00Z"
    }
  ]
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const vendorId = searchParams.get("vendorId")

  if (!vendorId) {
    return NextResponse.json({ 
      error: "Vendor ID is required" 
    }, { status: 400 })
  }

  try {
    // Return demo data for the specific vendor
    const files = DEMO_VENDOR_FILES[vendorId as keyof typeof DEMO_VENDOR_FILES] || []
    
    return NextResponse.json({
      data: files,
      notice: "Using demo data - this is not real data from your database"
    })
  } catch (error: any) {
    console.error("Error in vendor-files-fallback API:", error)
    return NextResponse.json({ 
      error: error.message || "An unexpected error occurred" 
    }, { status: 500 })
  }
}