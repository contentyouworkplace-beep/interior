"use strict";

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkVendorFilesTable() {
  console.log('Checking vendor_files table...');

  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    // Try to query the vendor_files table
    const { data: tableData, error: tableError } = await supabase
      .from('vendor_files')
      .select('count(*)')
      .limit(1);

    if (tableError) {
      if (tableError.code === '42P01') {
        console.error('❌ The vendor_files table does not exist. Please run the vendor-files-table.sql script in Supabase.');
      } else {
        console.error('❌ Error querying vendor_files table:', tableError);
      }
      return false;
    }

    console.log('✅ vendor_files table exists');

    // Check storage bucket
    const { data: bucketData, error: bucketError } = await supabase.storage
      .getBucket('client-files');

    if (bucketError) {
      console.error('❌ The "client-files" storage bucket does not exist or there was an error accessing it:', bucketError);
      return false;
    }

    console.log('✅ "client-files" storage bucket exists');

    // Try to create a test vendor file record
    const testVendorId = '00000000-0000-0000-0000-000000000000'; // A dummy UUID
    const { data: insertData, error: insertError } = await supabase
      .from('vendor_files')
      .insert({
        vendor_id: testVendorId,
        file_name: 'test-file.txt',
        file_path: 'test/path/test-file.txt',
        file_type: 'txt',
        file_size: 0,
        description: 'Test file for permissions check',
        uploaded_at: new Date().toISOString()
      })
      .select();

    if (insertError) {
      if (insertError.code === '23503') {
        console.log('ℹ️ Foreign key constraint working properly. Cannot insert file for non-existent vendor.');
      } else if (insertError.code === '42501') {
        console.error('❌ Permission denied. RLS policies need to be set up correctly.');
      } else {
        console.error('❌ Error inserting test record:', insertError);
      }
    } else {
      console.log('✅ Successfully inserted test record');
      
      // Clean up the test record
      const { error: deleteError } = await supabase
        .from('vendor_files')
        .delete()
        .eq('id', insertData[0].id);
      
      if (deleteError) {
        console.error('❌ Error deleting test record:', deleteError);
      } else {
        console.log('✅ Successfully deleted test record');
      }
    }

    // Check all required policies exist
    const { data: policiesData, error: policiesError } = await supabase
      .rpc('get_policies_for_table', { table_name: 'vendor_files' });
    
    if (policiesError) {
      console.error('❌ Error checking policies:', policiesError);
    } else {
      const policies = policiesData || [];
      const requiredCommands = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
      const foundCommands = policies.map(p => p.command);
      
      const missingPolicies = requiredCommands.filter(cmd => !foundCommands.includes(cmd));
      
      if (missingPolicies.length > 0) {
        console.error(`❌ Missing RLS policies for: ${missingPolicies.join(', ')}`);
      } else {
        console.log('✅ All required RLS policies exist');
      }
    }

    return true;
  } catch (error) {
    console.error('Unexpected error:', error);
    return false;
  }
}

checkVendorFilesTable().then((success) => {
  if (success) {
    console.log('✨ Vendor files setup check completed successfully!');
  } else {
    console.log('⚠️ Vendor files setup check completed with issues. Please check the logs above.');
  }
});