import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Mail, Users, TrendingUp, Zap, Target, BarChart3, DollarSign, Eye } from "lucide-react"
import { CampaignManager } from "./CampaignManager"
import { EmailAutomation } from "./EmailAutomation"
import { CustomerSegmentation } from "./CustomerSegmentation"
import { MarketingAnalytics } from "./MarketingAnalytics"
import { MarketingQuickNav } from "./MarketingQuickNav"
import { useMarketingDashboardStats } from "@/hooks/useMarketingDashboardStats"
import { cn } from "@/lib/utils"

export const MarketingDashboard = () => {
  const { data: stats, isLoading } = useMarketingDashboardStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Marketing Automation</h1>
        <p className="text-muted-foreground mt-2">
          Automatisez vos campagnes marketing avec l'IA
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6 relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Campagnes actives</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold">{stats?.activeCampaigns ?? 0}</p>
              )}
            </div>
          </div>
          {stats?.isDemo && (
            <Badge variant="outline" className="absolute top-2 right-2 text-[10px]">
              Démo
            </Badge>
          )}
        </Card>

        <Card className="p-6 relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Eye className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Taux d'ouverture</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold">{stats?.openRate?.toFixed(1) ?? 0}%</p>
              )}
            </div>
          </div>
          {stats?.isDemo && (
            <Badge variant="outline" className="absolute top-2 right-2 text-[10px]">
              Démo
            </Badge>
          )}
        </Card>

        <Card className="p-6 relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Conversions</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold">{stats?.conversions ?? 0}</p>
              )}
            </div>
          </div>
          {stats?.isDemo && (
            <Badge variant="outline" className="absolute top-2 right-2 text-[10px]">
              Démo
            </Badge>
          )}
        </Card>

        <Card className="p-6 relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-3 rounded-lg",
              (stats?.avgROI ?? 0) >= 100 ? "bg-emerald-500/10" : "bg-amber-500/10"
            )}>
              <DollarSign className={cn(
                "w-6 h-6",
                (stats?.avgROI ?? 0) >= 100 ? "text-emerald-500" : "text-amber-500"
              )} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ROI moyen</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold">{stats?.avgROI?.toFixed(0) ?? 0}%</p>
              )}
            </div>
          </div>
          {stats?.isDemo && (
            <Badge variant="outline" className="absolute top-2 right-2 text-[10px]">
              Démo
            </Badge>
          )}
        </Card>
      </div>

      {/* Quick Navigation */}
      <MarketingQuickNav />

      {/* Main Tabs */}
      <Tabs defaultValue="campaigns" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="campaigns">
            <Target className="w-4 h-4 mr-2" />
            Campagnes
          </TabsTrigger>
          <TabsTrigger value="automation">
            <Zap className="w-4 h-4 mr-2" />
            Automation
          </TabsTrigger>
          <TabsTrigger value="segmentation">
            <Users className="w-4 h-4 mr-2" />
            Segmentation
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <CampaignManager />
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <EmailAutomation />
        </TabsContent>

        <TabsContent value="segmentation" className="space-y-4">
          <CustomerSegmentation />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <MarketingAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  )
}
