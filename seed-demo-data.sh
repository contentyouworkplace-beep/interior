#!/bin/bash

# ==========================================
# SEED DEMO DATA ONLY
# ==========================================
# This script only seeds demo data (assumes schema is already set up)

echo "🌱 Seeding CRM Demo Data..."
echo "============================"

# Check if .env.local exists and load it
if [ -f ".env.local" ]; then
    echo "✅ Found .env.local file"
    set -a
    source .env.local
    set +a
else
    echo "⚠️  No .env.local file found. Using environment variables."
fi

# Check if required environment variables exist
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Missing required environment variables!"
    echo ""
    echo "Please ensure you have:"
    echo "  - NEXT_PUBLIC_SUPABASE_URL"
    echo "  - SUPABASE_SERVICE_ROLE_KEY"
    echo ""
    echo "Set them in .env.local or as environment variables"
    exit 1
fi

echo "✅ Environment variables found"
echo "🔗 Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed"
    echo ""
fi

# Run the demo data seeding script
echo "🌱 Seeding demo data..."
node setup-complete-crm-demo.js

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Demo Data Seeding Complete!"
    echo "=============================="
    echo ""
    echo "🔑 Demo Login Credentials:"
    echo "   Email: demo@interiorcrm.com"
    echo "   Password: demo123456"
    echo ""
    echo "🚀 Next Steps:"
    echo "   1. Run: pnpm dev"
    echo "   2. Open: http://localhost:3000"
    echo "   3. Login with the demo credentials above"
    echo ""
    echo "📋 Your CRM now has:"
    echo "   ✅ 3 Demo clients with complete profiles"
    echo "   ✅ 3 Active projects in different stages"
    echo "   ✅ Team members, vendors, and suppliers"
    echo "   ✅ Financial data (quotations, invoices, payments)"
    echo "   ✅ Tasks, notifications, and appointments"
    echo "   ✅ Storage buckets for file uploads"
    echo ""
    echo "Happy designing! 🎨"
else
    echo ""
    echo "❌ Demo data seeding failed!"
    echo ""
    echo "Common solutions:"
    echo "1. Ensure your Supabase database schema is set up"
    echo "2. Check your environment variables are correct"
    echo "3. Verify your Supabase project is active"
    echo "4. Make sure you have the service role key (not anon key)"
    echo ""
    echo "To set up the database schema:"
    echo "1. Go to your Supabase dashboard"
    echo "2. Navigate to SQL Editor"
    echo "3. Copy and paste the content of complete-crm-schema.sql"
    echo "4. Run the SQL script"
    echo "5. Then run this script again"
fi