export interface ProjectTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  project_type: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectTask {
  id: string;
  project_id: string;
  template_id: string | null;
  name: string;
  description: string | null;
  assigned_to: string | null;
  role: string | null;
  start_date: string | null;
  due_date: string | null;
  estimated_hours: number | null;
  actual_hours: number;
  is_milestone: boolean;
  weight: number;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  completion_percentage: number;
  dependencies: string[];
  created_at: string;
  updated_at: string;
}

export interface TaskTimeLog {
  id: string;
  task_id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  hours_logged: number | null;
  description: string | null;
  created_at: string;
}

// Extend Database interface
import { Database as DB } from './database';

export type Tables = DB['public']['Tables'] & {
  project_templates: {
    Row: ProjectTemplate;
    Insert: Omit<ProjectTemplate, 'id' | 'created_at' | 'updated_at'> & {
      id?: string;
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<Omit<ProjectTemplate, 'id'>> & { id?: string };
  };
  project_tasks: {
    Row: ProjectTask;
    Insert: Omit<ProjectTask, 'id' | 'actual_hours' | 'created_at' | 'updated_at'> & {
      id?: string;
      actual_hours?: number;
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<Omit<ProjectTask, 'id'>> & { id?: string };
  };
  task_time_logs: {
    Row: TaskTimeLog;
    Insert: Omit<TaskTimeLog, 'id' | 'created_at'> & {
      id?: string;
      created_at?: string;
    };
    Update: Partial<Omit<TaskTimeLog, 'id'>> & { id?: string };
  };
};