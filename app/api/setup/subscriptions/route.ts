import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Create subscriptions table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        plan_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
      
      ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON subscriptions;
      CREATE POLICY "Service role can manage all subscriptions" ON subscriptions
        FOR ALL USING (true);
      
      CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);
    `
    
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL })
    
    if (error) {
      console.error('Error creating table:', error)
      return NextResponse.json({ 
        error: 'Failed to create table', 
        details: error.message 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      message: 'Subscriptions table created successfully' 
    })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
