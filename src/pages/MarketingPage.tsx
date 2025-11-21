import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Mail,
  Plus,
  TrendingUp,
  Users,
  Eye,
  MousePointer,
  DollarSign,
  Megaphone,
} from 'lucide-react'

export default function MarketingPage() {
  const { data: campaigns } = useQuery({
    queryKey: ['marketing-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_campaigns')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const { data: automatedCampaigns } = useQuery({
    queryKey: ['automated-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automated_campaigns')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const totalCampaigns = (campaigns?.length || 0) + (automatedCampaigns?.length || 0)
  const activeCampaigns =
    (campaigns?.filter((c) => c.status === 'active').length || 0) +
    (automatedCampaigns?.filter((c) => c.status === 'active').length || 0)

  const totalSpent = campaigns?.reduce((sum, c) => sum + (c.budget_spent || 0), 0) || 0

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-500/10 text-green-500',
      paused: 'bg-yellow-500/10 text-yellow-500',
      completed: 'bg-blue-500/10 text-blue-500',
      draft: 'bg-gray-500/10 text-gray-500',
    }
    return colors[status] || 'bg-muted text-muted-foreground'
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marketing Hub</h1>
          <p className="text-muted-foreground">Manage campaigns and automation</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Campaign
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Megaphone className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Campaigns</p>
              <p className="text-2xl font-bold">{totalCampaigns}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-500/10">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{activeCampaigns}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <DollarSign className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-bold">€{totalSpent.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-500/10">
              <MousePointer className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg CTR</p>
              <p className="text-2xl font-bold">2.4%</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList>
          <TabsTrigger value="campaigns">Ad Campaigns</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="email">Email Marketing</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          {campaigns?.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No campaigns yet</p>
            </Card>
          ) : (
            campaigns?.map((campaign) => (
              <Card key={campaign.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {campaign.campaign_name}
                      </h3>
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {campaign.platform} • {campaign.campaign_type}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Impressions</p>
                      <p className="font-semibold">
                        {(campaign.performance_metrics as any)?.impressions || 0}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MousePointer className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Clicks</p>
                      <p className="font-semibold">
                        {(campaign.performance_metrics as any)?.clicks || 0}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Budget Spent</p>
                      <p className="font-semibold">
                        €{(campaign.budget_spent || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">CTR</p>
                      <p className="font-semibold">
                        {(campaign.performance_metrics as any)?.ctr || 0}%
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          {automatedCampaigns?.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No automated campaigns yet</p>
            </Card>
          ) : (
            automatedCampaigns?.map((campaign) => (
              <Card key={campaign.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {campaign.campaign_name}
                      </h3>
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {campaign.campaign_type} • {campaign.trigger_type}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Edit Rules
                  </Button>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="email">
          <Card className="p-8 text-center">
            <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Email Marketing</h3>
            <p className="text-muted-foreground mb-4">
              Set up email campaigns and newsletters
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Email Campaign
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
