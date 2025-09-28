#!/bin/bash
# Apply the phase_id migration using curl and Supabase REST API

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

# Read the .env.local file
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Missing environment variables"
    exit 1
fi

echo "🔧 Applying phase_id migration via SQL..."

# The SQL to execute
SQL='
-- Add phase_id column to project_tasks
ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS phase_id UUID NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_project_tasks_phase_id ON public.project_tasks(phase_id);

-- Add foreign key constraint
ALTER TABLE public.project_tasks 
  DROP CONSTRAINT IF EXISTS project_tasks_phase_id_fkey;
  
ALTER TABLE public.project_tasks 
  ADD CONSTRAINT project_tasks_phase_id_fkey 
  FOREIGN KEY (phase_id) REFERENCES public.project_phases(id) ON DELETE SET NULL;
'

# Try using PostgREST's SQL execution (if available)
curl -X POST "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/query" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"${SQL}\"}"

echo -e "\n"
echo "If the above failed, please run this SQL manually in your Supabase SQL editor:"
echo "----------------------------------------"
echo "${SQL}"
echo "----------------------------------------"