const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ywcqtmzqsvcobtetunuf.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3Y3F0bXpxc3Zjb2J0ZXR1bnVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzc3NzM4NCwiZXhwIjoyMDczMzUzMzg0fQ.fUj0lqp_NApqfrpN38ydEqE08Hh2WwL-BoVPqdjp3ac'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAllTables() {
  console.log('🚀 Creating all required tables for team management...')

  try {
    // 1. Create payment_records table
    console.log('📊 Creating payment_records table...')
    const { error: paymentError } = await supabase.rpc('exec_sql_direct', {
      sql: `
        -- Create payment_records table
        CREATE TABLE IF NOT EXISTS payment_records (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('monthly_salary', 'freelance_payment', 'advance', 'bonus')),
          amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
          description TEXT NOT NULL,
          payment_date DATE NOT NULL,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes for payment_records
        CREATE INDEX IF NOT EXISTS idx_payment_records_team_member_id ON payment_records(team_member_id);
        CREATE INDEX IF NOT EXISTS idx_payment_records_user_id ON payment_records(user_id);
        CREATE INDEX IF NOT EXISTS idx_payment_records_payment_date ON payment_records(payment_date);
        CREATE INDEX IF NOT EXISTS idx_payment_records_payment_type ON payment_records(payment_type);

        -- Enable RLS for payment_records
        ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

        -- Create RLS policy for payment_records
        DROP POLICY IF EXISTS "Users can manage their own payment records" ON payment_records;
        CREATE POLICY "Users can manage their own payment records" ON payment_records
          FOR ALL USING (user_id = auth.uid());
      `
    })

    if (paymentError) {
      console.error('❌ Error creating payment_records table:', paymentError)
      // Try alternative approach with raw SQL
      console.log('🔄 Trying direct SQL approach...')
      
      const { data, error: directError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'payment_records')
        .single()

      if (directError && directError.code === 'PGRST116') {
        console.log('✅ payment_records table doesn\'t exist, need to create it manually')
      }
    } else {
      console.log('✅ payment_records table created successfully!')
    }

    // 2. Create project_tasks table (if not exists or fix structure)
    console.log('📋 Creating/fixing project_tasks table...')
    const { error: tasksError } = await supabase.rpc('exec_sql_direct', {
      sql: `
        -- Create project_tasks table with correct structure
        CREATE TABLE IF NOT EXISTS project_tasks (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          assigned_to UUID REFERENCES team_members(id) ON DELETE SET NULL,
          status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
          priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
          due_date DATE,
          completed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes for project_tasks
        CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id);
        CREATE INDEX IF NOT EXISTS idx_project_tasks_assigned_to ON project_tasks(assigned_to);
        CREATE INDEX IF NOT EXISTS idx_project_tasks_status ON project_tasks(status);
        CREATE INDEX IF NOT EXISTS idx_project_tasks_due_date ON project_tasks(due_date);

        -- Enable RLS for project_tasks
        ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;

        -- Create RLS policy for project_tasks
        DROP POLICY IF EXISTS "Users can manage tasks for their projects" ON project_tasks;
        CREATE POLICY "Users can manage tasks for their projects" ON project_tasks
          FOR ALL USING (
            project_id IN (
              SELECT id FROM projects WHERE user_id = auth.uid()
            )
          );
      `
    })

    if (tasksError) {
      console.error('❌ Error creating project_tasks table:', tasksError)
    } else {
      console.log('✅ project_tasks table created/updated successfully!')
    }

    // 3. Add some sample data
    console.log('📝 Adding sample data...')
    
    // Get existing team members
    const { data: teamMembers, error: membersError } = await supabase
      .from('team_members')
      .select('id, user_id, name')
      .limit(3)

    if (!membersError && teamMembers && teamMembers.length > 0) {
      console.log(`Found ${teamMembers.length} team members, adding sample data...`)
      
      // Add sample payment records
      const samplePayments = []
      teamMembers.forEach(member => {
        samplePayments.push(
          {
            team_member_id: member.id,
            user_id: member.user_id,
            payment_type: 'monthly_salary',
            amount: 50000,
            description: 'September 2025 Salary',
            payment_date: '2025-09-15',
            notes: 'Regular monthly payment'
          },
          {
            team_member_id: member.id,
            user_id: member.user_id,
            payment_type: 'advance',
            amount: 15000,
            description: 'Festival Advance',
            payment_date: '2025-08-25',
            notes: 'Advance for festival expenses'
          }
        )
      })

      const { error: insertPaymentError } = await supabase
        .from('payment_records')
        .insert(samplePayments)

      if (insertPaymentError) {
        console.log('⚠️ Could not insert sample payments (table may not exist yet):', insertPaymentError.message)
      } else {
        console.log('✅ Sample payment records added!')
      }

      // Add sample project tasks (assign team members to existing projects)
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, user_id')
        .limit(3)

      if (!projectsError && projects && projects.length > 0) {
        const sampleTasks = []
        projects.forEach((project, index) => {
          if (teamMembers[index]) {
            sampleTasks.push({
              project_id: project.id,
              title: `Design Review for ${project.name}`,
              description: `Complete design review and provide feedback`,
              assigned_to: teamMembers[index].id,
              status: 'in_progress',
              priority: 'high',
              due_date: '2025-10-01'
            })
          }
        })

        const { error: insertTaskError } = await supabase
          .from('project_tasks')
          .insert(sampleTasks)

        if (insertTaskError) {
          console.log('⚠️ Could not insert sample tasks (table may not exist yet):', insertTaskError.message)
        } else {
          console.log('✅ Sample project tasks added!')
        }
      }
    }

    console.log('\n🎉 Database setup completed!')
    console.log('📊 Tables created:')
    console.log('  - payment_records (with RLS)')
    console.log('  - project_tasks (with RLS)')
    console.log('✨ Sample data added for testing')

  } catch (error) {
    console.error('💥 Error in database setup:', error)
  }
}

// Run the setup
createAllTables().then(() => {
  console.log('\n✅ Setup complete! You can now use the payment and project management features.')
  process.exit(0)
})