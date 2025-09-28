# Vercel Environment Variables Setup

This file contains the environment variables needed for your Vercel deployment.

## Option 1: Import JSON file (Recommended)

1. Go to your Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Click "Import" button
5. Upload the `vercel-env-variables.json` file
6. **Important**: Before importing, update the following values in the JSON file:
   - Replace `your-app-name.vercel.app` with your actual Vercel app URL
   - Generate a secure `NEXTAUTH_SECRET` for production

## Option 2: Manual Setup

Add these environment variables manually in Vercel:

### Production Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL = https://ywcqtmzqsvcobtetunuf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3Y3F0bXpxc3Zjb2J0ZXR1bnVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NzczODQsImV4cCI6MjA3MzM1MzM4NH0.If0DHxcnnQOwDlAMe4Q4ME3XXYESEuTNpEWwaOIsdpI
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3Y3F0bXpxc3Zjb2J0ZXR1bnVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzc3NzM4NCwiZXhwIjoyMDczMzUzMzg0fQ.fUj0lqp_NApqfrpN38ydEqE08Hh2WwL-BoVPqdjp3ac
NEXT_PUBLIC_APP_URL = https://your-app-name.vercel.app
NEXTAUTH_URL = https://your-app-name.vercel.app
NEXTAUTH_SECRET = [generate-a-secure-random-string]
NEXT_PUBLIC_MAX_FILE_SIZE = 10485760
NODE_ENV = production
```

### Development Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL = https://ywcqtmzqsvcobtetunuf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3Y3F0bXpxc3Zjb2J0ZXR1bnVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NzczODQsImV4cCI6MjA3MzM1MzM4NH0.If0DHxcnnQOwDlAMe4Q4ME3XXYESEuTNpEWwaOIsdpI
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3Y3F0bXpxc3Zjb2J0ZXR1bnVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzc3NzM4NCwiZXhwIjoyMDczMzUzMzg0fQ.fUj0lqp_NApqfrpN38ydEqE08Hh2WwL-BoVPqdjp3ac
NEXT_PUBLIC_APP_URL = http://localhost:3000
NEXTAUTH_URL = http://localhost:3000
NEXTAUTH_SECRET = your-nextauth-secret-key-change-this-in-production
NEXT_PUBLIC_MAX_FILE_SIZE = 10485760
NODE_ENV = development
```

## Important Notes:

1. **Update App URLs**: Replace `your-app-name.vercel.app` with your actual Vercel deployment URL
2. **Secure NextAuth Secret**: Generate a secure random string for `NEXTAUTH_SECRET` in production
3. **Environment Targeting**: Make sure to set the correct environment (Production, Preview, Development) for each variable
4. **Public vs Private**: Variables starting with `NEXT_PUBLIC_` are exposed to the browser

## Generate NextAuth Secret:

You can generate a secure NextAuth secret using:
```bash
openssl rand -base64 32
```

## After Setting Environment Variables:

1. Redeploy your Vercel application
2. The nodemailer build error should be resolved
3. Your Supabase integration should work properly