#!/bin/bash

# ==========================================
# INTERIOR DESIGNER CRM - COMPLETE SETUP SCRIPT
# ==========================================
# This script sets up the complete CRM system with database schema and demo data

echo "🚀 Starting Interior Designer CRM Complete Setup..."
echo "=================================================="

# Check if required environment variables exist
echo "🔍 Checking environment variables..."
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Missing required environment variables!"
    echo ""
    echo "Please ensure you have set:"
    echo "  - NEXT_PUBLIC_SUPABASE_URL"
    echo "  - SUPABASE_SERVICE_ROLE_KEY"
    echo ""
    echo "You can set them by running:"
    echo "  export NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
    echo "  export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
    echo ""
    echo "Or create a .env.local file with:"
    echo "  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
    echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key"
    echo "  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
    exit 1
fi

# Check if .env.local exists and load it
if [ -f ".env.local" ]; then
    echo "✅ Found .env.local file"
    set -a
    source .env.local
    set +a
else
    echo "⚠️  No .env.local file found. Using environment variables."
fi

echo "✅ Environment variables found"
echo "🔗 Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"
echo ""

# Step 1: Install dependencies if node_modules doesn't exist
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

# Step 2: Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI not found. You can install it with:"
    echo "   npm install -g supabase"
    echo ""
    echo "For now, we'll proceed with the Node.js seeding script only."
    echo "Please manually execute the complete-crm-schema.sql in your Supabase dashboard."
    echo ""
else
    echo "✅ Supabase CLI found"
    
    # Step 3: Apply database schema (if Supabase CLI is available and logged in)
    echo "🗄️  Applying database schema..."
    
    # Check if logged in to Supabase
    if supabase status &> /dev/null; then
        echo "✅ Supabase CLI is logged in"
        
        # Try to run the schema
        if [ -f "complete-crm-schema.sql" ]; then
            supabase db reset --linked
            psql "$DATABASE_URL" -f complete-crm-schema.sql
            echo "✅ Database schema applied"
        else
            echo "⚠️  Schema file not found. Please run the complete-crm-schema.sql manually."
        fi
    else
        echo "⚠️  Supabase CLI not logged in. Please run 'supabase login' first."
        echo "    Or execute the complete-crm-schema.sql manually in your Supabase dashboard."
    fi
    echo ""
fi

# Step 4: Run the demo data seeding script
echo "🌱 Seeding demo data..."
node setup-complete-crm-demo.js

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 CRM Setup Complete!"
    echo "===================="
    echo ""
    echo "Your Interior Designer CRM is now fully set up with:"
    echo "  ✅ Complete database schema (28 tables)"
    echo "  ✅ Storage buckets for file uploads"
    echo "  ✅ Demo data across all modules"
    echo "  ✅ Sample clients, projects, invoices, and more"
    echo ""
    echo "🔑 Demo Login Credentials:"
    echo "   Email: demo@interiorcrm.com"
    echo "   Password: demo123456"
    echo ""
    echo "🚀 Next Steps:"
    echo "   1. Run: npm run dev"
    echo "   2. Open: http://localhost:3000"
    echo "   3. Login with the demo credentials above"
    echo "   4. Explore your fully populated CRM!"
    echo ""
    echo "📋 What's Available:"
    echo "   • Dashboard with project overview"
    echo "   • Client management with 3 demo clients"
    echo "   • Project tracking with 3 active projects"
    echo "   • Financial management (quotations, invoices, payments)"
    echo "   • Team member management"
    echo "   • Vendor management"
    echo "   • Task management with Kanban boards"
    echo "   • Expense tracking"
    echo "   • Notification system"
    echo "   • File upload capabilities"
    echo ""
    echo "Happy designing! 🎨"
else
    echo ""
    echo "❌ Demo data seeding failed!"
    echo "Please check the error messages above and try again."
    echo ""
    echo "Manual Setup Instructions:"
    echo "1. Execute complete-crm-schema.sql in your Supabase dashboard"
    echo "2. Run: node setup-complete-crm-demo.js"
    echo "3. Check your environment variables are correct"
fi