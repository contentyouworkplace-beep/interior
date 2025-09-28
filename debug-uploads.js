// Debug file upload flow in the browser
// Run this in browser console while adding an expense with files

console.log('🔍 DEBUGGING FILE UPLOAD FLOW');

// Monitor ExpenseService.uploadExpenseFiles calls
const originalUpload = window.ExpenseService?.uploadExpenseFiles;
if (originalUpload) {
  window.ExpenseService.uploadExpenseFiles = async function(userId, expenseId, files) {
    console.group('📤 ExpenseService.uploadExpenseFiles called');
    console.log('userId:', userId);
    console.log('expenseId:', expenseId);
    console.log('files:', files);
    console.log('files length:', files?.length);
    
    try {
      const result = await originalUpload.call(this, userId, expenseId, files);
      console.log('Upload result:', result);
      return result;
    } catch (error) {
      console.error('Upload threw error:', error);
      throw error;
    } finally {
      console.groupEnd();
    }
  };
  console.log('✅ ExpenseService.uploadExpenseFiles is now being monitored');
} else {
  console.warn('⚠️ ExpenseService.uploadExpenseFiles not found on window object');
}

// Monitor supabase storage calls
const supabaseClients = [];
const originalCreateClient = window.createClient || (() => {});

// Try to find existing supabase instances
if (window.supabase) {
  console.log('Found window.supabase, monitoring storage calls...');
  const originalUploadFn = window.supabase.storage.from('expense-documents').upload;
  window.supabase.storage.from('expense-documents').upload = function(path, file, options) {
    console.group('🗂️ Supabase storage.upload called');
    console.log('path:', path);
    console.log('file:', file);
    console.log('file name:', file?.name);
    console.log('file size:', file?.size);
    console.log('file type:', file?.type);
    console.log('options:', options);
    
    const result = originalUploadFn.call(this, path, file, options);
    result.then(r => {
      console.log('Storage upload result:', r);
    }).catch(e => {
      console.error('Storage upload error:', e);
    });
    
    console.groupEnd();
    return result;
  };
}

console.log('🎯 File upload debugging is active. Try adding an expense with files now.');