"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Crown, AlertTriangle, CheckCircle, IndianRupee, History, Package, Zap } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatINR } from '@/lib/utils'

export function PlanTab() {
  const [subscription, setSubscription] = useState<any>(null)
  const [planDetails, setPlanDetails] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchSubscriptionData()
  }, [])

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch('/api/user/subscription')
      if (response.ok) {
        const data = await response.json()
        setSubscription(data.subscription)
        setPlanDetails(data.planDetails)
        setHistory(data.history || [])
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
    }
    setLoading(false)
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getDaysRemaining = (expiryDate: string | null) => {
    if (!expiryDate) return 0
    const now = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
  }

  if (!subscription || !subscription.plan_id) {
    return (
      <Card><CardContent className="p-12 text-center"><div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4"><AlertTriangle className="h-8 w-8 text-yellow-600" /></div><h3 className="text-xl font-semibold mb-2">No Subscription Found</h3><p className="text-gray-600 mb-6">Please contact admin to set up your subscription.</p></CardContent></Card>
    )
  }

  const daysRemaining = getDaysRemaining(subscription.expires_at)
  const expired = daysRemaining < 0

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader><div className="flex items-center justify-between"><CardTitle className="flex items-center text-xl"><Crown className="h-5 w-5 mr-2 text-yellow-500" />Current Plan</CardTitle><Badge className={getStatusColor(subscription.status)} variant="outline">{subscription.status.toUpperCase()}</Badge></div></CardHeader>
        <CardContent><div className="space-y-4"><div className="flex items-center justify-between"><div><h3 className="text-2xl font-bold">{subscription.plan_name}</h3><p className="text-sm text-gray-600">{subscription.organization}</p></div><div className="text-right"><div className="flex items-center text-2xl font-bold text-primary"><IndianRupee className="h-5 w-5" />{subscription.plan_price.toLocaleString()}</div><p className="text-sm text-gray-600">for {subscription.plan_duration} days</p></div></div>{subscription.expires_at && <div className="text-sm"><span className={expired ? 'text-red-600 font-semibold' : 'text-green-600'}>{expired ? 'Expired' : `${daysRemaining} days remaining`}</span><p className="text-xs text-gray-500 mt-1">Expires: {new Date(subscription.expires_at).toLocaleDateString()}</p></div>}</div></CardContent>
      </Card>

      {subscription.plan_features && subscription.plan_features.length > 0 && (
        <Card><CardHeader><CardTitle className="flex items-center"><Zap className="h-5 w-5 mr-2" />Features</CardTitle></CardHeader><CardContent><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{subscription.plan_features.map((feature: string, index: number) => (<div key={index} className="flex items-start space-x-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5" /><span className="text-sm">{feature}</span></div>))}</div></CardContent></Card>
      )}

      {planDetails && (
        <Card><CardHeader><CardTitle className="flex items-center"><Package className="h-5 w-5 mr-2" />Plan Details</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><div><label className="text-xs font-medium text-gray-500 uppercase">Name</label><p className="text-sm font-semibold mt-1">{planDetails.name}</p></div><div><label className="text-xs font-medium text-gray-500 uppercase">Price</label><p className="text-sm font-semibold mt-1">{formatINR(planDetails.price)}</p></div><div><label className="text-xs font-medium text-gray-500 uppercase">Duration</label><p className="text-sm font-semibold mt-1">{planDetails.duration_days} days</p></div><div><label className="text-xs font-medium text-gray-500 uppercase">Status</label><Badge className={getStatusColor(subscription.status)} variant="outline">{subscription.status}</Badge></div></div></CardContent></Card>
      )}

      {history && history.length > 0 && (
        <Card><CardHeader><CardTitle className="flex items-center"><History className="h-5 w-5 mr-2" />History</CardTitle></CardHeader><CardContent><div className="space-y-3">{history.map((item) => (<div key={item.id} className="flex justify-between p-3 bg-gray-50 rounded-lg border"><div><p className="font-medium text-sm">{item.plans?.name || 'Plan'}</p><p className="text-xs text-gray-500">{new Date(item.start_date).toLocaleDateString()} - {new Date(item.end_date).toLocaleDateString()}</p></div><div className="text-right"><p className="font-semibold text-sm">{formatINR(item.plans?.price || 0)}</p><Badge variant="outline" className={`text-xs ${getStatusColor(item.status)}`}>{item.status}</Badge></div></div>))}</div></CardContent></Card>
      )}

      {expired && (
        <Card className="border-red-300 bg-red-50"><CardContent className="p-4"><div className="flex items-start space-x-3"><AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" /><div><h4 className="font-semibold text-red-800">Subscription Expired</h4><p className="text-sm text-red-700 mt-1">Your subscription expired on <strong>{new Date(subscription.expires_at!).toLocaleDateString()}</strong>. Contact admin to renew.</p><Button variant="destructive" size="sm" className="mt-3" onClick={() => window.location.href = 'mailto:admin@goplnr.com'}>Contact Admin</Button></div></div></CardContent></Card>
      )}
    </div>
  )
}
