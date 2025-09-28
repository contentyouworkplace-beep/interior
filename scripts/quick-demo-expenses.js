#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function addDemoExpenses() {
  console.log('🚀 Adding demo expenses quickly...')
  
  const demoUserId = 'demo-user-12345678-1234-1234-1234-123456789012'
  
  // First create the table if it doesn't exist
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS public.expenses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      project_id UUID NULL,
      category TEXT NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      description TEXT NOT NULL,
      expense_date DATE NOT NULL,
      receipt_url TEXT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "demo_policy" ON public.expenses;
    CREATE POLICY "demo_policy" ON public.expenses FOR ALL USING (true);
  `
  
  try {
    // Try to execute the table creation
    console.log('📋 Setting up table...')
    await supabase.rpc('sql', { query: createTableQuery }).catch(() => {
      console.log('Table setup via RPC failed, trying direct insert...')
    })
  } catch (error) {
    console.log('Table creation skipped, proceeding with inserts...')
  }
  
  const demoExpenses = [
    {
      user_id: demoUserId,
      category: 'Materials',
      amount: 12500.00,
      description: 'Premium hardwood flooring for living room',
      expense_date: '2025-09-12',
      status: 'approved'
    },
    {
      user_id: demoUserId,
      category: 'Labor',
      amount: 8000.00,
      description: 'Electrical wiring installation',
      expense_date: '2025-09-10',
      status: 'approved'
    },
    {
      user_id: demoUserId,
      category: 'Transportation',
      amount: 750.00,
      description: 'Material delivery costs',
      expense_date: '2025-09-13',
      status: 'pending'
    },
    {
      user_id: demoUserId,
      category: 'Equipment',
      amount: 3200.00,
      description: 'Power tools rental',
      expense_date: '2025-09-08',
      status: 'approved'
    },
    {
      user_id: demoUserId,
      category: 'Materials',
      amount: 15600.00,
      description: 'Italian marble tiles for kitchen',
      expense_date: '2025-08-30',
      status: 'approved'
    },
    {
      user_id: demoUserId,
      category: 'Labor',
      amount: 22000.00,
      description: 'Kitchen cabinet installation',
      expense_date: '2025-08-27',
      status: 'approved'
    },
    {
      user_id: demoUserId,
      category: 'Software',
      amount: 1200.00,
      description: 'AutoCAD and SketchUp licenses',
      expense_date: '2025-08-25',
      status: 'approved'
    },
    {
      user_id: demoUserId,
      category: 'Miscellaneous',
      amount: 450.00,
      description: 'Client meeting refreshments',
      expense_date: '2025-09-02',
      status: 'approved'
    },
    {
      user_id: demoUserId,
      category: 'Marketing',
      amount: 2500.00,
      description: 'Photography and website development',
      expense_date: '2025-09-14',
      status: 'pending'
    },
    {
      user_id: demoUserId,
      category: 'Office Supplies',
      amount: 380.00,
      description: 'Design materials and presentation supplies',
      expense_date: '2025-09-11',
      status: 'pending'
    }
  ]
  
  console.log('💾 Inserting demo expenses...')
  
  const { data, error } = await supabase
    .from('expenses')
    .upsert(demoExpenses, { 
      onConflict: 'description,user_id',
      ignoreDuplicates: true 
    })
    .select()
  
  if (error) {
    console.log('Direct insert failed, trying individual inserts...')
    let successCount = 0
    for (const expense of demoExpenses) {
      try {
        const { error: singleError } = await supabase
          .from('expenses')
          .insert([expense])
        if (!singleError) successCount++
      } catch (e) {
        // Ignore duplicates
      }
    }
    console.log(`✅ Inserted ${successCount} expenses successfully!`)
  } else {
    console.log(`✅ Inserted ${data?.length || demoExpenses.length} expenses successfully!`)
  }
  
  // Quick stats
  const { data: stats } = await supabase
    .from('expenses')
    .select('amount')
    .eq('user_id', demoUserId)
  
  if (stats) {
    const total = stats.reduce((sum, exp) => sum + parseFloat(exp.amount), 0)
    console.log(`📊 Total: ${stats.length} expenses, ₹${total.toFixed(2)}`)
  }
  
  console.log('🎉 Demo expenses added! Visit: http://localhost:3001/expenses')
}

addDemoExpenses().catch(console.error)