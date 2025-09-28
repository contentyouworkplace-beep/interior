#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function addSimpleDemoExpenses() {
  console.log('⚡ Adding demo expenses (simplified)...')
  
  const simpleExpenses = [
    {
      user_id: 'demo-user-123',
      category: 'Materials',
      amount: 5500.00,
      description: 'LED lighting fixtures and switches',
      expense_date: '2025-09-14'
    },
    {
      user_id: 'demo-user-123',
      category: 'Labor',
      amount: 3500.00,
      description: 'Painting and wall finishing work',
      expense_date: '2025-09-13'
    },
    {
      user_id: 'demo-user-123',
      category: 'Transportation',
      amount: 850.00,
      description: 'Furniture delivery from warehouse',
      expense_date: '2025-09-12'
    },
    {
      user_id: 'demo-user-123',
      category: 'Equipment',
      amount: 2200.00,
      description: 'Drill and measurement tools purchase',
      expense_date: '2025-09-11'
    },
    {
      user_id: 'demo-user-123',
      category: 'Materials',
      amount: 7800.00,
      description: 'Ceramic tiles for bathroom renovation',
      expense_date: '2025-09-10'
    }
  ]
  
  console.log('💾 Inserting expenses...')
  
  let added = 0
  for (const expense of simpleExpenses) {
    try {
      const { error } = await supabase
        .from('expenses')
        .insert([expense])
      
      if (!error) {
        added++
        console.log(`   ✅ ${expense.description}`)
      } else {
        console.log(`   ⚠️ ${expense.description} - ${error.message}`)
      }
    } catch (e) {
      console.log(`   ❌ ${expense.description} - Failed`)
    }
  }
  
  console.log(`\n🎉 Added ${added} new demo expenses!`)
  
  // Get current total
  const { data: allExpenses } = await supabase
    .from('expenses')
    .select('amount, description')
    .order('created_at', { ascending: false })
    .limit(10)
  
  if (allExpenses) {
    console.log(`\n📋 Recent expenses (showing ${allExpenses.length}):`)
    allExpenses.forEach((exp, i) => {
      console.log(`   ${i + 1}. ₹${exp.amount} - ${exp.description.substring(0, 40)}...`)
    })
    
    const recentTotal = allExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0)
    console.log(`\n💰 Recent total: ₹${recentTotal.toFixed(2)}`)
  }
  
  console.log('\n🌐 Ready to test at: http://localhost:3001/expenses')
}

addSimpleDemoExpenses().catch(console.error)