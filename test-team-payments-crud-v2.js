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
      .select('id, name')
      .limit(1)

    let createdMemberId = null

    if (membersError) {
      console.warn('Could not query team_members:', membersError.message)
    }

    if (!members || members.length === 0) {
      console.log('No team members found — creating a temporary member for test')
      const { data: newMember, error: createMemberError } = await supabase
        .from('team_members')
        .insert({ name: 'Temp Test Member', role: 'Tester' })
        .select()
        .single()

      if (createMemberError) {
        console.error('Failed to create temporary team member:', createMemberError.message)
        process.exit(1)
      }

      createdMemberId = newMember.id
      console.log('Created temp team member with id', createdMemberId)
    } else {
      const member = members[0]
      createdMemberId = member.id
      console.log('Using existing team member', createdMemberId)
    }

    // Insert test payment
    console.log('3) Inserting test payment...')
    const today = new Date().toISOString().split('T')[0]
    const { data: insertData, error: insertError } = await supabase
      .from('team_payments')
      .insert([
        {
          organization_id: null, // if RLS requires, this will fail
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
      // If insert failed because organization_id not nullable, attempt without it
      if (insertError.message && insertError.message.includes('null value in column "organization_id"')) {
        console.log('Retrying insert without organization_id (let RLS/service role bypass)')
        const { data: insertData2, error: insertError2 } = await supabase
          .from('team_payments')
          .insert([
            {
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

        if (insertError2) {
          console.error('Second insert attempt failed:', insertError2.message)
          process.exit(1)
        } else {
          console.log('✅ Inserted payment (second attempt):', insertData2[0])
        }
      } else {
        process.exit(1)
      }
    } else {
      const inserted = Array.isArray(insertData) ? insertData[0] : insertData
      console.log('✅ Inserted payment:', inserted)
    }

    console.log('All done - cleanup is omitted in this run')
    process.exit(0)
  } catch (err) {
    console.error('Unexpected error during test:', err.message || err)
    process.exit(1)
  }
}

main()
