-- SAMPLE DATA FOR TESTING
-- Execute this AFTER schema and RLS policies (optional)

-- Using UUID: 4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6

-- Sample profile
INSERT INTO profiles (id, first_name, last_name, company_name, phone, role) VALUES
('4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6', 'Rahul', 'Medhe', 'Medhe Interiors', '+91-9876543210', 'designer')
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  company_name = EXCLUDED.company_name,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role;

-- Sample clients
INSERT INTO clients (user_id, first_name, last_name, email, phone, company, address, city, state, client_type, budget_range) VALUES
('4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6', 'Priya', 'Sharma', 'priya.sharma@email.com', '+91-9123456789', 'Sharma Enterprises', '123 MG Road', 'Mumbai', 'Maharashtra', 'individual', '10-15 Lakhs'),
('4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6', 'Arjun', 'Patel', 'arjun.patel@email.com', '+91-9876543210', 'Patel Industries', '456 Commercial Street', 'Bangalore', 'Karnataka', 'commercial', '25-50 Lakhs'),
('4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6', 'Sneha', 'Gupta', 'sneha.gupta@email.com', '+91-9555666777', '', '789 Park Avenue', 'Delhi', 'Delhi', 'individual', '5-10 Lakhs');

-- Sample projects
INSERT INTO projects (user_id, client_id, name, description, project_type, status, budget, start_date, end_date) VALUES
('4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6', (SELECT id FROM clients WHERE email = 'priya.sharma@email.com'), 'Modern Living Room Redesign', 'Complete makeover of living room with modern furniture and lighting', 'residential', 'in_progress', 1200000.00, '2024-01-15', '2024-03-15'),
('4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6', (SELECT id FROM clients WHERE email = 'arjun.patel@email.com'), 'Office Space Design', 'Contemporary office design for 50 employees', 'commercial', 'planning', 3500000.00, '2024-02-01', '2024-05-01'),
('4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6', (SELECT id FROM clients WHERE email = 'sneha.gupta@email.com'), 'Bedroom Interior', 'Master bedroom interior design with wardrobe', 'residential', 'completed', 750000.00, '2023-11-01', '2023-12-31');

-- Sample team members
INSERT INTO team_members (user_id, name, email, phone, role, specialization, hourly_rate) VALUES
('4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6', 'Vikram Singh', 'vikram@email.com', '+91-9111222333', 'Senior Designer', 'Residential Design', 2500.00),
('4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6', 'Maya Reddy', 'maya@email.com', '+91-9444555666', 'Project Manager', 'Commercial Projects', 2000.00),
('4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6', 'Rajesh Kumar', 'rajesh@email.com', '+91-9777888999', 'Contractor', 'Execution', 1500.00);

-- Sample expenses
INSERT INTO expenses (user_id, project_id, category, amount, description, expense_date) VALUES
('4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6', (SELECT id FROM projects WHERE name = 'Modern Living Room Redesign'), 'Materials', 25000.00, 'Paint and primer for walls', '2024-01-20'),
('4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6', (SELECT id FROM projects WHERE name = 'Modern Living Room Redesign'), 'Furniture', 150000.00, 'Sofa set and coffee table', '2024-02-01'),
('4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6', (SELECT id FROM projects WHERE name = 'Office Space Design'), 'Planning', 5000.00, 'Site survey and measurements', '2024-02-05');

-- Sample leads
INSERT INTO leads (user_id, first_name, last_name, email, phone, source, stage, potential_value, notes) VALUES
('4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6', 'Amit', 'Jain', 'amit.jain@email.com', '+91-9666777888', 'Website', 'qualified', 800000.00, 'Interested in kitchen renovation'),
('4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6', 'Kavya', 'Nair', 'kavya.nair@email.com', '+91-9333444555', 'Referral', 'proposal', 1500000.00, 'Whole house interior design'),
('4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6', 'Rohit', 'Agarwal', 'rohit.agarwal@email.com', '+91-9888999000', 'Social Media', 'new', 600000.00, 'Small apartment design');

-- All data is now ready with your UUID: 4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6