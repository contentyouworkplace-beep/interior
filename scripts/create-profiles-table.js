const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables')
    console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createProfilesTable() {
    try {
        console.log('🚀 Creating profiles table...')
        
        const { error } = await supabase.rpc('exec_sql', {
            sql: `
                -- Create profiles table if it doesn't exist
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

                -- Enable RLS on profiles table
                ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

                -- Create policy to allow users to read and update their own profile
                DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
                CREATE POLICY "Users can view own profile" ON profiles
                    FOR SELECT USING (auth.uid() = id);

                DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
                CREATE POLICY "Users can update own profile" ON profiles
                    FOR UPDATE USING (auth.uid() = id);

                DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
                CREATE POLICY "Users can insert own profile" ON profiles
                    FOR INSERT WITH CHECK (auth.uid() = id);

                -- Create function to handle profile creation on signup
                CREATE OR REPLACE FUNCTION public.handle_new_user()
                RETURNS trigger AS $$
                BEGIN
                    INSERT INTO public.profiles (id, first_name, last_name, role)
                    VALUES (new.id, '', '', 'designer');
                    RETURN new;
                END;
                $$ LANGUAGE plpgsql SECURITY DEFINER;

                -- Create trigger to automatically create profile when user signs up
                DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
                CREATE TRIGGER on_auth_user_created
                    AFTER INSERT ON auth.users
                    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
            `
        })
        
        if (error) {
            console.error('❌ Error creating profiles table:', error)
            throw error
        }
        
        console.log('✅ Profiles table created successfully!')
        console.log('✅ RLS policies enabled!')
        console.log('✅ Auto-profile creation trigger set up!')
        
    } catch (error) {
        console.error('❌ Setup failed:', error)
        
        console.log('\n📝 If you see permission errors, please run this SQL manually in Supabase:')
        console.log('\n-- Profiles table creation SQL:')
        console.log(`
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

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name, role)
    VALUES (new.id, '', '', 'designer');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
        `)
    }
}

createProfilesTable()