const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

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

async function createTables() {
    try {
        console.log('🚀 Creating database tables...')
        
        // Create quotations table
        console.log('Creating quotations table...')
        const { error: quotationsError } = await supabase.rpc('exec_sql', {
            sql: `
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
            `
        })
        
        if (quotationsError) {
            console.log('Note: quotations table may already exist or need manual creation')
        }
        
        // Create quotation_items table
        console.log('Creating quotation_items table...')
        const { error: itemsError } = await supabase.rpc('exec_sql', {
            sql: `
                CREATE TABLE IF NOT EXISTS quotation_items (
                    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
                    description TEXT NOT NULL,
                    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
                    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
                    total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `
        })
        
        if (itemsError) {
            console.log('Note: quotation_items table may already exist or need manual creation')
        }
        
        // Create business_settings table
        console.log('Creating business_settings table...')
        const { error: settingsError } = await supabase.rpc('exec_sql', {
            sql: `
                CREATE TABLE IF NOT EXISTS business_settings (
                    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    user_id VARCHAR(255) DEFAULT 'default-user',
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
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `
        })
        
        if (settingsError) {
            console.log('Note: business_settings table may already exist or need manual creation')
        }
        
        console.log('✅ Table creation process completed!')
        console.log('\nIf you see any errors above, please:')
        console.log('1. Go to your Supabase dashboard')
        console.log('2. Navigate to SQL Editor')
        console.log('3. Copy and paste the SQL from create-database-tables.sql')
        console.log('4. Execute the SQL manually')
        
    } catch (error) {
        console.error('❌ Error creating tables:', error)
        console.log('\nManual Setup Instructions:')
        console.log('1. Go to your Supabase dashboard')
        console.log('2. Navigate to SQL Editor') 
        console.log('3. Copy and paste the contents of create-database-tables.sql')
        console.log('4. Execute the SQL')
    }
}

createTables()