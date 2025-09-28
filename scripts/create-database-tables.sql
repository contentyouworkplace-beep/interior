-- Create quotations table
CREATE TABLE IF NOT EXISTS quotations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quotation_number VARCHAR(50) UNIQUE NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255),
    client_phone VARCHAR(20),
    client_address TEXT,
    project_name VARCHAR(255),
    subject VARCHAR(500),
    description TEXT,
    subtotal DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    valid_until DATE,
    terms_conditions TEXT,
    template_type VARCHAR(50) DEFAULT 'modern',
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quotation_items table
CREATE TABLE IF NOT EXISTS quotation_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create business_settings table
CREATE TABLE IF NOT EXISTS business_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    tagline VARCHAR(500),
    logo_url TEXT,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    country VARCHAR(100) DEFAULT 'India',
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    website VARCHAR(255),
    gstin VARCHAR(15),
    pan VARCHAR(10),
    cin VARCHAR(21),
    bank_name VARCHAR(255),
    bank_account VARCHAR(50),
    ifsc_code VARCHAR(11),
    primary_color VARCHAR(7) DEFAULT '#3B82F6',
    secondary_color VARCHAR(7) DEFAULT '#1E40AF',
    quotation_template VARCHAR(50) DEFAULT 'modern',
    invoice_template VARCHAR(50) DEFAULT 'modern',
    signature_url TEXT,
    terms_conditions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_created_at ON quotations(created_at);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_business_settings_user_id ON business_settings(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (for now, allow all operations)
CREATE POLICY "Allow all operations on quotations" ON quotations FOR ALL USING (true);
CREATE POLICY "Allow all operations on quotation_items" ON quotation_items FOR ALL USING (true);
CREATE POLICY "Allow all operations on business_settings" ON business_settings FOR ALL USING (true);