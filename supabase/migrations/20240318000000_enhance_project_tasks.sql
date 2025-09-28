-- Create Project Templates table
CREATE TABLE project_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  project_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhance Project Tasks table
DROP TABLE IF EXISTS project_tasks CASCADE;
CREATE TABLE project_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  template_id UUID REFERENCES project_templates(id),
  name TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES profiles(id),
  role TEXT,
  start_date DATE,
  due_date DATE,
  estimated_hours DECIMAL(6,2),
  actual_hours DECIMAL(6,2) DEFAULT 0,
  is_milestone BOOLEAN DEFAULT FALSE,
  weight DECIMAL(5,2) DEFAULT 1.0, -- Task importance weight for progress calculation
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed, blocked
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  dependencies TEXT[], -- Array of task IDs this task depends on
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Task Time Logs table
CREATE TABLE task_time_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES project_tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  hours_logged DECIMAL(6,2),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add template_id to projects table
ALTER TABLE projects
ADD COLUMN template_id UUID REFERENCES project_templates(id),
ADD COLUMN progress DECIMAL(5,2) DEFAULT 0;

-- Enable RLS on new tables
ALTER TABLE project_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_time_logs ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for project_templates
CREATE POLICY "Users can view own project templates" 
  ON project_templates FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own project templates" 
  ON project_templates FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own project templates" 
  ON project_templates FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own project templates" 
  ON project_templates FOR DELETE 
  USING (auth.uid() = user_id);

-- Add RLS policies for project_tasks
CREATE POLICY "Users can view project tasks"
  ON project_tasks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_tasks.project_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert project tasks"
  ON project_tasks FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_tasks.project_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update project tasks"
  ON project_tasks FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_tasks.project_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete project tasks"
  ON project_tasks FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_tasks.project_id
    AND projects.user_id = auth.uid()
  ));

-- Add RLS policies for task_time_logs
CREATE POLICY "Users can view task time logs"
  ON task_time_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM project_tasks
    JOIN projects ON projects.id = project_tasks.project_id
    WHERE project_tasks.id = task_time_logs.task_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert task time logs"
  ON task_time_logs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM project_tasks
    JOIN projects ON projects.id = project_tasks.project_id
    WHERE project_tasks.id = task_time_logs.task_id
    AND projects.user_id = auth.uid()
  ));

-- Add triggers for updated_at columns
CREATE TRIGGER update_project_templates_updated_at 
  BEFORE UPDATE ON project_templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_tasks_updated_at 
  BEFORE UPDATE ON project_tasks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();