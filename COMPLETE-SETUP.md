# 🏠 Interior Designer CRM - Complete Setup Guide

A comprehensive Customer Relationship Management system designed specifically for interior designers and design studios.

## 🎯 What You'll Get

After setup, your CRM will be fully populated with:

- **👥 Client Management**: 3 demo clients with complete profiles
- **🏗️ Project Tracking**: 3 active projects in different stages  
- **💰 Financial Management**: Quotations, invoices, and payments
- **👨‍💼 Team Management**: 3 team members with different roles
- **🏪 Vendor Management**: 3 vendors with specializations
- **✅ Task Management**: Project tasks with Kanban boards
- **💸 Expense Tracking**: Sample expenses across categories
- **🔔 Notifications**: Real-time notification system
- **📅 Calendar**: Appointments and scheduling
- **📁 File Management**: Storage buckets for all file types

## 🚀 Quick Setup (Automated)

### Prerequisites

1. **Supabase Project**: Create a new project at [supabase.com](https://supabase.com)
2. **Environment Variables**: Get your project credentials from Supabase dashboard

### Environment Setup

Create a `.env.local` file in your project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### One-Command Setup

```bash
# Clone and setup (if not already done)
git clone your-repo-url
cd interior-designer-crm

# Run the complete setup
./setup-crm.sh
```

This script will:
1. ✅ Install all dependencies
2. ✅ Create complete database schema (28 tables)
3. ✅ Set up storage buckets
4. ✅ Seed comprehensive demo data
5. ✅ Create demo user account

### Demo Login

After setup, login with:
- **Email**: `demo@interiorcrm.com`
- **Password**: `demo123456`

## 🛠️ Manual Setup (Step by Step)

If the automated setup doesn't work, follow these manual steps:

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 2. Database Schema

Execute the complete schema in your Supabase SQL editor:

```bash
# Copy the content of complete-crm-schema.sql
# Paste and run in Supabase Dashboard > SQL Editor
```

### 3. Environment Variables

Ensure your `.env.local` has all required variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Seed Demo Data

```bash
node setup-complete-crm-demo.js
```

### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` and login with demo credentials.

## 📊 Database Structure

### Core Tables (28 total)

| Category | Tables | Purpose |
|----------|--------|---------|
| **User Management** | `profiles`, `business_settings` | User profiles and company settings |
| **Client Management** | `clients`, `leads`, `client_files` | Client information and lead tracking |
| **Project Management** | `projects`, `project_tasks`, `project_team_members`, `project_phases`, `project_assets`, `project_files`, `project_templates`, `task_time_logs` | Complete project lifecycle management |
| **Financial Management** | `quotations`, `quotation_items`, `invoices`, `invoice_items`, `payments`, `expenses` | Financial tracking and billing |
| **Team & Vendors** | `team_members`, `vendors`, `vendor_projects`, `vendor_quotations` | Team and vendor management |
| **System & Tracking** | `activity_log`, `notifications`, `appointments`, `inventory_items`, `email_templates` | System functionality and tracking |

### Storage Buckets

| Bucket | Purpose | Access |
|--------|---------|--------|
| `avatars` | User profile pictures | Public |
| `receipts` | Expense receipts | Private |
| `client-files` | Client documents | Private |
| `project-assets` | Project files | Private |
| `expense-documents` | Expense documentation | Private |

## 🎨 Demo Data Overview

### Clients (3)
- **Sarah Johnson** - Corporate client (Johnson Enterprises)
- **Michael Chen** - Individual client (Apartment renovation)
- **Emily Rodriguez** - Family home renovation

### Projects (3)
- **Johnson Corporate Office Redesign** - $150,000 budget, In Progress
- **Chen Apartment Renovation** - $65,000 budget, Planning phase  
- **Rodriguez Family Home** - $85,000 budget, Planning phase

### Team Members (3)
- **Alex Rivera** - Senior Designer (Residential specialist)
- **Jessica Park** - Project Manager (Coordination expert)
- **Carlos Martinez** - 3D Visualizer (Rendering specialist)

### Vendors (3)
- **Premium Furniture Co.** - Custom furniture manufacturer
- **Elite Lighting Solutions** - Modern lighting fixtures
- **Quality Contractors Inc.** - Construction and renovation

### Financial Data
- **Quotations**: 3 quotations with detailed line items
- **Invoices**: 2 invoices (1 paid, 1 pending)
- **Payments**: 1 payment record
- **Expenses**: 5 expense records across different categories

## 🔐 Security Features

- **Row Level Security (RLS)**: All tables protected by user-based policies
- **Authentication**: Supabase Auth with email/password
- **File Security**: Private storage buckets with proper access controls
- **API Security**: Service role key for admin operations only

## 🔧 Customization

### Adding New Fields

1. Update database schema in `complete-crm-schema.sql`
2. Update TypeScript types in `types/supabase.ts`
3. Update forms and components as needed

### Adding New Tables

1. Add table definition to schema
2. Create RLS policies
3. Add to seeding script if needed
4. Update service layer

### Modifying Demo Data

Edit `setup-complete-crm-demo.js` to customize:
- Client information
- Project details
- Team member profiles
- Financial amounts
- Task templates

## 🚨 Troubleshooting

### Common Issues

**1. Environment Variables Not Found**
```bash
# Verify your .env.local file exists and has correct variables
cat .env.local
```

**2. Database Connection Failed**
- Check Supabase project is active
- Verify URL and keys are correct
- Ensure service role key has proper permissions

**3. Demo Data Seeding Failed**
```bash
# Run with detailed logging
DEBUG=* node setup-complete-crm-demo.js
```

**4. RLS Policies Blocking Access**
- Ensure user is properly authenticated
- Check RLS policies match user context
- Verify foreign key relationships

### Reset Database

To start fresh:

```bash
# In Supabase Dashboard > SQL Editor
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

# Then re-run the setup
./setup-crm.sh
```

## 📱 Features Overview

### Dashboard
- Project overview with progress tracking
- Recent activity feed
- Financial summary
- Quick action buttons

### Client Management
- Complete client profiles with contact information
- Lead tracking and conversion
- Client document storage
- Communication history

### Project Management
- Project lifecycle tracking
- Task management with Kanban boards
- Team assignment and collaboration
- File and asset management
- Progress monitoring

### Financial Management
- Professional quotation generation
- Invoice creation and tracking
- Payment recording
- Expense management with receipt uploads

### Team Management
- Team member profiles and roles
- Skill and specialization tracking
- Project assignment management
- Performance metrics

### Vendor Management
- Vendor database with ratings
- Project-vendor associations
- Quotation management
- Contact management

## 🎯 Next Steps

After successful setup:

1. **Explore the Demo Data**: Login and navigate through all modules
2. **Customize Business Settings**: Update company information
3. **Add Real Data**: Replace demo data with actual clients and projects
4. **Configure Email**: Set up email templates and notifications
5. **Train Your Team**: Onboard team members and assign roles
6. **Go Live**: Start using the CRM for real projects

## 🤝 Support

If you encounter any issues:

1. Check this README for troubleshooting steps
2. Verify all environment variables are correct
3. Ensure Supabase project is properly configured
4. Check browser console for any JavaScript errors

## 📄 License

This project is licensed under the MIT License.

---

**Happy Designing! 🎨✨**

Your Interior Designer CRM is now ready to help you manage clients, projects, and grow your design business!