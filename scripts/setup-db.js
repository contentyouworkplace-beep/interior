const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('URL:', supabaseUrl ? '✅ Found' : '❌ Missing')
console.log('Service Key:', supabaseServiceKey ? '✅ Found' : '❌ Missing')

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupDatabase() {
  console.log('🚀 Setting up your Interior Design CRM...')
  
  try {
    // 1. Create test user
    console.log('👤 Creating test user...')
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@yourcompany.com',
      password: 'password123',
      email_confirm: true
    })

    if (authError && !authError.message.includes('already registered')) {
      throw authError
    }

    const userId = authUser?.user?.id || 'user-not-found'
    console.log('✅ Test user created/exists:', authUser?.user?.email)

    // 2. Create user profile
    console.log('📋 Creating user profile...')
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        first_name: 'Admin',
        last_name: 'User',
        company_name: 'Your Interior Design Company',
        role: 'designer'
      })

    if (profileError) {
      console.log('Profile error (might already exist):', profileError.message)
    } else {
      console.log('✅ User profile created')
    }

    // 3. Create sample clients
    console.log('👥 Creating sample clients...')
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .upsert([
        {
          user_id: userId,
          first_name: 'Ahmed',
          last_name: 'Al Mansouri',
          email: 'ahmed@example.com',
          phone: '+971 50 123 4567',
          company: 'Al Mansouri Holdings',
          city: 'Dubai',
          country: 'UAE',
          client_type: 'business',
          budget_range: '500000-1000000',
          status: 'active',
          notes: 'VIP client interested in luxury villa design'
        },
        {
          user_id: userId,
          first_name: 'Sarah',
          last_name: 'Johnson',
          email: 'sarah@example.com',
          phone: '+971 55 987 6543',
          city: 'Abu Dhabi',
          country: 'UAE',
          client_type: 'individual',
          budget_range: '100000-500000',
          status: 'active',
          notes: 'Modern apartment renovation project'
        }
      ])

    if (clientError) {
      console.log('Client error:', clientError.message)
    } else {
      console.log('✅ Sample clients created')
    }

    // 4. Create sample projects
    if (clients && clients.length > 0) {
      console.log('📁 Creating sample projects...')
      const { error: projectError } = await supabase
        .from('projects')
        .upsert([
          {
            user_id: userId,
            client_id: clients[0].id,
            name: 'Villa Renovation - Palm Jumeirah',
            description: 'Complete interior design and renovation of luxury villa',
            project_type: 'residential',
            status: 'in_progress',
            priority: 'high',
            budget: 750000,
            start_date: '2024-09-01',
            end_date: '2025-03-01',
            completion_percentage: 65,
            location: 'Palm Jumeirah, Dubai',
            square_footage: 8500,
            style_preference: 'Modern Luxury'
          },
          {
            user_id: userId,
            client_id: clients[1].id,
            name: 'Office Design - DIFC',
            description: 'Modern office space design for financial services company',
            project_type: 'commercial',
            status: 'planning',
            priority: 'medium',
            budget: 250000,
            start_date: '2024-10-15',
            end_date: '2024-12-30',
            completion_percentage: 25,
            location: 'DIFC, Dubai',
            square_footage: 3500,
            style_preference: 'Contemporary'
          }
        ])

      if (projectError) {
        console.log('Project error:', projectError.message)
      } else {
        console.log('✅ Sample projects created')
      }
    }

    // 5. Create sample expenses
    console.log('💰 Creating sample expenses...')
    const { error: expenseError } = await supabase
      .from('expenses')
      .upsert([
        {
          user_id: userId,
          category: 'Materials',
          amount: 15000,
          description: 'Premium marble tiles for villa bathroom',
          expense_date: '2024-09-15',
          status: 'approved'
        },
        {
          user_id: userId,
          category: 'Travel',
          amount: 2500,
          description: 'Client meeting travel expenses',
          expense_date: '2024-09-20',
          status: 'approved'
        },
        {
          user_id: userId,
          category: 'Equipment',
          amount: 8500,
          description: 'Professional design software licenses',
          expense_date: '2024-09-10',
          status: 'approved'
        }
      ])

    if (expenseError) {
      console.log('Expense error:', expenseError.message)
    } else {
      console.log('✅ Sample expenses created')
    }

    console.log('\n🎉 Setup Complete!')
    console.log('📧 Email: admin@yourcompany.com')
    console.log('🔐 Password: password123')
    console.log('🌐 Visit: http://localhost:3000')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

setupDatabase()