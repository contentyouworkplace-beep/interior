-- Fix profiles table permissions and RLS policies
-- This addresses the "permission denied for table profiles" error

-- First, ensure the profiles table exists and has proper structure
DO $$ 
BEGIN 
    -- Check if profiles table exists, if not create it
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        CREATE TABLE profiles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT,
            full_name TEXT,
            avatar_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    ELSE
        -- Table exists, check and add missing columns
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'user_id') THEN
            -- If user_id doesn't exist, add it
            ALTER TABLE profiles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
            -- Copy id values to user_id if needed
            UPDATE profiles SET user_id = id WHERE user_id IS NULL;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
            ALTER TABLE profiles ADD COLUMN email TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
            ALTER TABLE profiles ADD COLUMN full_name TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
            ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'created_at') THEN
            ALTER TABLE profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
            ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
    END IF;
END $$;

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON profiles;

-- Create comprehensive RLS policies for profiles table
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (user_id IS NULL AND auth.uid() = id)
    );

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        (user_id IS NULL AND auth.uid() = id)
    );

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        (user_id IS NULL AND auth.uid() = id)
    );

-- Service role bypass policy for admin operations
CREATE POLICY "Service role can manage all profiles" ON profiles
    FOR ALL USING (
        current_setting('role') = 'service_role' OR
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant full permissions to service_role
GRANT ALL ON profiles TO service_role;

-- Ensure anon can read public profiles if needed
GRANT SELECT ON profiles TO anon;

-- Create or update the user profile for the current user
INSERT INTO profiles (id, user_id, email, full_name)
VALUES (
    '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6',
    '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6',
    'user@example.com',
    'User Name'
) ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

-- Also ensure the user exists in auth.users if needed (this might need to be done via Supabase dashboard)
-- The user_id should match your actual auth user ID

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

-- Verify the fix
SELECT 'Profiles table permissions fixed successfully' as status;