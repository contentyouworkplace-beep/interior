#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createExpenseTableAndData() {
  console.log('🚀 Creating expenses table and adding demo data...')
  
  // Use service role to create table directly
  const createTableSQL = `
    -- Create expenses table
    CREATE TABLE IF NOT EXISTS public.expenses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      project_id TEXT NULL,
      category TEXT NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      description TEXT NOT NULL,
      expense_date DATE NOT NULL,
      receipt_url TEXT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Disable RLS temporarily for demo
    ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;
  `
  
  try {
    // Create table using raw SQL
    const { error: createError } = await supabase.rpc('sql', { query: createTableSQL })
    if (createError && !createError.message.includes('already exists')) {
      console.log('Creating table manually...')
    } else {
      console.log('✅ Table ready')
    }
  } catch (e) {
    console.log('Table creation attempted...')
  }
  
  // Demo data
  const demoExpenses = [
    {
      user_id: 'demo-user-123',
      category: 'Materials',
      amount: 12500.00,
      description: 'Premium hardwood flooring for living room',
      expense_date: '2025-09-12',
      status: 'approved'
    },
    {
      user_id: 'demo-user-123',
      category: 'Labor',
      amount: 8000.00,
      description: 'Electrical wiring installation by certified electrician',
      expense_date: '2025-09-10',
      status: 'approved'
    },
    {
      user_id: 'demo-user-123',
      category: 'Transportation',
      amount: 750.00,
      description: 'Material delivery and logistics costs',
      expense_date: '2025-09-13',
      status: 'pending'
    },
    {
      user_id: 'demo-user-123',
      category: 'Equipment',
      amount: 3200.00,
      description: 'Professional grade power tools rental',
      expense_date: '2025-09-08',
      status: 'approved'
    },
    {
      user_id: 'demo-user-123',
      category: 'Materials',
      amount: 15600.00,
      description: 'Italian marble tiles for kitchen backsplash',
      expense_date: '2025-08-30',
      status: 'approved'
    },
    {
      user_id: 'demo-user-123',
      category: 'Labor',
      amount: 22000.00,
      description: 'Kitchen cabinet installation by expert craftsmen',
      expense_date: '2025-08-27',
      status: 'approved'
    },
    {
      user_id: 'demo-user-123',
      category: 'Software',
      amount: 1200.00,
      description: 'AutoCAD and SketchUp Pro licenses',
      expense_date: '2025-08-25',
      status: 'approved'
    },
    {
      user_id: 'demo-user-123',
      category: 'Marketing',
      amount: 2500.00,
      description: 'Photography and portfolio website development',
      expense_date: '2025-09-14',
      status: 'pending'
    }
  ]
  
  console.log('💾 Adding demo expenses...')
  
  let successCount = 0
  for (const expense of demoExpenses) {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert([expense])
      
      if (!error) {
        successCount++
        console.log(`   ✅ Added: ${expense.description.substring(0, 30)}...`)
      } else {
        console.log(`   ⚠️ Skipped: ${expense.description.substring(0, 30)}... (${error.message})`)
      }
    } catch (e) {
      console.log(`   ❌ Failed: ${expense.description.substring(0, 30)}...`)
    }
  }
  
  console.log(`\n🎉 Successfully added ${successCount}/${demoExpenses.length} demo expenses!`)
  
  // Get total
  try {
    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount')
    
    if (expenses) {
      const total = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0)
      console.log(`📊 Total expenses: ${expenses.length}, Amount: ₹${total.toFixed(2)}`)
    }
  } catch (e) {
    console.log('Stats calculation skipped')
  }
  
  console.log('\n🌐 Visit: http://localhost:3001/expenses to see your demo data!')
}

createExpenseTableAndData().catch(console.error)