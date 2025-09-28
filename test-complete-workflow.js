// Test complete expense creation with file upload
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCompleteWorkflow() {
  try {
    console.log('=== TESTING COMPLETE EXPENSE + FILE WORKFLOW ===');
    
    const userId = '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6'; // Demo user ID
    
    // Step 1: Create expense
    const expenseData = {
      user_id: userId,
      category: 'Materials',
      amount: 250.00,
      description: 'Test expense with file attachment',
      expense_date: '2025-09-15',
      vendor: 'Test Vendor',
      billable: true,
      payment_method: 'Credit Card',
      notes: 'Testing file upload workflow'
    };
    
    console.log('1. Creating expense...');
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .insert([expenseData])
      .select()
      .single();
    
    if (expenseError) {
      console.error('❌ Failed to create expense:', expenseError);
      return;
    }
    
    console.log('✅ Expense created:', expense.id);
    
    // Step 2: Upload a test file
    console.log('2. Uploading test file...');
    
    // Create a simple PNG buffer (1x1 pixel)
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
      0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x37, 0x6E, 0xF9, 0x24, 0x00, 0x00,
      0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    const fileName = `${userId}/${expense.id}/${Date.now()}-test-receipt.png`;
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('expense-documents')
      .upload(fileName, pngBuffer, {
        contentType: 'image/png'
      });
    
    if (uploadError) {
      console.error('❌ Failed to upload file:', uploadError);
      return;
    }
    
    console.log('✅ File uploaded:', uploadData.path);
    
    // Step 3: Get public URL
    const { data: urlData } = supabase
      .storage
      .from('expense-documents')
      .getPublicUrl(uploadData.path);
    
    const publicUrl = urlData.publicUrl;
    console.log('✅ Public URL generated:', publicUrl);
    
    // Step 4: Update expense with file URL
    console.log('3. Updating expense with file URL...');
    
    const { data: updatedExpense, error: updateError } = await supabase
      .from('expenses')
      .update({ file_urls: [publicUrl] })
      .eq('id', expense.id)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Failed to update expense:', updateError);
      return;
    }
    
    console.log('✅ Expense updated with file URL');
    console.log('Final expense data:');
    console.log('  - ID:', updatedExpense.id);
    console.log('  - Description:', updatedExpense.description);
    console.log('  - File URLs:', updatedExpense.file_urls);
    console.log('  - File URLs type:', typeof updatedExpense.file_urls);
    console.log('  - Is array:', Array.isArray(updatedExpense.file_urls));
    console.log('  - Length:', updatedExpense.file_urls?.length || 0);
    
    console.log('\n🎉 COMPLETE WORKFLOW TEST SUCCESSFUL!');
    console.log('You can now test viewing this expense in the UI.');
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testCompleteWorkflow();