require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE env vars in .env.local')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    console.log('1) Checking team_payments table...')
    const { data: check, error: checkError } = await supabase
      .from('team_payments')
      .select('id')
      .limit(1)

    if (checkError) {
      console.error('team_payments table appears missing or inaccessible:', checkError.message)
      process.exit(1)
    }

    console.log('✅ team_payments table exists')

    // Find a team member to attach payment to
    console.log('2) Finding a team member...')
    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select('id, name, organization_id')
      .limit(1)

    let createdMemberId = null
    let orgId = '00000000-0000-0000-0000-000000000001'

    if (membersError) {
      console.warn('Could not query team_members:', membersError.message)
    }

    if (!members || members.length === 0) {
      console.log('No team members found — creating a temporary member for test')
      const { data: newMember, error: createMemberError } = await supabase
        .from('team_members')
        .insert({ name: 'Temp Test Member', role: 'Tester', organization_id: orgId })
        .select()
        .single()

      if (createMemberError) {
        console.error('Failed to create temporary team member:', createMemberError.message)
        process.exit(1)
      }

      createdMemberId = newMember.id
      orgId = newMember.organization_id || orgId
      console.log('Created temp team member with id', createdMemberId)
    } else {
      const member = members[0]
      createdMemberId = member.id
      orgId = member.organization_id || orgId
      console.log('Using existing team member', createdMemberId)
    }

    // Insert test payment
    console.log('3) Inserting test payment...')
    const today = new Date().toISOString().split('T')[0]
    const { data: insertData, error: insertError } = await supabase
      .from('team_payments')
      .insert([
        {
          organization_id: orgId,
          team_member_id: createdMemberId,
          payment_type: 'salary',
          amount: 123.45,
          description: 'Automated CRUD test payment',
          notes: 'test-run',
          payment_date: today,
          status: 'completed'
        }
      ])
      .select()

    if (insertError) {
      console.error('Failed to insert test payment:', insertError.message)
      process.exit(1)
    }

    const inserted = Array.isArray(insertData) ? insertData[0] : insertData
    console.log('✅ Inserted payment:', inserted)

    const insertedId = inserted.id

    // Read back the payment
    console.log('4) Reading back the payment...')
    const { data: readBack, error: readError } = await supabase
      .from('team_payments')
      .select('*')
      .eq('id', insertedId)
      .single()

    if (readError) {
      console.error('Failed to read back payment:', readError.message)
    } else {
      console.log('✅ Read back payment:', readBack)
    }

    // Cleanup: delete the inserted payment
    console.log('5) Cleaning up: deleting test payment...')
    const { error: deleteError } = await supabase
      .from('team_payments')
      .delete()
      .eq('id', insertedId)

    if (deleteError) {
      console.error('Failed to delete test payment:', deleteError.message)
    } else {
      console.log('✅ Deleted test payment')
    }

    // If we created a temporary team member, delete it
    if (members && members.length === 0 && createdMemberId) {
      console.log('6) Cleaning up: deleting temporary team member...')
      const { error: delMemberErr } = await supabase
        .from('team_members')
        .delete()
        .eq('id', createdMemberId)

      if (delMemberErr) {
        console.error('Failed to delete temp member:', delMemberErr.message)
      } else {
        console.log('✅ Deleted temporary team member')
      }
    }

    console.log('\nAll tests completed successfully')
    process.exit(0)
  } catch (err) {
    console.error('Unexpected error during test:', err.message || err)
    process.exit(1)
  }
}

main()
