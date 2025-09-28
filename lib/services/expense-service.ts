import { createClient } from '@/lib/supabase/client'

// Reuse the shared browser Supabase client to avoid multiple GoTrue instances
export const supabase = createClient();

// Constants for the application
export const STORAGE_BUCKET = 'expense-documents-new';  // Using the new bucket name

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
  
  /**
   * Create a new expense record
   */
  static async createExpense(expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: Expense | null; error: any }> {
    try {
      console.log('💾 ExpenseService.createExpense called with:', expense);
      
      const { data, error } = await supabase
        .from('expenses')
        .insert([expense])
        .select()
        .single();

      console.log('📊 Database response:', { data, error });

      if (error) {
        console.error('❌ Database error:', error);
        return { data: null, error };
      }

      console.log('✅ Expense created successfully:', data);
      return { data, error: null };
    } catch (error) {
      console.error('💥 Service error in createExpense:', error);
      return { data: null, error };
    }
  }

  /**
   * Get expenses for a user with optional filters
   */
  static async getExpenses(
    userId: string,
    filters?: {
      projectId?: string;
      category?: string;
      dateFrom?: string;
      dateTo?: string;
      billable?: boolean;
    }
  ): Promise<{ data: Expense[] | null; error: any }> {
    try {
      let query = supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .order('expense_date', { ascending: false });

      // Apply filters
      if (filters?.projectId) {
        query = query.eq('project_id', filters.projectId);
      }
      
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      
      if (filters?.dateFrom) {
        query = query.gte('expense_date', filters.dateFrom);
      }
      
      if (filters?.dateTo) {
        query = query.lte('expense_date', filters.dateTo);
      }
      
      if (filters?.billable !== undefined) {
        query = query.eq('billable', filters.billable);
      }

      const { data, error } = await query;
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Get all expenses (for demo/testing purposes)
   */
  static async getAllExpenses(): Promise<{ data: Expense[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Get a single expense by ID
   */
  static async getExpenseById(id: string, userId: string): Promise<{ data: Expense | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Update an expense
   */
  static async updateExpense(
    id: string, 
    userId: string, 
    updates: Partial<Expense>
  ): Promise<{ data: Expense | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Delete an expense
   */
  static async deleteExpense(id: string, userId: string): Promise<{ error: any }> {
    try {
      // First, get the expense to clean up associated files
      const { data: expense } = await this.getExpenseById(id, userId);
      
      if (expense?.file_urls && expense.file_urls.length > 0) {
        // Delete associated files
        await this.deleteExpenseFiles(expense.file_urls);
      }

      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      return { error };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Upload files for an expense
   */
  static async uploadExpenseFiles(
    userId: string,
    expenseId: string,
    files: ExpenseFile[]
  ): Promise<{ data: string[] | null; error: any }> {
    try {
      console.log('📤 Starting file upload for expense:', expenseId);
      console.log('📁 Files to upload:', files.length);
      console.log('🔑 User ID:', userId);
      
      const uploadedUrls: string[] = [];
      
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
        
        const { data, error } = await supabase.storage
          .from('expense-documents-new')
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
          console.error(`❌ Upload error for file ${i + 1}:`, error);
          console.error('Error details:', {
            message: error.message,
            name: error.name
          });
          
          // Clean up any successfully uploaded files
          if (uploadedUrls.length > 0) {
            console.log('🧹 Cleaning up previously uploaded files...');
            const pathsToDelete = uploadedUrls.map(url => {
              // Extract path from public URL
              const urlParts = url.split('/storage/v1/object/public/expense-documents-new/');
              return urlParts.length > 1 ? urlParts[1] : '';
            }).filter(Boolean);
            await this.deleteExpenseFiles(pathsToDelete);
          }
          return { data: null, error };
        }

        console.log(`✅ File ${i + 1} uploaded successfully:`, data.path);

        // Get the public URL for the uploaded file
        const { data: urlData } = supabase.storage
          .from('expense-documents')
          .getPublicUrl(data.path);

        if (urlData?.publicUrl) {
          uploadedUrls.push(urlData.publicUrl);
          console.log(`🔗 Public URL generated:`, urlData.publicUrl);
        } else {
          console.warn(`⚠️ Could not generate public URL for file ${i + 1}`);
        }
      }

      console.log('🎉 All files uploaded successfully! URLs:', uploadedUrls);
      return { data: uploadedUrls, error: null };
    } catch (error) {
      console.error('💥 Upload service error:', error);
      return { data: null, error };
    }
  }

  /**
   * Get download URL for an expense file
   */
  static async getFileDownloadUrl(filePath: string): Promise<{ data: string | null; error: any }> {
    try {
      const { data, error } = await supabase.storage
        .from('expense-documents')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      return { data: data?.signedUrl || null, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Delete expense files from storage
   */
  static async deleteExpenseFiles(filePaths: string[]): Promise<{ error: any }> {
    try {
      const { error } = await supabase.storage
        .from('expense-documents')
        .remove(filePaths);

      return { error };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Get expense statistics for a user
   */
  static async getExpenseStats(
    userId: string,
    filters?: {
      dateFrom?: string;
      dateTo?: string;
      projectId?: string;
    }
  ): Promise<{
    data: {
      totalAmount: number;
      billableAmount: number;
      overheadAmount: number;
      totalExpenses: number;
      categoriesCount: number;
    } | null;
    error: any;
  }> {
    try {
      let query: any = supabase
        .from('expenses')
        // Use untyped select to avoid TS schema drift errors if columns differ
        .select('amount, billable, category' as any)
        .eq('user_id', userId);

      // Apply filters
      if (filters?.dateFrom) {
        query = query.gte('expense_date', filters.dateFrom);
      }
      
      if (filters?.dateTo) {
        query = query.lte('expense_date', filters.dateTo);
      }
      
      if (filters?.projectId) {
        query = query.eq('project_id', filters.projectId);
      }

  const { data: expenses, error } = await query;
      
      if (error) return { data: null, error };

      const stats = (expenses as any[])?.reduce(
        (acc, expense) => {
          acc.totalAmount += expense.amount;
          if (expense.billable) {
            acc.billableAmount += expense.amount;
          } else {
            acc.overheadAmount += expense.amount;
          }
          acc.totalExpenses += 1;
          acc.categories.add(expense.category);
          return acc;
        },
        {
          totalAmount: 0,
          billableAmount: 0,
          overheadAmount: 0,
          totalExpenses: 0,
          categories: new Set<string>()
        }
      );

      return {
        data: {
          totalAmount: stats?.totalAmount || 0,
          billableAmount: stats?.billableAmount || 0,
          overheadAmount: stats?.overheadAmount || 0,
          totalExpenses: stats?.totalExpenses || 0,
          categoriesCount: stats?.categories.size || 0
        },
        error: null
      };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Generate expense report data
   */
  static async generateReportData(
    userId: string,
    filters?: {
      dateFrom?: string;
      dateTo?: string;
      category?: string;
      projectId?: string;
      billable?: boolean;
    }
  ): Promise<{ data: Expense[] | null; error: any }> {
    return this.getExpenses(userId, filters);
  }

  /**
   * Duplicate an expense (useful for recurring expenses)
   */
  static async duplicateExpense(
    id: string, 
    userId: string, 
    newDate?: string
  ): Promise<{ data: Expense | null; error: any }> {
    try {
      const { data: originalExpense, error: fetchError } = await this.getExpenseById(id, userId);
      
      if (fetchError || !originalExpense) {
        return { data: null, error: fetchError || 'Expense not found' };
      }

      // Create new expense without ID and timestamps
      const newExpense = {
        ...originalExpense,
        expense_date: newDate || new Date().toISOString().split('T')[0],
        description: `${originalExpense.description} (Copy)`,
        file_urls: [], // Don't copy files
      };

      delete newExpense.id;
      delete newExpense.created_at;
      delete newExpense.updated_at;

      return this.createExpense(newExpense);
    } catch (error) {
      return { data: null, error };
    }
  }
}

export default ExpenseService;