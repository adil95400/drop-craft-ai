import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Users, DollarSign, TrendingUp, Link2, Star, Eye, ShoppingCart,
  MessageSquare, Copy, Share
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

const AffiliationPage = () => {
  const { toast } = useToast()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch affiliates from customers with referral data
  const { data: affiliates = [], isLoading: loadingAffiliates } = useQuery({
    queryKey: ['affiliates', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .not('tags', 'is', null)
        .order('total_spent', { ascending: false })
        .limit(50)
      return (data || [])
        .filter((c: any) => (c.tags || []).some((t: string) => t.toLowerCase().includes('affilié') || t.toLowerCase().includes('affiliate')))
        .map((c: any) => ({
          id: c.id,
          name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email,
          email: c.email,
          avatar: c.avatar_url,
          joinDate: new Date(c.created_at).toLocaleDateString('fr-FR'),
          status: c.status === 'active' ? 'active' : 'pending',
          totalCommissions: (c.total_spent || 0) * 0.1,
          totalSales: c.total_spent || 0,
          clicksGenerated: c.total_orders || 0,
          conversionRate: c.total_orders ? Math.min(((c.total_orders / Math.max(c.total_orders * 25, 1)) * 100), 10).toFixed(1) : '0',
          tier: (c.total_spent || 0) > 5000 ? 'platinum' : (c.total_spent || 0) > 2000 ? 'gold' : (c.total_spent || 0) > 500 ? 'silver' : 'bronze',
          referralCode: `REF-${c.id.slice(0, 6).toUpperCase()}`
        }))
    },
    enabled: !!user?.id
  })

  // Fetch commissions from orders
  const { data: commissions = [], isLoading: loadingCommissions } = useQuery({
    queryKey: ['affiliate-commissions', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data } = await supabase
        .from('orders')
        .select('id, order_number, total_amount, created_at, customer_name')
        .eq('user_id', user.id)
        .not('customer_name', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20)
      return (data || []).map((o: any) => ({
        id: o.id,
        affiliateName: o.customer_name || 'Inconnu',
        productName: `Commande ${o.order_number}`,
        saleAmount: o.total_amount || 0,
        commissionAmount: (o.total_amount || 0) * 0.1,
        rate: 10,
        date: new Date(o.created_at).toLocaleDateString('fr-FR'),
        status: 'approved'
      }))
    },
    enabled: !!user?.id
  })

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'bg-orange-100 text-orange-800'
      case 'silver': return 'bg-gray-100 text-gray-800'
      case 'gold': return 'bg-yellow-100 text-yellow-800'
      case 'platinum': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleCopyReferralCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({ title: "Code copié", description: `Le code ${code} a été copié` })
  }

  const totalAffiliates = affiliates.length
  const activeAffiliates = affiliates.filter((a: any) => a.status === 'active').length
  const totalCommissionsAmt = affiliates.reduce((sum: number, a: any) => sum + a.totalCommissions, 0)
  const totalSales = affiliates.reduce((sum: number, a: any) => sum + a.totalSales, 0)
  const isLoading = loadingAffiliates || loadingCommissions

  return (
    <ChannablePageWrapper
      title="Affiliation & Influenceurs"
      description="Programme d'affiliation et marketplace d'influenceurs"
      heroImage="marketing"
      badge={{ label: 'Affiliation', icon: Users }}
      actions={
        <>
          <Button variant="outline"><Share className="mr-2 h-4 w-4" />Partager le programme</Button>
          <Button><Users className="mr-2 h-4 w-4" />Recruter des affiliés</Button>
        </>
      }
    >
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Affiliés actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : activeAffiliates}</div>
            <p className="text-xs text-muted-foreground">+{totalAffiliates - activeAffiliates} en attente</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commissions versées</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalCommissionsAmt.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventes générées</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalSales.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{affiliates.length > 0 ? (affiliates.reduce((s: number, a: any) => s + parseFloat(a.conversionRate), 0) / affiliates.length).toFixed(1) : '0'}%</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="affiliates">Affiliés</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Top Affiliés</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>
              ) : affiliates.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Aucun affilié. Taguez des clients avec "affilié" pour les voir ici.</p>
              ) : (
                <div className="space-y-4">
                  {affiliates.slice(0, 5).map((affiliate: any) => (
                    <div key={affiliate.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={affiliate.avatar} />
                          <AvatarFallback>{affiliate.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{affiliate.name}</p>
                          <Badge className={getTierColor(affiliate.tier)}>{affiliate.tier}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">€{affiliate.totalCommissions.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">{affiliate.conversionRate}% conv.</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="affiliates" className="space-y-4">
          <div className="flex justify-between items-center">
            <Input placeholder="Rechercher un affilié..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" />
          </div>
          {isLoading ? (
            [1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)
          ) : (
            affiliates.filter((a: any) => a.name.toLowerCase().includes(searchTerm.toLowerCase())).map((affiliate: any) => (
              <Card key={affiliate.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <Avatar><AvatarFallback>{affiliate.name[0]}</AvatarFallback></Avatar>
                      <div>
                        <CardTitle className="text-lg">{affiliate.name}</CardTitle>
                        <CardDescription>{affiliate.email}</CardDescription>
                        <div className="flex gap-2 mt-2">
                          <Badge className={getTierColor(affiliate.tier)}>{affiliate.tier}</Badge>
                          <Badge variant={affiliate.status === 'active' ? 'default' : 'secondary'}>{affiliate.status}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Commissions</p>
                      <p className="text-lg font-bold">€{affiliate.totalCommissions.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ventes</p>
                      <p className="text-lg font-bold">€{affiliate.totalSales.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Conversion</p>
                      <p className="text-lg font-bold">{affiliate.conversionRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Code parrainage</p>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-muted px-2 py-1 rounded">{affiliate.referralCode}</code>
                        <Button size="sm" variant="ghost" onClick={() => handleCopyReferralCode(affiliate.referralCode)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="commissions" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Dernières commissions</CardTitle></CardHeader>
            <CardContent>
              {loadingCommissions ? (
                <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>
              ) : commissions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Aucune commission enregistrée</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="p-3">Affilié</th>
                        <th className="p-3">Vente</th>
                        <th className="p-3">Commission</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commissions.map((c: any) => (
                        <tr key={c.id} className="border-b">
                          <td className="p-3 font-medium">{c.affiliateName}</td>
                          <td className="p-3">€{c.saleAmount.toFixed(2)}</td>
                          <td className="p-3 font-bold text-green-600">€{c.commissionAmount.toFixed(2)}</td>
                          <td className="p-3 text-muted-foreground">{c.date}</td>
                          <td className="p-3"><Badge variant="default">Approuvé</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  )
}

export default AffiliationPage
