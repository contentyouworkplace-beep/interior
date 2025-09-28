-- Fix Database Schema Issues for Dashboard Integration
-- This script fixes missing tables and columns to make the dashboard work properly

-- 1. Create tasks table for schedule management (if not exists)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  client_id UUID REFERENCES clients(id),
  project_id UUID REFERENCES projects(id),
  title TEXT NOT NULL,
  description TEXT,
  task_date DATE NOT NULL,
  task_time TIME,
  task_type TEXT DEFAULT 'personal', -- meeting, deadline, personal, call
  priority TEXT DEFAULT 'medium', -- low, medium, high
  status TEXT DEFAULT 'pending', -- pending, completed, cancelled
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add progress column to projects table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'progress'
    ) THEN
        ALTER TABLE projects ADD COLUMN progress DECIMAL(5,2) DEFAULT 0;
    END IF;
END $$;

-- 3. Add status column to payments table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'status'
    ) THEN
        ALTER TABLE payments ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;
END $$;

-- 4. Ensure tasks table has proper RLS policies
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;

-- Create RLS policies for tasks
CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON tasks FOR DELETE USING (auth.uid() = user_id);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_task_date ON tasks(task_date);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_progress ON projects(progress);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- 6. Create or replace function to update tasks.updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Update any existing projects to have some progress for demo purposes
UPDATE projects 
SET progress = CASE 
    WHEN status = 'completed' THEN 100
    WHEN status = 'in_progress' THEN RANDOM() * 50 + 25  -- Random between 25-75%
    WHEN status = 'review' THEN RANDOM() * 20 + 70      -- Random between 70-90%
    WHEN status = 'planning' THEN RANDOM() * 25         -- Random between 0-25%
    ELSE 0
END
WHERE progress IS NULL OR progress = 0;

-- 9. Ensure payments table has some status values for demo
UPDATE payments 
SET status = CASE 
    WHEN amount_paid >= total_amount THEN 'paid'
    WHEN amount_paid > 0 THEN 'partial'
    ELSE 'pending'
END
WHERE status IS NULL OR status = '';

-- 10. Insert some sample schedule tasks for demo (only if none exist)
INSERT INTO tasks (user_id, title, description, task_date, task_time, task_type, priority, completed)
SELECT 
    auth.uid(),
    'Client meeting - Villa project',
    'Discuss final interior design plans and material selection',
    CURRENT_DATE,
    '10:00:00',
    'meeting',
    'high',
    false
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE user_id = auth.uid() AND task_date = CURRENT_DATE)
AND auth.uid() IS NOT NULL;

INSERT INTO tasks (user_id, title, description, task_date, task_time, task_type, priority, completed)
SELECT 
    auth.uid(),
    'Submit design proposal',
    'Complete and send the updated design proposal to client',
    CURRENT_DATE,
    '14:00:00',
    'deadline',
    'medium',
    false
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE user_id = auth.uid() AND title = 'Submit design proposal')
AND auth.uid() IS NOT NULL;

-- 11. Grant necessary permissions (if needed)
-- These might be needed depending on your RLS setup
GRANT ALL ON tasks TO authenticated;
GRANT ALL ON expenses TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;