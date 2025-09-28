// Debug script to test payment persistence
// Run this in the browser console when logged in to test payment saving

async function debugPaymentPersistence() {
  console.log('🔧 Debug: Testing Payment Persistence')
  
  try {
    // Get the first team member
    const teamResponse = await fetch('/api/team')
    const teamData = await teamResponse.json()
    
    if (!teamData.data || teamData.data.length === 0) {
      console.log('❌ No team members found')
      return
    }
    
    const firstMember = teamData.data[0]
    console.log('✅ Testing with team member:', firstMember.name, '(ID:', firstMember.id, ')')
    
    // Test payment creation
    const paymentData = {
      payment_type: 'monthly_salary',
      amount: 45000,
      description: 'Debug Test Payment - December Salary',
      payment_date: '2024-12-20',
      notes: 'Testing payment persistence fix'
    }
    
    console.log('💰 Creating payment record:', paymentData)
    
    const createResponse = await fetch(`/api/team/${firstMember.id}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData)
    })
    
    const createResult = await createResponse.json()
    console.log('📝 Payment Creation Response:', createResult)
    
    if (!createResponse.ok) {
      console.log('❌ Payment creation failed:', createResult.error)
      return
    }
    
    // Test payment retrieval
    console.log('🔍 Fetching payment records...')
    
    const fetchResponse = await fetch(`/api/team/${firstMember.id}/payments`)
    const fetchResult = await fetchResponse.json()
    
    console.log('📊 Payment Fetch Response:', fetchResult)
    
    if (fetchResponse.ok) {
      console.log(`✅ Found ${fetchResult.data?.length || 0} payment records`)
      
      if (fetchResult.data && fetchResult.data.length > 0) {
        console.log('💳 Recent payments:')
        fetchResult.data.slice(0, 3).forEach((payment, index) => {
          console.log(`   ${index + 1}. ${payment.payment_type}: ₹${payment.amount} - ${payment.description}`)
          console.log(`      Date: ${payment.payment_date} | Created: ${payment.created_at}`)
        })
      }
      
      // Check if our test payment was saved
      const ourPayment = fetchResult.data?.find(p => 
        p.description.includes('Debug Test Payment') && 
        p.amount === paymentData.amount
      )
      
      if (ourPayment) {
        console.log('🎯 SUCCESS: Test payment was properly saved and retrieved!')
        console.log('   Payment ID:', ourPayment.id)
        console.log('   Amount:', ourPayment.amount)
        console.log('   Date:', ourPayment.payment_date)
      } else {
        console.log('⚠️ WARNING: Test payment was created but not found in results')
      }
    } else {
      console.log('❌ Failed to fetch payments:', fetchResult.error)
    }
    
  } catch (error) {
    console.error('❌ Debug test failed:', error)
  }
}

// Instructions for manual testing
console.log(`
🧪 PAYMENT PERSISTENCE DEBUG TOOL

To test payment persistence:

1. Open your browser and go to: http://localhost:3001
2. Log in to your account
3. Open browser developer tools (F12)
4. Go to the Console tab
5. Paste this entire script and press Enter
6. Run: debugPaymentPersistence()

This will test:
- Team member retrieval
- Payment record creation
- Payment record persistence
- Payment record retrieval

The test will create a sample payment and verify it's properly saved to the database.
`)

// Auto-run if we're in a browser context
if (typeof window !== 'undefined') {
  console.log('🚀 Ready to test! Run: debugPaymentPersistence()')
} else {
  console.log('📝 This script should be run in the browser console when logged in')
}