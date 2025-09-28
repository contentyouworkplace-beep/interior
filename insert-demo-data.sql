-- ==========================================
-- DEMO DATA SEEDING SQL SCRIPT
-- ==========================================
-- Run this directly in Supabase SQL Editor after the schema is set up

-- First, let's get or create your user
-- Your Supabase Auth credentials:
-- Email: rahulmedhe05@gmail.com, Password: password123
-- UUID: 4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6

-- Using your specific UUID and email for demo data
DO $$
DECLARE
    demo_user_id UUID := '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6';
    client1_id UUID;
    client2_id UUID;
    client3_id UUID;
    team1_id UUID;
    team2_id UUID;
    team3_id UUID;
    vendor1_id UUID;
    vendor2_id UUID;
    vendor3_id UUID;
    project1_id UUID;
    project2_id UUID;
    project3_id UUID;
BEGIN
    -- Verify the user exists (should be your account)
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = demo_user_id) THEN
        RAISE NOTICE 'Warning: User with ID % not found in auth.users. Make sure you are logged in with rahulmedhe05@gmail.com', demo_user_id;
        -- Continue anyway to insert demo data
    END IF;
    
    RAISE NOTICE 'Using user ID: %', demo_user_id;

    -- Insert profile for your account
    INSERT INTO profiles (id, first_name, last_name, company_name, phone, role, designation, department)
    VALUES (demo_user_id, 'Rahul', 'Medhe', 'Rahul Interior Design Studio', '+1-555-0123', 'designer', 'Lead Designer', 'Design')
    ON CONFLICT (id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        company_name = EXCLUDED.company_name,
        phone = EXCLUDED.phone;

    -- Insert business settings for your account
    INSERT INTO business_settings (user_id, business_name, business_address, business_phone, business_email, business_website, tax_number, default_currency, gst_rate)
    VALUES (demo_user_id, 'Rahul Interior Design Studio', '123 Design Street, Creative District, Mumbai 400001', '+91-9876543210', 'rahulmedhe05@gmail.com', 'www.rahulinteriors.com', 'TAX123456789', 'INR', 18.0)
    ON CONFLICT (user_id) DO UPDATE SET
        business_name = EXCLUDED.business_name,
        business_address = EXCLUDED.business_address;

    -- Insert clients and get IDs
    INSERT INTO clients (user_id, first_name, last_name, email, phone, company, address, city, state, country, postal_code, client_type, budget_range, preferred_style, notes, status)
    VALUES 
        (demo_user_id, 'Sarah', 'Johnson', 'sarah.johnson@email.com', '+91-9876541001', 'Johnson Enterprises', '456 Luxury Ave, Bandra, Mumbai 400050', 'Mumbai', 'MH', 'India', '400050', 'corporate', '₹75,00,000 - ₹1,50,00,000', 'Modern Contemporary', 'High-end corporate office redesign project.', 'active'),
        (demo_user_id, 'Michael', 'Chen', 'michael.chen@email.com', '+91-9876541002', NULL, '789 Residential Blvd, Andheri, Mumbai 400058', 'Mumbai', 'MH', 'India', '400058', 'individual', '₹35,00,000 - ₹55,00,000', 'Scandinavian', 'Young professional apartment renovation.', 'active'),
        (demo_user_id, 'Emily', 'Rodriguez', 'emily.rodriguez@email.com', '+91-9876541004', NULL, '321 Family Lane, Powai, Mumbai 400076', 'Mumbai', 'MH', 'India', '400076', 'individual', '₹55,00,000 - ₹75,00,000', 'Traditional', 'Family home renovation project.', 'active')
    ON CONFLICT DO NOTHING;

    -- Get client IDs
    SELECT id INTO client1_id FROM clients WHERE email = 'sarah.johnson@email.com' AND user_id = demo_user_id;
    SELECT id INTO client2_id FROM clients WHERE email = 'michael.chen@email.com' AND user_id = demo_user_id;
    SELECT id INTO client3_id FROM clients WHERE email = 'emily.rodriguez@email.com' AND user_id = demo_user_id;

    -- Insert leads
    INSERT INTO leads (user_id, first_name, last_name, email, phone, source, stage, interest_level, potential_value, notes, next_follow_up)
    VALUES 
        (demo_user_id, 'David', 'Williams', 'david.williams@email.com', '+91-9876542001', 'Website Contact Form', 'qualified', 'high', 6200000.00, 'Interested in complete home renovation.', CURRENT_DATE + INTERVAL '7 days'),
        (demo_user_id, 'Lisa', 'Thompson', 'lisa.thompson@email.com', '+91-9876542002', 'Referral', 'contacted', 'medium', 3300000.00, 'Kitchen remodel project.', CURRENT_DATE + INTERVAL '3 days')
    ON CONFLICT DO NOTHING;

    -- Insert team members and get IDs
    INSERT INTO team_members (user_id, name, email, phone, role, specialization, hourly_rate, experience_years, bio, salary, address, city, state, country, status, join_date)
    VALUES 
        (demo_user_id, 'Alex Rivera', 'alex.rivera@rahulinteriors.com', '+91-9876543001', 'Senior Designer', 'Residential Design', 3500.00, 8, 'Specialized in luxury residential projects.', 600000.00, '567 Designer St, Mumbai', 'Mumbai', 'MH', 'India', 'active', '2022-03-15'),
        (demo_user_id, 'Jessica Park', 'jessica.park@rahulinteriors.com', '+91-9876543002', 'Project Manager', 'Project Coordination', 3000.00, 6, 'Expert in project timeline management.', 550000.00, '890 Manager Ave, Mumbai', 'Mumbai', 'MH', 'India', 'active', '2022-06-01'),
        (demo_user_id, 'Carlos Martinez', 'carlos.martinez@rahulinteriors.com', '+91-9876543003', '3D Visualizer', '3D Rendering', 2800.00, 5, 'Creates stunning 3D visualizations.', 500000.00, '234 Artist Blvd, Mumbai', 'Mumbai', 'MH', 'India', 'active', '2023-01-10')
    ON CONFLICT DO NOTHING;

    -- Get team member IDs
    SELECT id INTO team1_id FROM team_members WHERE email = 'alex.rivera@rahulinteriors.com' AND user_id = demo_user_id;
    SELECT id INTO team2_id FROM team_members WHERE email = 'jessica.park@rahulinteriors.com' AND user_id = demo_user_id;
    SELECT id INTO team3_id FROM team_members WHERE email = 'carlos.martinez@rahulinteriors.com' AND user_id = demo_user_id;

    -- Insert vendors and get IDs
    INSERT INTO vendors (user_id, name, contact_person, phone, email, address, category, rating, status, notes)
    VALUES 
        (demo_user_id, 'Premium Furniture Co.', 'Robert Kim', '+1-555-4001', 'sales@premiumfurniture.com', '100 Furniture District, NY 10013', 'Furniture', 4.8, 'active', 'High-quality custom furniture manufacturer.'),
        (demo_user_id, 'Elite Lighting Solutions', 'Maria Gonzalez', '+1-555-4002', 'info@elitelighting.com', '200 Light Ave, NY 10014', 'Lighting', 4.6, 'active', 'Modern lighting fixtures and smart home systems.'),
        (demo_user_id, 'Quality Contractors Inc.', 'James Wilson', '+1-555-4003', 'contracts@qualitycontractors.com', '300 Construction St, NY 10015', 'Construction', 4.7, 'active', 'Reliable construction and remodeling partner.')
    ON CONFLICT DO NOTHING;

    -- Get vendor IDs
    SELECT id INTO vendor1_id FROM vendors WHERE email = 'sales@premiumfurniture.com' AND user_id = demo_user_id;
    SELECT id INTO vendor2_id FROM vendors WHERE email = 'info@elitelighting.com' AND user_id = demo_user_id;
    SELECT id INTO vendor3_id FROM vendors WHERE email = 'contracts@qualitycontractors.com' AND user_id = demo_user_id;

    -- Insert projects and get IDs
    INSERT INTO projects (user_id, client_id, name, description, project_type, status, priority, budget, start_date, end_date, completion_percentage, location, square_footage, style_preference, special_requirements)
    VALUES 
        (demo_user_id, client1_id, 'Johnson Corporate Office Redesign', 'Complete redesign of corporate headquarters including reception, conference rooms, and executive offices.', 'commercial', 'in_progress', 'high', 11000000.00, '2024-01-15', '2024-04-15', 35, '456 Luxury Ave, Bandra, Mumbai 400050', 5000, 'Modern Contemporary', 'Sound-proofing for conference rooms, premium materials only'),
        (demo_user_id, client2_id, 'Chen Apartment Renovation', 'Modern apartment renovation including kitchen, living room, and master bedroom.', 'residential', 'planning', 'medium', 4800000.00, '2024-02-01', '2024-05-01', 15, '789 Residential Blvd, Andheri, Mumbai 400058', 1200, 'Scandinavian', 'Pet-friendly materials, maximized storage solutions'),
        (demo_user_id, client3_id, 'Rodriguez Family Home', 'Traditional family home renovation with focus on entertainment and children areas.', 'residential', 'planning', 'medium', 6200000.00, '2024-03-01', '2024-07-01', 10, '321 Family Lane, Powai, Mumbai 400076', 2200, 'Traditional', 'Child-safe materials, entertainment room setup')
    ON CONFLICT DO NOTHING;

    -- Get project IDs
    SELECT id INTO project1_id FROM projects WHERE name = 'Johnson Corporate Office Redesign' AND user_id = demo_user_id;
    SELECT id INTO project2_id FROM projects WHERE name = 'Chen Apartment Renovation' AND user_id = demo_user_id;
    SELECT id INTO project3_id FROM projects WHERE name = 'Rodriguez Family Home' AND user_id = demo_user_id;

    -- Insert project tasks
    INSERT INTO project_tasks (project_id, name, description, assigned_to, role, status, priority, estimated_hours, actual_hours, start_date, end_date)
    VALUES 
        (project1_id, 'Initial Consultation', 'Meet with client to discuss requirements and vision', team1_id, 'Senior Designer', 'completed', 'high', 2, 2, '2024-01-15', '2024-01-15'),
        (project1_id, 'Space Planning', 'Create detailed floor plans and space layouts', team1_id, 'Senior Designer', 'in_progress', 'high', 8, 4, '2024-01-16', '2024-01-22'),
        (project1_id, '3D Visualization', 'Create 3D renders and virtual walkthroughs', team3_id, '3D Visualizer', 'pending', 'medium', 12, 0, '2024-01-23', '2024-01-30'),
        (project2_id, 'Initial Consultation', 'Meet with client to discuss apartment renovation', team1_id, 'Senior Designer', 'completed', 'medium', 2, 2, '2024-02-01', '2024-02-01'),
        (project2_id, 'Space Assessment', 'Measure and assess current apartment layout', team2_id, 'Project Manager', 'in_progress', 'medium', 4, 2, '2024-02-02', '2024-02-05')
    ON CONFLICT DO NOTHING;

    -- Insert expenses
    INSERT INTO expenses (user_id, project_id, category, amount, description, expense_date, status)
    VALUES 
        (demo_user_id, project1_id, 'Materials', 92000.00, 'Premium fabric samples and wallpaper', CURRENT_DATE - INTERVAL '15 days', 'approved'),
        (demo_user_id, project1_id, 'Transportation', 6200.00, 'Client site visits and material pickup', CURRENT_DATE - INTERVAL '10 days', 'approved'),
        (demo_user_id, project2_id, 'Tools', 23500.00, 'Professional measurement tools', CURRENT_DATE - INTERVAL '5 days', 'pending'),
        (demo_user_id, NULL, 'Office Supplies', 11000.00, 'Presentation materials and printing', CURRENT_DATE - INTERVAL '2 days', 'pending'),
        (demo_user_id, NULL, 'Software', 22000.00, 'Design software subscription', CURRENT_DATE, 'approved')
    ON CONFLICT DO NOTHING;

    -- Insert notifications
    INSERT INTO notifications (user_id, title, message, type, is_read)
    VALUES 
        (demo_user_id, 'Welcome to Your CRM!', 'Your Interior Designer CRM is now set up with demo data. Explore all the features!', 'success', false),
        (demo_user_id, 'New Lead Added', 'David Williams showed interest in home renovation', 'info', false),
        (demo_user_id, 'Expense Approval Needed', 'Software subscription expense needs approval', 'warning', false),
        (demo_user_id, 'Project Update', 'Demo projects have been created and are ready for management', 'info', true),
        (demo_user_id, 'System Ready', 'All demo data has been loaded successfully', 'success', true)
    ON CONFLICT DO NOTHING;

    -- Insert appointments
    INSERT INTO appointments (user_id, client_id, project_id, title, description, start_time, end_time, event_type, location)
    VALUES 
        (demo_user_id, client1_id, project1_id, 'Client Consultation - Johnson Office', 'Initial consultation for corporate office redesign', CURRENT_TIMESTAMP + INTERVAL '2 days', CURRENT_TIMESTAMP + INTERVAL '2 days 2 hours', 'consultation', '456 Luxury Ave, Bandra, Mumbai'),
        (demo_user_id, client2_id, project2_id, 'Site Visit - Chen Apartment', 'Site measurement and assessment', CURRENT_TIMESTAMP + INTERVAL '5 days', CURRENT_TIMESTAMP + INTERVAL '5 days 3 hours', 'site_visit', '789 Residential Blvd, Andheri, Mumbai')
    ON CONFLICT DO NOTHING;

    -- Insert activity log entries
    INSERT INTO activity_log (user_id, entity_type, entity_id, action, meta)
    VALUES 
        (demo_user_id, 'project', project1_id::text, 'created', '{"project_name": "Johnson Corporate Office Redesign"}'),
        (demo_user_id, 'client', client1_id::text, 'created', '{"client_name": "Sarah Johnson"}'),
        (demo_user_id, 'task', 'demo-task', 'completed', '{"task_name": "Initial Consultation"}'),
        (demo_user_id, 'expense', 'demo-expense', 'approved', '{"amount": "$1,250"}'),
        (demo_user_id, 'lead', 'demo-lead', 'created', '{"lead_name": "David Williams"}')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Demo data inserted successfully for Rahul Medhe!';
    RAISE NOTICE 'Login with: rahulmedhe05@gmail.com / password123';
    RAISE NOTICE 'Your UUID: 4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6';
    
END $$;