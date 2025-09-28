#!/bin/bash
# Script to create a new expense document bucket and set up policies
# This script executes the necessary steps to create a new expense documents bucket with proper permissions

# Display header
echo "======================================================="
echo "  Creating New Expense Documents Storage Bucket"
echo "======================================================="

# Step 1: Create the new bucket
echo "Step 1: Creating new storage bucket..."
node scripts/create-new-expense-bucket.js

# Check if previous command was successful
if [ $? -ne 0 ]; then
    echo "❌ Failed to create new bucket. Exiting."
    exit 1
fi

echo ""
echo "======================================================="
echo "  Setting Up Storage Policies for New Bucket"
echo "======================================================="

# Step 2: Set up policies for the new bucket
echo "Step 2: Applying storage policies to new bucket..."
echo "Please execute the following SQL in the Supabase SQL Editor:"
echo ""
cat scripts/setup-new-bucket-policies.sql
echo ""
echo "======================================================="
echo "  Testing File Upload to New Bucket"
echo "======================================================="

# Step 3: Test the new bucket
echo "Step 3: Testing file upload to new bucket..."
echo "This will verify that files can be uploaded to the new bucket."
node scripts/test-new-bucket-upload.js

# Check if previous command was successful
if [ $? -ne 0 ]; then
    echo "❌ Upload test failed. Please review the error messages above."
else
    echo "✅ Upload test completed. Check the results above to verify success."
fi

echo ""
echo "======================================================="
echo "  Modifying Frontend to Use New Bucket"
echo "======================================================="

echo "The following files have been updated to use the new bucket:"
echo "- lib/services/expense-uploads-fix.js (new file for emergency upload)"
echo "- components/view-expense-dialog.tsx (updated to check both buckets)"

echo ""
echo "To use the new upload function, update add-expense-dialog.tsx as follows:"
echo "1. Import the new upload function:"
echo "   import { uploadExpenseFilesToNewBucket } from '@/lib/services/expense-uploads-fix';"
echo ""
echo "2. Replace the current upload call with:"
echo "   const { data: fileUrls, error: uploadError } = await uploadExpenseFilesToNewBucket("
echo "     user.id,"
echo "     expenseData.id,"
echo "     expenseFiles"
echo "   );"
echo ""

echo "======================================================="
echo "  Next Steps"
echo "======================================================="
echo "1. Execute the SQL in Supabase SQL Editor"
echo "2. Update the add-expense-dialog.tsx component as described above"
echo "3. Test creating a new expense with attachments"
echo "4. Verify files appear in the view expense dialog"
echo "======================================================="