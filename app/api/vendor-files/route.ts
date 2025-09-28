import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Create Supabase client with service role for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// GET endpoint to retrieve vendor files
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const vendorId = searchParams.get("vendorId")

  if (!vendorId) {
    return NextResponse.json({ 
      error: "Vendor ID is required" 
    }, { status: 400 })
  }

  try {
    console.log('📂 Fetching files for vendor:', vendorId)

    const { data: files, error } = await supabase
      .from("vendor_files")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching vendor files:", error)
      return NextResponse.json({ 
        error: error.message 
      }, { status: 500 })
    }

    console.log(`✅ Found ${files?.length || 0} files for vendor`)

    // Generate signed URLs for file access
    const filesWithUrls = await Promise.all(
      (files || []).map(async (file) => {
        try {
          const { data: urlData, error: urlError } = await supabase.storage
            .from('client-files')
            .createSignedUrl(file.file_path, 3600) // 1 hour expiry

          if (urlError) {
            console.error(`❌ Error generating URL for ${file.file_path}:`, urlError)
            return {
              ...file,
              download_url: null,
              url_error: urlError.message
            }
          }

          return {
            ...file,
            download_url: urlData.signedUrl
          }
        } catch (error) {
          console.error(`❌ Error processing file ${file.filename}:`, error)
          return {
            ...file,
            download_url: null,
            url_error: 'Failed to generate download URL'
          }
        }
      })
    )

    return NextResponse.json({ 
      data: filesWithUrls,
      count: filesWithUrls.length 
    })
  } catch (error: any) {
    console.error("Unexpected error fetching vendor files:", error)
    return NextResponse.json({ 
      error: error.message || "An unexpected error occurred" 
    }, { status: 500 })
  }
}

// POST endpoint to upload file metadata
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { vendorId, fileName, filePath, fileType, fileSize, description } = body

    // Validate required fields
    if (!vendorId || !fileName || !filePath || !fileType || !fileSize) {
      return NextResponse.json({ 
        error: "Missing required fields" 
      }, { status: 400 })
    }

    // Insert file metadata into vendor_files table
    const { data, error } = await supabase
      .from("vendor_files")
      .insert({
        vendor_id: vendorId,
        file_name: fileName,
        file_path: filePath,
        file_type: fileType,
        file_size: fileSize,
        description: description || null,
        uploaded_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error("Error saving file metadata:", error)
      return NextResponse.json({ 
        error: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ data: data })
  } catch (error: any) {
    console.error("Unexpected error saving file metadata:", error)
    return NextResponse.json({ 
      error: error.message || "An unexpected error occurred" 
    }, { status: 500 })
  }
}

// DELETE endpoint to remove a file
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const fileId = searchParams.get("id")

  if (!fileId) {
    return NextResponse.json({ 
      error: "File ID is required" 
    }, { status: 400 })
  }

  try {
    // First get file details to know the file path
    const { data: fileData, error: fetchError } = await supabase
      .from("vendor_files")
      .select("*")
      .eq("id", fileId)
      .single()
    
    if (fetchError) {
      console.error("Error fetching file details:", fetchError)
      return NextResponse.json({ 
        error: fetchError.message 
      }, { status: 500 })
    }
    
    if (!fileData) {
      return NextResponse.json({ 
        error: "File not found" 
      }, { status: 404 })
    }
    
    // Delete file metadata from database
    const { error: deleteDbError } = await supabase
      .from("vendor_files")
      .delete()
      .eq("id", fileId)
    
    if (deleteDbError) {
      console.error("Error deleting file from database:", deleteDbError)
      return NextResponse.json({ 
        error: deleteDbError.message 
      }, { status: 500 })
    }
    
    // Delete file from storage
    const { error: deleteStorageError } = await supabase.storage
      .from("client-files")
      .remove([fileData.file_path])
    
    if (deleteStorageError) {
      console.error("Error deleting file from storage:", deleteStorageError)
      return NextResponse.json({ 
        error: "File metadata deleted but could not remove file from storage: " + deleteStorageError.message 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "File deleted successfully" 
    })
  } catch (error: any) {
    console.error("Unexpected error deleting file:", error)
    return NextResponse.json({ 
      error: error.message || "An unexpected error occurred" 
    }, { status: 500 })
  }
}