
-- Migration: Add phase_id to project_tasks
ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS phase_id UUID NULL;
CREATE INDEX IF NOT EXISTS idx_project_tasks_phase_id ON public.project_tasks(phase_id);
ALTER TABLE public.project_tasks 
  DROP CONSTRAINT IF EXISTS project_tasks_phase_id_fkey;
ALTER TABLE public.project_tasks 
  ADD CONSTRAINT project_tasks_phase_id_fkey 
  FOREIGN KEY (phase_id) REFERENCES public.project_phases(id) ON DELETE SET NULL;
