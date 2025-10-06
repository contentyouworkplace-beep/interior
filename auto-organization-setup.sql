-- Auto Organization Creation System
-- This script creates a system that automatically creates a default organization 
-- and adds users to it when they sign up.

-- Step 1: Update the handle_new_user function to create organization and membership
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    new_org_id uuid;
    default_org_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- Create user profile first
    INSERT INTO public.profiles (id, first_name, last_name, role)
    VALUES (new.id, '', '', 'designer');
    
    -- Check if default organization exists, create if not
    INSERT INTO public.organizations (id, name, description)
    VALUES (default_org_id, 'Default Organization', 'Auto-created default organization')
    ON CONFLICT (id) DO NOTHING;
    
    -- Add user to the default organization as admin (first user) or member
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (
        default_org_id, 
        new.id, 
        CASE 
            WHEN (SELECT COUNT(*) FROM public.organization_members WHERE organization_id = default_org_id) = 0 
            THEN 'admin' 
            ELSE 'member' 
        END
    )
    ON CONFLICT (organization_id, user_id) DO NOTHING;
    
    -- Create basic company profile with defaults
    INSERT INTO public.company_profiles (
        organization_id, 
        company_name,
        company_tagline,
        email,
        phone
    )
    VALUES (
        default_org_id,
        'Your Company',
        'Professional Interior Design Services',
        new.email,
        ''
    )
    ON CONFLICT (organization_id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
    
    -- Create basic banking info
    INSERT INTO public.banking_info (organization_id)
    VALUES (default_org_id)
    ON CONFLICT (organization_id) DO NOTHING;
    
    -- Create basic branding settings
    INSERT INTO public.branding (
        organization_id,
        primary_color,
        secondary_color,
        quotation_template,
        invoice_template
    )
    VALUES (
        default_org_id,
        '#3B82F6',
        '#1E40AF',
        'modern',
        'modern'
    )
    ON CONFLICT (organization_id) DO NOTHING;
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Recreate the trigger to ensure it's active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Create a function to fix existing users without organization membership
CREATE OR REPLACE FUNCTION public.fix_existing_users()
RETURNS text AS $$
DECLARE
    user_record record;
    default_org_id uuid := '00000000-0000-0000-0000-000000000001';
    user_count integer := 0;
BEGIN
    -- Ensure default organization exists
    INSERT INTO public.organizations (id, name, description)
    VALUES (default_org_id, 'Default Organization', 'Auto-created default organization')
    ON CONFLICT (id) DO NOTHING;
    
    -- Loop through users who don't have organization membership
    FOR user_record IN 
        SELECT u.id, u.email 
        FROM auth.users u 
        LEFT JOIN public.organization_members om ON u.id = om.user_id 
        WHERE om.user_id IS NULL
    LOOP
        -- Add user to default organization
        INSERT INTO public.organization_members (organization_id, user_id, role)
        VALUES (
            default_org_id, 
            user_record.id, 
            CASE 
                WHEN user_count = 0 THEN 'admin' 
                ELSE 'member' 
            END
        )
        ON CONFLICT (organization_id, user_id) DO NOTHING;
        
        -- Create/update company profile
        INSERT INTO public.company_profiles (
            organization_id, 
            company_name,
            company_tagline,
            email
        )
        VALUES (
            default_org_id,
            'Your Company',
            'Professional Interior Design Services',
            user_record.email
        )
        ON CONFLICT (organization_id) DO UPDATE SET
            email = EXCLUDED.email,
            updated_at = NOW();
        
        -- Create basic banking info if not exists
        INSERT INTO public.banking_info (organization_id)
        VALUES (default_org_id)
        ON CONFLICT (organization_id) DO NOTHING;
        
        -- Create basic branding if not exists
        INSERT INTO public.branding (
            organization_id,
            primary_color,
            secondary_color,
            quotation_template,
            invoice_template
        )
        VALUES (
            default_org_id,
            '#3B82F6',
            '#1E40AF',
            'modern',
            'modern'
        )
        ON CONFLICT (organization_id) DO NOTHING;
        
        user_count := user_count + 1;
    END LOOP;
    
    RETURN 'Fixed ' || user_count || ' existing users without organization membership';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Run the fix for existing users
SELECT public.fix_existing_users();

-- Step 5: Verify the setup
SELECT 
    'Setup Verification' as status,
    (SELECT COUNT(*) FROM public.organizations) as organizations_count,
    (SELECT COUNT(*) FROM public.organization_members) as memberships_count,
    (SELECT COUNT(*) FROM public.company_profiles) as company_profiles_count,
    (SELECT COUNT(*) FROM auth.users) as total_users;