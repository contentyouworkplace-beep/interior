"use client"

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { isAdminUser } from '@/lib/admin/auth'
import { AdminHeader } from '@/components/admin/header'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const adminStatus = await isAdminUser()
        setIsAdmin(adminStatus)
        
        // If not admin and not on login page, redirect to admin login
        if (!adminStatus && pathname !== '/admin/login') {
          router.push('/admin/login')
        }
      } catch (error) {
        console.error('Error checking admin status:', error)
        setIsAdmin(false)
        if (pathname !== '/admin/login') {
          router.push('/admin/login')
        }
      } finally {
        setLoading(false)
      }
    }
    checkAdminStatus()
  }, [router, pathname])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  // Show login page
  if (!isAdmin && pathname === '/admin/login') {
    return <div className="min-h-screen">{children}</div>
  }

  // Show loading if redirecting
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Redirecting to admin login...</p>
        </div>
      </div>
    )
  }

  // Show clean admin interface without main CRM sidebar
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <AdminHeader />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}