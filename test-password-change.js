import { createClient } from '@supabase/supabase-js'

// Test Password Change Functionality
// Run this script to test if password changes work properly

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testPasswordChange() {
  console.log('🧪 Testing Password Change Functionality...\n')

  try {
    // Step 1: Test login with current credentials
    console.log('Step 1: Testing login with current password...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'demo@interior-crm.com',
      password: 'Demo123!@#'
    })

    if (loginError) {
      console.error('❌ Login failed:', loginError.message)
      return
    }
    console.log('✅ Login successful with current password')

    // Step 2: Test password update
    console.log('\nStep 2: Testing password update...')
    const { error: updateError } = await supabase.auth.updateUser({
      password: 'NewDemo456!@#'
    })

    if (updateError) {
      console.error('❌ Password update failed:', updateError.message)
      return
    }
    console.log('✅ Password updated successfully')

    // Step 3: Sign out
    console.log('\nStep 3: Signing out...')
    await supabase.auth.signOut()
    console.log('✅ Signed out successfully')

    // Step 4: Test login with new password
    console.log('\nStep 4: Testing login with new password...')
    const { data: newLoginData, error: newLoginError } = await supabase.auth.signInWithPassword({
      email: 'demo@interior-crm.com',
      password: 'NewDemo456!@#'
    })

    if (newLoginError) {
      console.error('❌ Login with new password failed:', newLoginError.message)
      return
    }
    console.log('✅ Login successful with new password')

    // Step 5: Reset password back to original for consistency
    console.log('\nStep 5: Resetting password back to original...')
    const { error: resetError } = await supabase.auth.updateUser({
      password: 'Demo123!@#'
    })

    if (resetError) {
      console.error('❌ Password reset failed:', resetError.message)
      return
    }
    console.log('✅ Password reset to original value')

    console.log('\n🎉 All password change tests passed!')

  } catch (error) {
    console.error('💥 Test failed with error:', error)
  }
}

// Run the test
testPasswordChange()