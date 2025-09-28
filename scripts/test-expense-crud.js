#!/usr/bin/env node

/**
 * Test Expense CRUD Operations
 * Tests all Create, Read, Update, Delete operations for expenses
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testExpenseCRUD() {
  console.log('🧪 Testing Expense CRUD Operations...\n')
  
  let testExpenseId = null
  
  try {
    // 1. TEST CREATE
    console.log('1️⃣  Testing CREATE operation...')
    const testExpense = {
      user_id: 'demo-user-12345678-1234-1234-1234-123456789012',
      category: 'Materials',
      amount: 1500.00,
      description: 'Test expense for CRUD operations - LED lighting fixtures',
      expense_date: new Date().toISOString().split('T')[0],
      status: 'pending'
    }
    
    const { data: createData, error: createError } = await supabase
      .from('expenses')
      .insert([testExpense])
      .select()
    
    if (createError) {
      throw new Error(`CREATE failed: ${createError.message}`)
    }
    
    testExpenseId = createData[0].id
    console.log(`✅ CREATE successful - Expense ID: ${testExpenseId}`)
    console.log(`   💰 Amount: ₹${createData[0].amount}`)
    console.log(`   📝 Description: ${createData[0].description}`)
    
    // 2. TEST READ (Single)
    console.log('\n2️⃣  Testing READ (single) operation...')
    const { data: readData, error: readError } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', testExpenseId)
      .single()
    
    if (readError) {
      throw new Error(`READ failed: ${readError.message}`)
    }
    
    console.log(`✅ READ successful - Found expense: ${readData.description}`)
    console.log(`   💰 Amount: ₹${readData.amount}`)
    console.log(`   📅 Date: ${readData.expense_date}`)
    console.log(`   🏷️  Category: ${readData.category}`)
    
    // 3. TEST READ (Multiple)
    console.log('\n3️⃣  Testing READ (multiple) operation...')
    const { data: allExpenses, error: allError } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', testExpense.user_id)
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (allError) {
      throw new Error(`READ ALL failed: ${allError.message}`)
    }
    
    console.log(`✅ READ ALL successful - Found ${allExpenses.length} expenses`)
    allExpenses.forEach((expense, index) => {
      console.log(`   ${index + 1}. ${expense.description} - ₹${expense.amount}`)
    })
    
    // 4. TEST UPDATE
    console.log('\n4️⃣  Testing UPDATE operation...')
    const updatedData = {
      amount: 1750.00,
      description: 'Updated test expense - Premium LED lighting fixtures with smart controls',
      status: 'approved'
    }
    
    const { data: updateData, error: updateError } = await supabase
      .from('expenses')
      .update(updatedData)
      .eq('id', testExpenseId)
      .select()
    
    if (updateError) {
      throw new Error(`UPDATE failed: ${updateError.message}`)
    }
    
    console.log(`✅ UPDATE successful`)
    console.log(`   💰 New Amount: ₹${updateData[0].amount}`)
    console.log(`   📝 New Description: ${updateData[0].description}`)
    console.log(`   ✅ New Status: ${updateData[0].status}`)
    
    // 5. TEST FILTERS AND SEARCH
    console.log('\n5️⃣  Testing FILTERS and SEARCH...')
    
    // Filter by category
    const { data: categoryFilter, error: categoryError } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', testExpense.user_id)
      .eq('category', 'Materials')
      .limit(3)
    
    if (categoryError) {
      throw new Error(`FILTER failed: ${categoryError.message}`)
    }
    
    console.log(`✅ CATEGORY FILTER successful - Found ${categoryFilter.length} Materials expenses`)
    
    // Filter by date range (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { data: dateFilter, error: dateError } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', testExpense.user_id)
      .gte('expense_date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('expense_date', { ascending: false })
      .limit(5)
    
    if (dateError) {
      throw new Error(`DATE FILTER failed: ${dateError.message}`)
    }
    
    console.log(`✅ DATE FILTER successful - Found ${dateFilter.length} expenses in last 30 days`)
    
    // Search by description
    const { data: searchResults, error: searchError } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', testExpense.user_id)
      .ilike('description', '%lighting%')
      .limit(3)
    
    if (searchError) {
      throw new Error(`SEARCH failed: ${searchError.message}`)
    }
    
    console.log(`✅ SEARCH successful - Found ${searchResults.length} expenses with 'lighting'`)
    
    // 6. TEST AGGREGATIONS
    console.log('\n6️⃣  Testing AGGREGATIONS...')
    
    // Get total expenses by category
    const { data: categoryTotals, error: aggError } = await supabase
      .from('expenses')
      .select('category, amount')
      .eq('user_id', testExpense.user_id)
    
    if (aggError) {
      throw new Error(`AGGREGATION failed: ${aggError.message}`)
    }
    
    const categoryBreakdown = categoryTotals.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + parseFloat(expense.amount)
      return acc
    }, {})
    
    console.log(`✅ AGGREGATION successful - Category breakdown:`)
    Object.entries(categoryBreakdown).forEach(([category, total]) => {
      console.log(`   ${category}: ₹${total.toFixed(2)}`)
    })
    
    const grandTotal = Object.values(categoryBreakdown).reduce((sum, amount) => sum + amount, 0)
    console.log(`   📊 GRAND TOTAL: ₹${grandTotal.toFixed(2)}`)
    
    // 7. TEST DELETE
    console.log('\n7️⃣  Testing DELETE operation...')
    const { error: deleteError } = await supabase
      .from('expenses')
      .delete()
      .eq('id', testExpenseId)
    
    if (deleteError) {
      throw new Error(`DELETE failed: ${deleteError.message}`)
    }
    
    console.log(`✅ DELETE successful - Test expense removed`)
    
    // Verify deletion
    const { data: verifyData, error: verifyError } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', testExpenseId)
    
    if (verifyError) {
      throw new Error(`DELETE VERIFICATION failed: ${verifyError.message}`)
    }
    
    if (verifyData.length === 0) {
      console.log(`✅ DELETE VERIFIED - Expense no longer exists`)
    } else {
      throw new Error('DELETE FAILED - Expense still exists')
    }
    
    console.log('\n🎉 ALL CRUD OPERATIONS SUCCESSFUL!')
    console.log('✅ CREATE - Working')
    console.log('✅ READ (Single & Multiple) - Working') 
    console.log('✅ UPDATE - Working')
    console.log('✅ DELETE - Working')
    console.log('✅ FILTERS & SEARCH - Working')
    console.log('✅ AGGREGATIONS - Working')
    console.log('\n🌐 Ready for testing at: http://localhost:3001/expenses')
    
  } catch (error) {
    console.error('❌ CRUD Test Failed:', error.message)
    
    // Cleanup test data if exists
    if (testExpenseId) {
      console.log('🧹 Cleaning up test data...')
      try {
        await supabase.from('expenses').delete().eq('id', testExpenseId)
        console.log('✅ Test data cleaned up')
      } catch (cleanupError) {
        console.log('⚠️  Cleanup failed:', cleanupError.message)
      }
    }
    
    process.exit(1)
  }
}

// Run the test
testExpenseCRUD().then(() => {
  console.log('✨ CRUD testing completed successfully!')
  process.exit(0)
}).catch(error => {
  console.error('💥 CRUD testing failed:', error)
  process.exit(1)
})