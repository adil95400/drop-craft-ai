import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Mail, Users, TrendingUp, Zap, Target, BarChart3 } from "lucide-react"
import { CampaignManager } from "./CampaignManager"
import { EmailAutomation } from "./EmailAutomation"
import { CustomerSegmentation } from "./CustomerSegmentation"
import { MarketingAnalytics } from "./MarketingAnalytics"

export const MarketingDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Marketing Automation</h1>
        <p className="text-muted-foreground mt-2">
          Automatisez vos campagnes marketing avec l'IA
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Campagnes actives</p>
              <p className="text-2xl font-bold">8</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-secondary/10 rounded-lg">
              <Users className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Taux d'ouverture</p>
              <p className="text-2xl font-bold">34.2%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Conversions</p>
              <p className="text-2xl font-bold">142</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <Zap className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ROI moyen</p>
              <p className="text-2xl font-bold">328%</p>
            </div>
          </div>
        </Card>
      </div>

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
