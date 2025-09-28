-- Demo Data Seeding Script for Interior Designer CRM
-- Run this in Supabase SQL Editor

-- Create a demo user directly in auth.users (this is usually done by Supabase auth)
-- For demo purposes, we'll temporarily disable foreign key constraints
SET session_replication_role = replica;

-- Insert demo user into auth.users
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  'demo@interiordesign.com',
  '$2a$10$placeholder_encrypted_password_hash',
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Demo", "last_name": "User"}',
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Create demo profile
INSERT INTO profiles (
  id,
  first_name,
  last_name,
  company_name,
  phone,
  role,
  designation,
  department,
  created_at,
  updated_at
) VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  'Demo',
  'User',
  'Interior Design Studio',
  '+91-9999999999',
  'designer',
  'Lead Designer',
  'Design',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  company_name = EXCLUDED.company_name,
  phone = EXCLUDED.phone,
  updated_at = NOW();

-- Insert demo clients
INSERT INTO clients (
  user_id,
  first_name,
  last_name,
  email,
  phone,
  company,
  address,
  city,
  country,
  budget_range,
  status,
  created_at
) VALUES
  ('123e4567-e89b-12d3-a456-426614174000', 'Raj', 'Mehta', 'raj@tajpalace.com', '+91-9876543210', 'Taj Palace Mumbai', '1 Apollo Bunder, Colaba', 'Mumbai', 'India', '5000000-10000000', 'active', NOW()),
  ('123e4567-e89b-12d3-a456-426614174000', 'Priya', 'Sharma', 'priya@marinedrive.com', '+91-9876543211', 'Marine Drive Residency', 'Marine Drive', 'Mumbai', 'India', '2000000-5000000', 'active', NOW()),
  ('123e4567-e89b-12d3-a456-426614174000', 'Arjun', 'Singh', 'arjun@dlfcyberpark.com', '+91-9876543212', 'DLF Cyber Park', 'DLF Cyber City, Sector 25', 'Gurugram', 'India', '3000000-7000000', 'active', NOW()),
  ('123e4567-e89b-12d3-a456-426614174000', 'Sneha', 'Reddy', 'sneha@hitech.com', '+91-9876543213', 'Hitech City Apartments', 'Hitech City', 'Hyderabad', 'India', '1500000-4000000', 'active', NOW()),
  ('123e4567-e89b-12d3-a456-426614174000', 'Vikram', 'Patel', 'vikram@whitefield.com', '+91-9876543214', 'Whitefield Villas', 'Whitefield', 'Bangalore', 'India', '4000000-8000000', 'active', NOW());

-- Insert demo projects (we'll get the client IDs from the inserted clients)
WITH demo_clients AS (
  SELECT id, first_name, last_name FROM clients WHERE user_id = '123e4567-e89b-12d3-a456-426614174000'
)
INSERT INTO projects (
  user_id,
  client_id,
  name,
  description,
  project_type,
  status,
  priority,
  start_date,
  end_date,
  budget,
  created_at
)
SELECT 
  '123e4567-e89b-12d3-a456-426614174000',
  c.id,
  CASE 
    WHEN c.first_name = 'Raj' THEN 'Taj Palace Presidential Suite Renovation'
    WHEN c.first_name = 'Priya' THEN 'Marine Drive Luxury Apartment'
    WHEN c.first_name = 'Arjun' THEN 'DLF Executive Office Design'
    WHEN c.first_name = 'Sneha' THEN 'Hitech City Modern Home'
    WHEN c.first_name = 'Vikram' THEN 'Whitefield Villa Complete Interior'
  END,
  CASE 
    WHEN c.first_name = 'Raj' THEN 'Complete renovation of presidential suite with luxury finishes and modern amenities'
    WHEN c.first_name = 'Priya' THEN 'Contemporary apartment design with ocean view optimization'
    WHEN c.first_name = 'Arjun' THEN 'Corporate office space with modern ergonomic design'
    WHEN c.first_name = 'Sneha' THEN 'Modern home interior with smart home integration'
    WHEN c.first_name = 'Vikram' THEN 'Complete villa interior design with traditional and modern elements'
  END,
  CASE 
    WHEN c.first_name = 'Raj' THEN 'commercial'
    WHEN c.first_name = 'Priya' THEN 'residential'
    WHEN c.first_name = 'Arjun' THEN 'commercial'
    WHEN c.first_name = 'Sneha' THEN 'residential'
    WHEN c.first_name = 'Vikram' THEN 'residential'
  END,
  CASE 
    WHEN c.first_name = 'Raj' THEN 'in_progress'
    WHEN c.first_name = 'Priya' THEN 'completed'
    WHEN c.first_name = 'Arjun' THEN 'in_progress'
    WHEN c.first_name = 'Sneha' THEN 'planning'
    WHEN c.first_name = 'Vikram' THEN 'in_progress'
  END,
  'high',
  CASE 
    WHEN c.first_name = 'Raj' THEN '2024-01-15'
    WHEN c.first_name = 'Priya' THEN '2023-12-01'
    WHEN c.first_name = 'Arjun' THEN '2024-02-01'
    WHEN c.first_name = 'Sneha' THEN '2024-03-01'
    WHEN c.first_name = 'Vikram' THEN '2024-01-20'
  END,
  CASE 
    WHEN c.first_name = 'Raj' THEN '2024-06-15'
    WHEN c.first_name = 'Priya' THEN '2024-03-01'
    WHEN c.first_name = 'Arjun' THEN '2024-05-01'
    WHEN c.first_name = 'Sneha' THEN '2024-08-01'
    WHEN c.first_name = 'Vikram' THEN '2024-07-20'
  END,
  CASE 
    WHEN c.first_name = 'Raj' THEN 8500000
    WHEN c.first_name = 'Priya' THEN 3500000
    WHEN c.first_name = 'Arjun' THEN 5500000
    WHEN c.first_name = 'Sneha' THEN 2800000
    WHEN c.first_name = 'Vikram' THEN 6200000
  END,
  NOW()
FROM demo_clients c;

-- Insert demo quotations
WITH demo_data AS (
  SELECT 
    c.id as client_id,
    p.id as project_id,
    c.first_name
  FROM clients c
  JOIN projects p ON c.id = p.client_id
  WHERE c.user_id = '123e4567-e89b-12d3-a456-426614174000'
)
INSERT INTO quotations (
  user_id,
  client_id,
  project_id,
  quotation_number,
  title,
  description,
  items,
  subtotal,
  tax_amount,
  discount_amount,
  total_amount,
  terms_conditions,
  valid_until,
  status,
  created_at
)
SELECT 
  '123e4567-e89b-12d3-a456-426614174000',
  d.client_id,
  d.project_id,
  CASE 
    WHEN d.first_name = 'Raj' THEN 'QUO-2024-001'
    WHEN d.first_name = 'Priya' THEN 'QUO-2024-002'
    WHEN d.first_name = 'Arjun' THEN 'QUO-2024-003'
    WHEN d.first_name = 'Sneha' THEN 'QUO-2024-004'
    WHEN d.first_name = 'Vikram' THEN 'QUO-2024-005'
  END,
  CASE 
    WHEN d.first_name = 'Raj' THEN 'Presidential Suite Interior Design'
    WHEN d.first_name = 'Priya' THEN 'Luxury Apartment Makeover'
    WHEN d.first_name = 'Arjun' THEN 'Corporate Office Design'
    WHEN d.first_name = 'Sneha' THEN 'Modern Home Interior'
    WHEN d.first_name = 'Vikram' THEN 'Villa Complete Interior'
  END,
  CASE 
    WHEN d.first_name = 'Raj' THEN 'Complete interior design and renovation for presidential suite'
    WHEN d.first_name = 'Priya' THEN 'Contemporary design with luxury finishes'
    WHEN d.first_name = 'Arjun' THEN 'Modern corporate office space design'
    WHEN d.first_name = 'Sneha' THEN 'Smart home integrated modern interior'
    WHEN d.first_name = 'Vikram' THEN 'Traditional meets modern villa design'
  END,
  CASE 
    WHEN d.first_name = 'Raj' THEN '[{"name": "Luxury Furniture Package", "quantity": 1, "rate": 2500000, "amount": 2500000}, {"name": "Premium Lighting Setup", "quantity": 1, "rate": 800000, "amount": 800000}, {"name": "Custom Woodwork", "quantity": 1, "rate": 1500000, "amount": 1500000}]'::jsonb
    WHEN d.first_name = 'Priya' THEN '[{"name": "Contemporary Furniture", "quantity": 1, "rate": 1200000, "amount": 1200000}, {"name": "Designer Lighting", "quantity": 1, "rate": 400000, "amount": 400000}, {"name": "Wall Treatments", "quantity": 1, "rate": 600000, "amount": 600000}]'::jsonb
    WHEN d.first_name = 'Arjun' THEN '[{"name": "Office Furniture Setup", "quantity": 1, "rate": 1800000, "amount": 1800000}, {"name": "Technology Integration", "quantity": 1, "rate": 700000, "amount": 700000}, {"name": "Acoustic Solutions", "quantity": 1, "rate": 500000, "amount": 500000}]'::jsonb
    WHEN d.first_name = 'Sneha' THEN '[{"name": "Smart Home Package", "quantity": 1, "rate": 900000, "amount": 900000}, {"name": "Modern Furniture", "quantity": 1, "rate": 700000, "amount": 700000}, {"name": "Interior Styling", "quantity": 1, "rate": 400000, "amount": 400000}]'::jsonb
    WHEN d.first_name = 'Vikram' THEN '[{"name": "Premium Villa Package", "quantity": 1, "rate": 2200000, "amount": 2200000}, {"name": "Landscape Integration", "quantity": 1, "rate": 800000, "amount": 800000}, {"name": "Art & Decor", "quantity": 1, "rate": 600000, "amount": 600000}]'::jsonb
  END,
  CASE 
    WHEN d.first_name = 'Raj' THEN 4800000
    WHEN d.first_name = 'Priya' THEN 2200000
    WHEN d.first_name = 'Arjun' THEN 3000000
    WHEN d.first_name = 'Sneha' THEN 2000000
    WHEN d.first_name = 'Vikram' THEN 3600000
  END,
  CASE 
    WHEN d.first_name = 'Raj' THEN 864000
    WHEN d.first_name = 'Priya' THEN 396000
    WHEN d.first_name = 'Arjun' THEN 540000
    WHEN d.first_name = 'Sneha' THEN 360000
    WHEN d.first_name = 'Vikram' THEN 648000
  END,
  CASE 
    WHEN d.first_name = 'Raj' THEN 100000
    WHEN d.first_name = 'Priya' THEN 50000
    WHEN d.first_name = 'Arjun' THEN 75000
    WHEN d.first_name = 'Sneha' THEN 40000
    WHEN d.first_name = 'Vikram' THEN 80000
  END,
  CASE 
    WHEN d.first_name = 'Raj' THEN 5564000
    WHEN d.first_name = 'Priya' THEN 2546000
    WHEN d.first_name = 'Arjun' THEN 3465000
    WHEN d.first_name = 'Sneha' THEN 2320000
    WHEN d.first_name = 'Vikram' THEN 4168000
  END,
  'All materials and labor included. 50% advance payment required. Project completion within specified timeline. Quality assurance guarantee for 2 years.',
  (CURRENT_DATE + INTERVAL '30 days'),
  CASE 
    WHEN d.first_name = 'Raj' THEN 'sent'
    WHEN d.first_name = 'Priya' THEN 'accepted'
    WHEN d.first_name = 'Arjun' THEN 'sent'
    WHEN d.first_name = 'Sneha' THEN 'draft'
    WHEN d.first_name = 'Vikram' THEN 'sent'
  END,
  NOW()
FROM demo_data d;

-- Insert demo invoices
WITH demo_data AS (
  SELECT 
    c.id as client_id,
    p.id as project_id,
    c.first_name
  FROM clients c
  JOIN projects p ON c.id = p.client_id
  WHERE c.user_id = '123e4567-e89b-12d3-a456-426614174000'
)
INSERT INTO invoices (
  user_id,
  client_id,
  project_id,
  invoice_number,
  title,
  description,
  items,
  subtotal,
  tax_amount,
  discount_amount,
  total_amount,
  terms_conditions,
  due_date,
  status,
  created_at
)
SELECT 
  '123e4567-e89b-12d3-a456-426614174000',
  d.client_id,
  d.project_id,
  CASE 
    WHEN d.first_name = 'Raj' THEN 'INV-2024-001'
    WHEN d.first_name = 'Priya' THEN 'INV-2024-002'
    WHEN d.first_name = 'Arjun' THEN 'INV-2024-003'
  END,
  CASE 
    WHEN d.first_name = 'Raj' THEN 'Presidential Suite - Phase 1'
    WHEN d.first_name = 'Priya' THEN 'Apartment Design - Final Payment'
    WHEN d.first_name = 'Arjun' THEN 'Office Design - Advance Payment'
  END,
  CASE 
    WHEN d.first_name = 'Raj' THEN 'First phase payment for presidential suite renovation'
    WHEN d.first_name = 'Priya' THEN 'Final payment for completed apartment project'
    WHEN d.first_name = 'Arjun' THEN 'Advance payment for office design project'
  END,
  CASE 
    WHEN d.first_name = 'Raj' THEN '[{"name": "Design Phase 1", "quantity": 1, "rate": 2000000, "amount": 2000000}]'::jsonb
    WHEN d.first_name = 'Priya' THEN '[{"name": "Final Implementation", "quantity": 1, "rate": 1273000, "amount": 1273000}]'::jsonb
    WHEN d.first_name = 'Arjun' THEN '[{"name": "Advance Payment (50%)", "quantity": 1, "rate": 1732500, "amount": 1732500}]'::jsonb
  END,
  CASE 
    WHEN d.first_name = 'Raj' THEN 2000000
    WHEN d.first_name = 'Priya' THEN 1273000
    WHEN d.first_name = 'Arjun' THEN 1732500
  END,
  CASE 
    WHEN d.first_name = 'Raj' THEN 360000
    WHEN d.first_name = 'Priya' THEN 229140
    WHEN d.first_name = 'Arjun' THEN 311850
  END,
  0,
  CASE 
    WHEN d.first_name = 'Raj' THEN 2360000
    WHEN d.first_name = 'Priya' THEN 1502140
    WHEN d.first_name = 'Arjun' THEN 2044350
  END,
  'Payment due within 30 days. Late payment charges may apply. All amounts in INR.',
  (CURRENT_DATE + INTERVAL '30 days'),
  CASE 
    WHEN d.first_name = 'Raj' THEN 'pending'
    WHEN d.first_name = 'Priya' THEN 'paid'
    WHEN d.first_name = 'Arjun' THEN 'pending'
  END,
  NOW()
FROM demo_data d
WHERE d.first_name IN ('Raj', 'Priya', 'Arjun');

-- Re-enable foreign key constraints
SET session_replication_role = DEFAULT;

-- Display summary
SELECT 
  'Demo data seeding completed!' as message,
  (SELECT COUNT(*) FROM clients WHERE user_id = '123e4567-e89b-12d3-a456-426614174000') as clients_created,
  (SELECT COUNT(*) FROM projects WHERE user_id = '123e4567-e89b-12d3-a456-426614174000') as projects_created,
  (SELECT COUNT(*) FROM quotations WHERE user_id = '123e4567-e89b-12d3-a456-426614174000') as quotations_created,
  (SELECT COUNT(*) FROM invoices WHERE user_id = '123e4567-e89b-12d3-a456-426614174000') as invoices_created;