-- Add priority field to project_tasks
ALTER TABLE project_tasks
ADD COLUMN priority TEXT DEFAULT 'medium';