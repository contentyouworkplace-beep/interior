"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Shield, Eye, EyeOff } from "lucide-react"
import Image from "next/image"

export default function AdminLoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()
  
  const handleAdminDemo = () => {
    setEmail("admin@goplnr.com")
    setPassword("Millions@RM7890")
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // First verify this is an admin email
      const adminEmails = ['admin@goplnr.com', 'demo@admin.com', 'rahul@contentyou.in']
      if (!adminEmails.includes(email.toLowerCase())) {
        throw new Error('Access denied: Not an admin email')
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      if (data.user) {
        toast({
          title: "Admin Access Granted!",
          description: "Welcome to the Super Admin Panel.",
        })
        
        // Redirect to admin dashboard
        router.push("/admin")
      }
    } catch (error) {
      toast({
        title: "Access Denied",
        description: error instanceof Error ? error.message : "Invalid admin credentials",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Admin branding */}
      <div className="text-center mb-8 max-w-md">
        <div className="flex justify-center mb-4">
          <div className="bg-white p-4 rounded-full shadow-lg">
            <Shield className="h-12 w-12 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Super Admin Panel</h1>
        <p className="text-gray-600 mb-2">
          Secure access to GoPLNR CRM management system.
        </p>
        <p className="text-sm text-gray-500">
          Manage users, organizations, and system settings.
        </p>
      </div>
      
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="space-y-2 text-center bg-primary/5 rounded-t-lg">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Admin Login
          </CardTitle>
          <CardDescription>Enter your administrator credentials</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@goplnr.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-gray-50 focus:bg-white transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-gray-50 focus:bg-white transition-colors pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Verifying Access..." : "Access Admin Panel"}
            </Button>
            
            {/* Demo Credentials Button */}
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={handleAdminDemo}
              className="w-full mt-3 text-sm border-2 border-primary/20 hover:border-primary/40"
            >
              🔑 Use Admin Credentials
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {/* Security notice */}
      <div className="mt-8 text-center text-sm text-gray-500 max-w-md">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-lg">
          <p className="font-medium text-gray-700 mb-2">🛡️ Secure Admin Access</p>
          <p>This panel provides administrative control over all CRM users and organizations. Access is restricted to authorized administrators only.</p>
        </div>
      </div>
      
      {/* Back to main site */}
      <div className="mt-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/login")}>
          ← Back to User Login
        </Button>
      </div>
    </div>
  )
}