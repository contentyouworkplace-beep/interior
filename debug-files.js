// Debug file attachment issue
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rcauyqugtzmkdmcgdpan.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjYXV5cXVndHpta2RtY2dkcGFuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNjM2MDcyOCwiZXhwIjoyMDQxOTM2NzI4fQ.5_CdYjgfxY3pCJLgUfW1kLe7MfGNJdX9VLwNKvlm29U'
);

async function debugFiles() {
  try {
    console.log('=== DEBUGGING FILE ATTACHMENTS ===');
    
    // Get all expenses
    const { data: expenses, error } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Database error:', error);
      return;
    }
    
    console.log(`Found ${expenses.length} expenses`);
    
    expenses.forEach((expense, index) => {
      console.log(`\n--- Expense ${index + 1} ---`);
      console.log('ID:', expense.id);
      console.log('Title:', expense.description);
      console.log('File URLs raw:', expense.file_urls);
      console.log('File URLs type:', typeof expense.file_urls);
      console.log('Is null?', expense.file_urls === null);
      console.log('Is undefined?', expense.file_urls === undefined);
      console.log('Is array?', Array.isArray(expense.file_urls));
      console.log('Stringified:', JSON.stringify(expense.file_urls));
      
      if (expense.file_urls) {
        console.log('Length:', expense.file_urls.length);
        if (Array.isArray(expense.file_urls)) {
          expense.file_urls.forEach((url, i) => {
            console.log(`  File ${i + 1}: ${url}`);
          });
        }
      }
    });
    
    // Also check storage bucket contents
    console.log('\n=== CHECKING STORAGE BUCKET ===');
    const { data: files, error: storageError } = await supabase
      .storage
      .from('expense-documents')
      .list('', { limit: 100 });
    
    if (storageError) {
      console.error('Storage error:', storageError);
    } else {
      console.log(`Found ${files.length} files in storage:`);
      files.forEach(file => {
        console.log(`- ${file.name} (size: ${file.metadata?.size || 'unknown'})`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugFiles();