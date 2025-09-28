// Emergency fix for expense file uploads
// This file provides a temporary replacement function for ExpenseService.uploadExpenseFiles
// to use the new storage bucket without modifying the corrupted file

import { createClient } from '@/lib/supabase/client';

// Constants
export const NEW_BUCKET_NAME = 'expense-documents-new';

// Create a standalone function to upload expense files to the new bucket
export async function uploadExpenseFilesToNewBucket(userId: string, expenseId: string, files: any[]): Promise<{ data: string[] | null; error: any }> {
  console.log('🚨 Using emergency upload function with new bucket');
  console.log('📤 Starting file upload for expense:', expenseId);
  console.log('📁 Files to upload:', files.length);
  console.log('🔑 User ID:', userId);
  
  // Use the shared browser client from our main service file
  const { createClient } = await import('@/lib/supabase/client');
  const supabase = createClient();
  
  try {
    const uploadedUrls = [];
    
    for (let i = 0; i < files.length; i++) {
      const fileData = files[i];
      console.log(`📎 Uploading file ${i + 1}/${files.length}:`, fileData.file.name);
      
      // Clean filename and ensure proper path structure
      const fileExt = fileData.file.name.split('.').pop() || 'unknown';
      const cleanFileName = fileData.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const fileName = `${userId}/${expenseId}/${timestamp}-${randomId}-${cleanFileName}`;
      
      console.log('📂 Storage path:', fileName);
      
      // Check if user is authenticated before upload
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('❌ Authentication error before upload:', authError);
        return { data: null, error: authError || 'User not authenticated' };
      }
      
      console.log('✅ User authenticated, proceeding with upload...');
      
      // Use the new storage bucket
      const { data, error } = await supabase.storage
        .from(NEW_BUCKET_NAME)
        .upload(fileName, fileData.file, {
          cacheControl: '3600',
          upsert: false,
          metadata: {
            type: fileData.type,
            description: fileData.description || '',
            userId: userId,
            expenseId: expenseId
          }
        });
        
      if (error) {
        console.error(`❌ Error uploading file ${i + 1}:`, error);
        continue;
      }
      
      if (!data?.path) {
        console.error(`❓ Upload completed but no path returned for file ${i + 1}`);
        continue;
      }

      const url = supabase.storage
        .from(NEW_BUCKET_NAME)
        .getPublicUrl(data.path).data.publicUrl;
        
      console.log('🔗 File URL:', url);
      uploadedUrls.push(url);
    }
    
    console.log('✅ Upload complete, URLs:', uploadedUrls);
    
    return { data: uploadedUrls, error: null };
  } catch (error) {
    console.error('❌ Unexpected error during upload:', error);
    return { data: null, error };
  }
}

// Instructions to use this file:
/*
1. Import this function in your component:
   import { uploadExpenseFilesToNewBucket } from '@/lib/services/expense-uploads-fix';
   
2. Replace calls to ExpenseService.uploadExpenseFiles with:
   const { data: fileUrls, error: uploadError } = await uploadExpenseFilesToNewBucket(
     userId,
     expenseId,
     files
   );
*/