const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ywcqtmzqsvcobtetunuf.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3Y3F0bXpxc3Zjb2J0ZXR1bnVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzc3NzM4NCwiZXhwIjoyMDczMzUzMzg0fQ.fUj0lqp_NApqfrpN38ydEqE08Hh2WwL-BoVPqdjp3ac'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixDatabaseSchema() {
  console.log('🔧 Fixing database schema issues...')

  try {
    // 1. Create tasks table
    console.log('📋 Creating tasks table...')
    const { error: createTasksError } = await supabase.rpc('sql', {
      query: `
        CREATE TABLE IF NOT EXISTS tasks (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) NOT NULL,
          client_id UUID REFERENCES clients(id),
          project_id UUID REFERENCES projects(id),
          title TEXT NOT NULL,
          description TEXT,
          task_date DATE NOT NULL,
          task_time TIME,
          task_type TEXT DEFAULT 'personal',
          priority TEXT DEFAULT 'medium',
          status TEXT DEFAULT 'pending',
          completed BOOLEAN DEFAULT FALSE,
          completed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (createTasksError) {
      console.log('ℹ️ Tasks table might already exist:', createTasksError.message)
    } else {
      console.log('✅ Tasks table created successfully')
    }

    // 2. Add progress column to projects
    console.log('📊 Adding progress column to projects...')
    const { error: progressError } = await supabase.rpc('sql', {
      query: `
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'projects' AND column_name = 'progress'
            ) THEN
                ALTER TABLE projects ADD COLUMN progress DECIMAL(5,2) DEFAULT 0;
            END IF;
        END $$;
      `
    })

    if (progressError) {
      console.log('⚠️ Progress column issue:', progressError.message)
    } else {
      console.log('✅ Progress column added to projects')
    }

    // 3. Add status column to payments
    console.log('💳 Adding status column to payments...')
    const { error: statusError } = await supabase.rpc('sql', {
      query: `
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'payments' AND column_name = 'status'
            ) THEN
                ALTER TABLE payments ADD COLUMN status TEXT DEFAULT 'pending';
            END IF;
        END $$;
      `
    })

    if (statusError) {
      console.log('⚠️ Payment status column issue:', statusError.message)
    } else {
      console.log('✅ Status column added to payments')
    }

    // 4. Enable RLS on tasks table
    console.log('🔒 Setting up RLS for tasks...')
    const { error: rlsError } = await supabase.rpc('sql', {
      query: `
        ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
        DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
        DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
        DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;
        
        CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id);
        CREATE POLICY "Users can delete own tasks" ON tasks FOR DELETE USING (auth.uid() = user_id);
      `
    })

    if (rlsError) {
      console.log('⚠️ RLS setup issue:', rlsError.message)
    } else {
      console.log('✅ RLS policies created for tasks')
    }

    // 5. Create indexes
    console.log('📇 Creating indexes...')
    const { error: indexError } = await supabase.rpc('sql', {
      query: `
        CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
        CREATE INDEX IF NOT EXISTS idx_tasks_task_date ON tasks(task_date);
        CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);
        CREATE INDEX IF NOT EXISTS idx_projects_progress ON projects(progress);
        CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
      `
    })

    if (indexError) {
      console.log('⚠️ Index creation issue:', indexError.message)
    } else {
      console.log('✅ Indexes created successfully')
    }

    console.log('🎉 Database schema fix completed!')

  } catch (error) {
    console.error('❌ Error fixing database schema:', error)
  }
}

fixDatabaseSchema()