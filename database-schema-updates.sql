-- Database Schema Updates for GoPLNR CRM Dashboard
-- Execute this in Supabase Dashboard > SQL Editor

-- 1. Create tasks table for personal schedule
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  scheduled_date date NOT NULL,
  scheduled_time time,
  client_id uuid REFERENCES public.clients(id),
  type text DEFAULT 'personal' CHECK (type IN ('meeting', 'deadline', 'personal', 'call')),
  completed boolean DEFAULT false,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add missing progress column to projects
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'progress'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);
  END IF;
END $$;

-- 3. Add missing status column to payments
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.payments ADD COLUMN status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue', 'cancelled'));
  END IF;
END $$;

-- 4. Create RLS policies for tasks table
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
CREATE POLICY "Users can view own tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
CREATE POLICY "Users can insert own tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
CREATE POLICY "Users can update own tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
CREATE POLICY "Users can delete own tasks" ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Update expenses RLS policies
DROP POLICY IF EXISTS "Users can view own expenses" ON public.expenses;
CREATE POLICY "Users can view own expenses" ON public.expenses
  FOR SELECT USING (auth.uid() = user_id);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS tasks_user_id_date_idx ON public.tasks(user_id, scheduled_date);
CREATE INDEX IF NOT EXISTS tasks_scheduled_date_idx ON public.tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS projects_user_id_updated_idx ON public.projects(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS payments_status_idx ON public.payments(status);

-- 7. Create trigger to update updated_at timestamp for tasks
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Insert some sample data for testing with your user ID
-- Replace 'your-user-id-here' with your actual authenticated user ID
INSERT INTO public.tasks (title, scheduled_date, scheduled_time, type, user_id) VALUES
  ('Client meeting - Villa project', CURRENT_DATE, '10:00:00', 'meeting', '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6'),
  ('Submit design proposal', CURRENT_DATE, '14:00:00', 'deadline', '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6'),
  ('Call supplier for materials', CURRENT_DATE + 1, '09:30:00', 'call', '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6')
ON CONFLICT (id) DO NOTHING;

-- 9. Update existing projects with progress values
UPDATE public.projects 
SET progress = CASE 
  WHEN status = 'completed' THEN 100
  WHEN status = 'in_progress' THEN 75
  WHEN status = 'planning' THEN 25
  ELSE 0
END
WHERE progress IS NULL;