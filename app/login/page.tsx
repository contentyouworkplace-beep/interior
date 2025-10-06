"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import Preloader from "@/components/ui/preloader"
import { AlertCircle } from "lucide-react"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  const supabase = createClient()
  
  useEffect(() => {
    // Check if redirected due to subscription expiry
    if (searchParams.get('expired') === 'true') {
      toast({
        title: "Subscription Expired",
        description: "Your subscription has expired. Please contact your administrator to renew.",
        variant: "destructive",
      })
    }
  }, [searchParams, toast])
  
  const handleDemoLogin = () => {
    setEmail("demo@admin.com")
    setPassword("Demo@1234")
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      if (data.user) {
        // Check if user is admin
        const isAdmin = data.user.email === 'admin@goplnr.com'
        
        toast({
          title: "Success!",
          description: isAdmin 
            ? "Welcome back, Admin!" 
            : "You have been logged in successfully.",
        })
        
        // Show loading state and redirect
        setIsSigningIn(true)
        setTimeout(() => {
          // Redirect admin to admin panel, regular users to dashboard
          router.push(isAdmin ? "/admin" : "/dashboard")
        }, 1000)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to sign in",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Show preloader during sign-in process */}
      {isSigningIn && <Preloader isLoading={isSigningIn} />}
      
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/20">
        {/* Main branding with logo above the login form */}
        <div className="text-center mb-8 max-w-md">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="GoPLNR.com Logo"
              width={200}
              height={80}
              className="h-16 w-auto"
              priority
            />
          </div>
          <p className="text-muted-foreground mb-2">
            Complete CRM solution for interior designers and architects.
          </p>
          <p className="text-muted-foreground">
            Manage clients, projects, quotations, and team collaboration in one place.
          </p>
        </div>
        
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Sign in to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
              
              {/* Demo Credentials Button */}
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={handleDemoLogin}
                className="w-full mt-3 text-sm border-2 border-primary/20 hover:border-primary/40"
              >
                🎯 Use Demo Credentials
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {/* Additional branding text below the login form */}
        <div className="mt-8 text-center text-sm text-muted-foreground max-w-md">
          <div className="space-y-1">
            <p className="font-medium text-foreground">Designed for Interior Designers across India</p>
            <p>Easy Client & Project Management</p>
          </div>
        </div>
      </div>
    </>
  )
}