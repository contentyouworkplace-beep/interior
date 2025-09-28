-- Profiles table creation for GoPLNR.com
-- Copy and paste this into Supabase SQL Editor

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    company_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'designer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create policies for user access
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create function to handle new user profile creation (if it doesn't exist)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name, role)
    VALUES (new.id, '', '', 'designer');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-profile creation on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Insert initial profile for existing users (if any)
-- This will create profiles for users who signed up before the trigger was created
INSERT INTO profiles (id, first_name, last_name, role)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'first_name', ''),
    COALESCE(raw_user_meta_data->>'last_name', ''),
    'designer'
FROM auth.users 
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;