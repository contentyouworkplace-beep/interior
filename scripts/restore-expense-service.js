// Create a backup script to replace the corrupted expense-service.ts file
// This will restore from a backup or previous version

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Assuming the system has Git installed, we can use it to restore the file
// This is a simple node script to run git checkout on the corrupted file

console.log('Restoring expense-service.ts from Git history...');

const filePath = path.resolve(process.cwd(), 'lib/services/expense-service.ts');

// First method: Try using git to restore the file
const restoreWithGit = () => {
  const { execSync } = require('child_process');
  
  try {
    console.log(`Running: git checkout -- ${filePath}`);
    execSync(`git checkout -- ${filePath}`, { stdio: 'inherit' });
    console.log('✅ File restored successfully using Git.');
    return true;
  } catch (error) {
    console.error('❌ Failed to restore using Git:', error);
    return false;
  }
};

// Alternative: Manually restore the file content (this is just in case git fails)
const manualRestore = () => {
  // This is a minimal version to restore basic functionality
  // You would need to fill this in with the actual content of the file
  const basicContent = `import { createClient } from '@/lib/supabase/client'

// Reuse the shared browser Supabase client to avoid multiple GoTrue instances
export const supabase = createClient();

export interface Expense {
  id?: string;
  user_id: string;
  project_id?: string | null;
  category: string;
  amount: number;
  description: string;
  expense_date: string;
  vendor?: string | null;
  project_name?: string;
  billable?: boolean | null; // Optional; DB may return null
  file_urls?: string[] | null;
  tags?: string[];
  payment_method?: string | null;
  tax_amount?: number | null;
  legacy_receipt_url?: string | null;
  receipt_url?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ExpenseFile {
  file: File;
  type: 'bill' | 'invoice' | 'receipt' | 'other';
  description?: string;
}

export class ExpenseService {
  // Basic implementation to be restored
}`;

  try {
    fs.writeFileSync(filePath, basicContent, 'utf8');
    console.log('✅ Basic file structure restored manually.');
    return true;
  } catch (error) {
    console.error('❌ Failed to manually restore the file:', error);
    return false;
  }
};

// Try Git first, then manual restore if that fails
if (!restoreWithGit()) {
  manualRestore();
}

console.log('Please check the file and restore any missing functionality.');