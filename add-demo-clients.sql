-- ==========================================
-- ADD DEMO CLIENTS FOR TESTING
-- ==========================================
-- Execute this in your Supabase SQL Editor after running the RLS fix

-- Insert demo clients for user ID: 4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6
INSERT INTO clients (
  user_id,
  first_name,
  last_name,
  email,
  phone,
  alt_phone,
  company,
  address,
  city,
  notes,
  status
) VALUES 
(
  '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6',
  'Rajesh',
  'Sharma',
  'rajesh.sharma@email.com',
  '+91 98765 43210',
  '+91 87654 32109',
  'Sharma Enterprises',
  '123 MG Road, Bandra West',
  'Mumbai',
  'High-end residential project. Prefers modern contemporary style.',
  'active'
),
(
  '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6',
  'Priya',
  'Patel',
  'priya.patel@gmail.com',
  '+91 99887 76543',
  '+91 88776 65432',
  '',
  '456 Residency Road, Koramangala',
  'Bangalore',
  'New apartment interior design. Budget-conscious client.',
  'active'
),
(
  '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6',
  'Amit',
  'Gupta',
  'amit.gupta@company.com',
  '+91 97531 86420',
  '+91 86420 97531',
  'Tech Solutions Pvt Ltd',
  '789 Cyber City, Sector 25',
  'Gurgaon',
  'Office space redesign. Corporate client with quick turnaround needs.',
  'active'
),
(
  '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6',
  'Sneha',
  'Reddy',
  'sneha.reddy@hotmail.com',
  '+91 95432 18765',
  '+91 84321 76549',
  'Reddy Constructions',
  '321 Jubilee Hills, Road No 36',
  'Hyderabad',
  'Luxury villa project. Interested in traditional with modern touches.',
  'active'
),
(
  '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6',
  'Vikram',
  'Singh',
  'vikram.singh@yahoo.com',
  '+91 94567 23891',
  '+91 83456 78912',
  '',
  '654 Civil Lines, Near Mall Road',
  'Delhi',
  'First-time homeowner. Looking for cost-effective solutions.',
  'active'
);

-- Verify the demo clients were added
SELECT 
  id,
  first_name,
  last_name,
  email,
  phone,
  company,
  city,
  created_at
FROM clients 
WHERE user_id = '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6'
ORDER BY created_at DESC;