-- Seed data for demo purposes

-- Insert demo profiles
INSERT INTO profiles (id, first_name, last_name, company_name, phone, role, designation, department, permissions)
VALUES
  ('d7bed82f-3f74-4779-9289-a4ead1fe29af', 'John', 'Doe', 'Interior Elite', '+971501234567', 'admin', 'Senior Designer', 'design', '[{"id":"client.view","isGranted":true},{"id":"client.create","isGranted":true},{"id":"project.view","isGranted":true}]'),
  ('e9b6c8a2-4567-4890-b345-6789f0123456', 'Sarah', 'Smith', 'Interior Elite', '+971502345678', 'designer', 'Interior Designer', 'design', '[{"id":"client.view","isGranted":true},{"id":"project.view","isGranted":true}]')
ON CONFLICT (id) DO NOTHING;

-- Insert demo clients
INSERT INTO clients (id, user_id, first_name, last_name, email, phone, company, address, city, client_type, budget_range, preferred_style)
VALUES
  ('f1234567-89ab-cdef-0123-456789abcdef', 'd7bed82f-3f74-4779-9289-a4ead1fe29af', 'Mohammed', 'Al-Hassan', 'mohammed@example.com', '+971503456789', 'Al-Hassan Properties', 'Downtown Dubai', 'Dubai', 'business', '500,000 - 1,000,000 AED', 'Modern'),
  ('a9876543-21fe-dcba-4321-fedcba987654', 'd7bed82f-3f74-4779-9289-a4ead1fe29af', 'Fatima', 'Al-Sayed', 'fatima@example.com', '+971504567890', NULL, 'Palm Jumeirah', 'Dubai', 'individual', '250,000 - 500,000 AED', 'Contemporary')
ON CONFLICT (id) DO NOTHING;

-- Insert demo projects
INSERT INTO projects (id, user_id, client_id, name, description, project_type, status, priority, budget, start_date, end_date)
VALUES
  ('b2345678-90cd-efab-5678-901234567890', 'd7bed82f-3f74-4779-9289-a4ead1fe29af', 'f1234567-89ab-cdef-0123-456789abcdef', 'Downtown Office Redesign', 'Modern office space redesign for Al-Hassan Properties', 'commercial', 'in_progress', 'high', 750000, '2025-09-01', '2025-12-31'),
  ('c3456789-01de-fcba-6789-012345678901', 'd7bed82f-3f74-4779-9289-a4ead1fe29af', 'a9876543-21fe-dcba-4321-fedcba987654', 'Palm Villa Interior', 'Luxury villa interior design project', 'residential', 'planning', 'medium', 350000, '2025-10-01', '2026-02-28')
ON CONFLICT (id) DO NOTHING;

-- Insert demo expenses
INSERT INTO expenses (id, user_id, project_id, date, amount, type, category, payment_method, status, vendor, description)
VALUES
  ('d4567890-12ef-abcd-7890-123456789012', 'd7bed82f-3f74-4779-9289-a4ead1fe29af', 'b2345678-90cd-efab-5678-901234567890', '2025-09-10', 25000, 'materials', 'direct', 'bank_transfer', 'paid', 'Dubai Furniture LLC', 'Office furniture package'),
  ('e5678901-23fa-bcde-8901-234567890123', 'd7bed82f-3f74-4779-9289-a4ead1fe29af', 'b2345678-90cd-efab-5678-901234567890', '2025-09-11', 5000, 'transport', 'direct', 'cash', 'approved', 'Express Moving Co.', 'Furniture delivery and installation')
ON CONFLICT (id) DO NOTHING;

-- Insert demo quotations
INSERT INTO quotations (id, user_id, project_id, client_id, number, date, status, items, tax_type, tax_rate, tax_amount, subtotal, total)
VALUES
  ('f6789012-34ab-cdef-9012-345678901234', 'd7bed82f-3f74-4779-9289-a4ead1fe29af', 'b2345678-90cd-efab-5678-901234567890', 'f1234567-89ab-cdef-0123-456789abcdef', 'Q-2509-001', '2025-09-01', 'approved', 
    '[
      {"id": "1", "description": "Office Design Consultation", "quantity": 1, "unitPrice": 15000, "amount": 15000},
      {"id": "2", "description": "Furniture Package", "quantity": 1, "unitPrice": 250000, "amount": 250000},
      {"id": "3", "description": "Installation Services", "quantity": 1, "unitPrice": 35000, "amount": 35000}
    ]',
    'vat', 5, 15000, 300000, 315000)
ON CONFLICT (id) DO NOTHING;

-- Insert demo invoices
INSERT INTO invoices (id, user_id, project_id, client_id, quotation_id, number, date, due_date, status, items, tax_type, tax_rate, tax_amount, subtotal, total)
VALUES
  ('g7890123-45bc-defa-0123-456789012345', 'd7bed82f-3f74-4779-9289-a4ead1fe29af', 'b2345678-90cd-efab-5678-901234567890', 'f1234567-89ab-cdef-0123-456789abcdef', 'f6789012-34ab-cdef-9012-345678901234', 'INV-2509-001', '2025-09-05', '2025-10-05', 'sent',
    '[
      {"id": "1", "description": "Office Design Consultation", "quantity": 1, "unitPrice": 15000, "amount": 15000},
      {"id": "2", "description": "Initial Furniture Payment", "quantity": 1, "unitPrice": 125000, "amount": 125000}
    ]',
    'vat', 5, 7000, 140000, 147000)
ON CONFLICT (id) DO NOTHING;