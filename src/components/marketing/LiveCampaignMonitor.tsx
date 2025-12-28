import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Play, Pause, Square, Eye, MousePointer, DollarSign, Target } from 'lucide-react'
import { useRealTimeMarketing } from '@/hooks/useRealTimeMarketing'
import { useToast } from '@/hooks/use-toast'

export function LiveCampaignMonitor() {
  const { campaigns, isLoading } = useRealTimeMarketing()
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null)
  const { toast } = useToast()

  const activeCampaigns = campaigns.filter(c => c.status === 'active')
  const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)

  const handleCampaignAction = async (campaignId: string, action: string) => {
    toast({ title: `Campagne ${action === 'pause' ? 'mise en pause' : action === 'resume' ? 'reprise' : 'arrêtée'}` })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) return <div className="animate-pulse space-y-4"><div className="h-32 bg-muted rounded-lg" /></div>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Campagnes Actives - Monitoring</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {activeCampaigns.map((campaign) => (
              <div key={campaign.id} className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedCampaign?.id === campaign.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`} onClick={() => setSelectedCampaign(campaign)}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium truncate">{campaign.name}</h4>
                  <Badge className={getStatusColor(campaign.status)}>{campaign.status}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">Budget: {formatCurrency(campaign.budget_total || 0)}</div>
                <Progress value={((campaign.budget_spent || 0) / (campaign.budget_total || 1)) * 100} className="h-1 mt-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedCampaign && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Impressions</CardTitle><Eye className="h-4 w-4" /></CardHeader><CardContent><div className="text-2xl font-bold">{(selectedCampaign.metrics?.impressions || 0).toLocaleString()}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">CTR</CardTitle><MousePointer className="h-4 w-4" /></CardHeader><CardContent><div className="text-2xl font-bold">{((selectedCampaign.metrics?.ctr || 0) * 100).toFixed(1)}%</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">ROAS</CardTitle><DollarSign className="h-4 w-4" /></CardHeader><CardContent><div className="text-2xl font-bold">{(selectedCampaign.metrics?.roas || 0).toFixed(1)}x</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Conversions</CardTitle><Target className="h-4 w-4" /></CardHeader><CardContent><div className="text-2xl font-bold">{selectedCampaign.metrics?.conversions || 0}</div></CardContent></Card>
        </div>
      )}
    </div>
  )
}
