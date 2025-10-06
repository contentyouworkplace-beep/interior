"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, Users, Building2, Settings, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function AdminEntryPage() {
  const router = useRouter()

  // Auto-redirect to admin login after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/admin/login')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">GoPLNR Admin Portal</h1>
          </div>
          <p className="text-xl text-gray-600 mb-4">
            Super Admin Panel for CRM Management
          </p>
          <Badge variant="default" className="mb-4">
            Secure Admin Access Required
          </Badge>
          
          {/* Auto-redirect notice */}
          <div className="bg-blue-100 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800">
              🔄 Redirecting to admin login in 3 seconds...
            </p>
            <p className="text-sm text-blue-600 mt-1">
              Or click the button below to access immediately
            </p>
          </div>
        </div>

        {/* Quick access card */}
        <Card className="max-w-md mx-auto mb-8 shadow-xl border-0">
          <CardHeader className="text-center bg-primary/5">
            <CardTitle className="flex items-center justify-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Admin Access
            </CardTitle>
            <CardDescription>
              Secure login for administrators
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Admin Credentials:</p>
                <p className="font-mono text-sm">admin@goplnr.com</p>
                <p className="font-mono text-sm">Millions@RM7890</p>
              </div>
              
              <Link href="/admin/login">
                <Button className="w-full" size="lg">
                  <Shield className="mr-2 h-4 w-4" />
                  Access Admin Panel
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Feature overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Users className="h-5 w-5 mr-2 text-blue-500" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Create & manage CRM users</li>
                <li>• Set subscription plans</li>
                <li>• Monitor user activity</li>
                <li>• Manage user organizations</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Building2 className="h-5 w-5 mr-2 text-green-500" />
                Organizations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Company profile management</li>
                <li>• Branding & settings</li>
                <li>• Organization analytics</li>
                <li>• Multi-tenant control</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Settings className="h-5 w-5 mr-2 text-purple-500" />
                System Control
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Revenue tracking</li>
                <li>• User statistics</li>
                <li>• System configuration</li>
                <li>• Security management</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Back to main site */}
        <div className="text-center mt-8">
          <Link href="/login">
            <Button variant="outline">\n              ← Back to User Login\n            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}