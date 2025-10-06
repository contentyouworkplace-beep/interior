-- Insert a new quotation for the demo user
INSERT INTO quotations (
  id, user_id, client_id, project_id, quotation_number, title, status, issue_date, valid_until, subtotal, tax_rate, tax_amount, total_amount, created_at
) VALUES (
  gen_random_uuid(),
  '2be2c560-6ab0-4732-afd9-0bbdccfce561',
  NULL,
  NULL,
  'Q-2025-TEST',
  'Test Quotation',
  'draft',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  10000,
  18.0,
  1800,
  11800,
  NOW()
) ON CONFLICT DO NOTHING;
