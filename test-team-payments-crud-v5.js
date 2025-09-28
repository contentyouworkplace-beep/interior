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
    console.log('1) Check team_payments...')
    const { error: checkError } = await supabase
      .from('team_payments')
      .select('id')
      .limit(1)

    if (checkError) {
      console.error('team_payments not accessible:', checkError.message)
      process.exit(1)
    }
    console.log('✅ team_payments exists')

    // Use a known auth user id (discovered via earlier listing)
    // This avoids admin.listUsers dependency in some environments
    const orgUserId = 'af5c8a89-2f00-4803-9555-11488ca30206'
    console.log('Using hard-coded auth user id:', orgUserId)

    // Find or create team member
    console.log('3) Finding or creating team member...')
    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select('id, name')
      .limit(1)

    let memberId
    let createdMember = false

    if (!members || members.length === 0) {
      const { data: nm, error: nmErr } = await supabase
        .from('team_members')
        .insert({ name: 'Temp Test Member', role: 'Tester' })
        .select()
        .single()
      if (nmErr) {
        console.error('Failed to create team member:', nmErr.message)
        process.exit(1)
      }
      memberId = nm.id
      createdMember = true
      console.log('Created temp member', memberId)
    } else {
      memberId = members[0].id
      console.log('Using existing member', memberId)
    }

    // Insert payment with organization_id = orgUserId
    console.log('4) Inserting payment...')
    const today = new Date().toISOString().split('T')[0]
    const { data: inserted, error: insertErr } = await supabase
      .from('team_payments')
      .insert([
        {
          organization_id: orgUserId,
          team_member_id: memberId,
          payment_type: 'salary',
          amount: 250.5,
          description: 'Test payment v5',
          notes: 'service-key admin test',
          payment_date: today,
          status: 'completed'
        }
      ])
      .select()

    if (insertErr) {
      console.error('Insert failed:', insertErr.message)
      process.exit(1)
    }
    const insertedRow = Array.isArray(inserted) ? inserted[0] : inserted
    console.log('✅ Inserted:', insertedRow)

    // Read back
    console.log('5) Reading back...')
    const { data: readBack, error: readErr } = await supabase
      .from('team_payments')
      .select('*')
      .eq('id', insertedRow.id)
      .single()

    if (readErr) {
      console.error('Read failed:', readErr.message)
    } else {
      console.log('✅ Read back:', readBack)
    }

    // Cleanup
    console.log('6) Deleting test payment...')
    const { error: delErr } = await supabase.from('team_payments').delete().eq('id', insertedRow.id)
    if (delErr) console.error('Failed to delete test payment:', delErr.message)
    else console.log('✅ Deleted test payment')

    if (createdMember) {
      console.log('7) Deleting temp member...')
      const { error: delMemErr } = await supabase.from('team_members').delete().eq('id', memberId)
      if (delMemErr) console.error('Failed to delete temp member:', delMemErr.message)
      else console.log('✅ Deleted temp member')
    }

    console.log('\nCRUD test completed successfully')
    process.exit(0)
  } catch (err) {
    console.error('Unexpected error:', err)
    process.exit(1)
  }
}

main()
