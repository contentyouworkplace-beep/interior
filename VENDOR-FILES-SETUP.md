# Vendor Files Management Setup

This guide will help you set up vendor file management for the Interior Designer CRM. These instructions will enable you to upload, view, download, and manage files associated with vendors.

## Prerequisites

1. Make sure your Supabase project is properly configured and running.
2. You should have access to the Supabase SQL Editor.
3. You need to have the vendors table already set up in your database.

## Step 1: Create the vendor_files Table

1. Open your Supabase dashboard: https://app.supabase.com/project/ywcqtmzqsvcobtetunuf/sql
2. Open the SQL Editor
3. Copy and paste the contents of the `vendor-files-table.sql` file
4. Run the SQL query

This script will:
- Create the vendor_files table with appropriate columns
- Add a foreign key constraint to link it to the vendors table
- Set up Row Level Security (RLS) policies
- Create necessary indexes for better performance
- Add a trigger for the updated_at column

## Step 2: Configure Storage

1. Go to the Storage section in your Supabase dashboard
2. If you don't have a bucket named "client-files", create one:
   - Click "Create Bucket"
   - Enter "client-files" as the name
   - Set the bucket public/private according to your requirements
   - Click "Create Bucket"

3. Set RLS policies for the bucket:
   - Click on the "client-files" bucket
   - Go to "Policies" tab
   - Make sure there are policies that allow authenticated users to upload, download and delete files
   - If not, create policies with the following templates:

For SELECT (download):
```sql
(bucket_id = 'client-files'::text) AND (auth.role() = 'authenticated'::text)
```

For INSERT (upload):
```sql
(bucket_id = 'client-files'::text) AND (auth.role() = 'authenticated'::text)
```

For DELETE:
```sql
(bucket_id = 'client-files'::text) AND (auth.role() = 'authenticated'::text)
```

## Step 3: Testing the Setup

1. Log in to your Interior Designer CRM
2. Go to the Vendors section
3. Select a vendor and click the upload icon
4. Try uploading a file - if successful, you'll see a confirmation message
5. Click the view files icon to see all files associated with the vendor
6. Test downloading and deleting files

## Troubleshooting

If you encounter issues:

1. **Permission denied errors**: Make sure RLS policies are correctly set up for both the vendor_files table and the storage bucket.
2. **Foreign key constraint errors**: Ensure the vendor_id in vendor_files is referencing an existing vendor in the vendors table.
3. **Storage issues**: Check that your bucket is correctly configured and that the file paths in the database match the actual paths in storage.

## Notes

- Files are stored in the path `vendors/{vendor_id}/{timestamp}-{filename}`
- File metadata is stored in the vendor_files table, including file name, size, type, and path
- The API endpoint `/api/vendor-files` handles file metadata operations
- A fallback mechanism is in place to show demo data if database connectivity issues occur

For any other issues, check the browser console for error messages or contact your system administrator.