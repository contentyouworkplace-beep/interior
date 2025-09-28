# Supabase Storage Setup Instructions

## 1. Create Storage Bucket

Go to your Supabase Dashboard: https://app.supabase.com/project/ywcqtmzqsvcobtetunuf

### Steps:
1. Navigate to **Storage** in the left sidebar
2. Click **"Create Bucket"**
3. Enter bucket name: `client-files`
4. Keep it **Private** (unchecked public)
5. Set file size limit: `10485760` (10MB)
6. Click **"Create bucket"**

## 2. Configure Storage Policies

Navigate to **Storage > Policies** and add these three policies:

### Policy 1: Upload Files
```sql
CREATE POLICY "Users can upload client files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'client-files' AND
  auth.role() = 'authenticated'
);
```

### Policy 2: View Files
```sql
CREATE POLICY "Users can view client files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'client-files' AND
  auth.role() = 'authenticated'
);
```

### Policy 3: Delete Files
```sql
CREATE POLICY "Users can delete client files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'client-files' AND
  auth.role() = 'authenticated'
);
```

## 3. Test the Integration

Once the bucket and policies are set up:

1. Go to your app: http://localhost:3001/clients
2. Click on any client to view their profile
3. Click "Upload Files" button
4. Try uploading a file
5. The file should now be stored in real Supabase Storage!

## What's Changed

✅ **Real Storage Upload**: Files are now uploaded to Supabase Storage bucket
✅ **Database Integration**: File metadata is saved to the `client_files` table
✅ **Fallback System**: If Supabase fails, it gracefully falls back to mock data
✅ **Signed URLs**: Download links use Supabase's signed URLs for security
✅ **File Categorization**: Automatic categorization of files by type

## Current Implementation Features

- **Upload**: Real file upload to Supabase Storage with metadata in database
- **View**: Fetches files from database, shows mock data if database unavailable
- **Download**: Creates signed URLs for secure file downloads
- **Delete**: Removes files from both storage and database
- **Error Handling**: Graceful fallbacks to ensure app always works

The system will now use real Supabase Storage when available, and automatically fall back to mock data for development when the database/storage isn't fully configured.