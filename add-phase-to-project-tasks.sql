-- Add phase_id to project_tasks to support custom Kanban columns per project
-- Safe to run multiple times; uses IF NOT EXISTS guards where possible

-- 1) Add column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'project_tasks' AND column_name = 'phase_id'
  ) THEN
    ALTER TABLE public.project_tasks ADD COLUMN phase_id UUID NULL;
  END IF;
END$$;

-- 2) Create index for faster grouping/filtering
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' AND indexname = 'idx_project_tasks_phase_id'
  ) THEN
    CREATE INDEX idx_project_tasks_phase_id ON public.project_tasks(phase_id);
  END IF;
END$$;

-- 3) Add foreign key to project_phases if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'project_tasks'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'phase_id'
  ) THEN
    ALTER TABLE public.project_tasks
      ADD CONSTRAINT project_tasks_phase_id_fkey
      FOREIGN KEY (phase_id) REFERENCES public.project_phases(id) ON DELETE SET NULL;
  END IF;
END$$;

-- Note:
-- - Existing tasks will have phase_id = NULL and will show under an unassigned bucket until edited.
-- - RLS on project_tasks remains unchanged; access is still tied to the parent project via project_id.
