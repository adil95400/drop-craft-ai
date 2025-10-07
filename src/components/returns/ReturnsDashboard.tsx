import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Package, RefreshCcw, TrendingUp, AlertCircle } from "lucide-react"
import { ReturnsManager } from "./ReturnsManager"
import { RefundAutomation } from "./RefundAutomation"
import { ReturnsAnalytics } from "./ReturnsAnalytics"

export const ReturnsDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Retours & Remboursements</h1>
        <p className="text-muted-foreground mt-2">
          Gérez les retours et automatisez les remboursements avec l'IA
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Retours en attente</p>
              <p className="text-2xl font-bold">12</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-secondary/10 rounded-lg">
              <RefreshCcw className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Remb. automatiques</p>
              <p className="text-2xl font-bold">87%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Temps moyen</p>
              <p className="text-2xl font-bold">2.3h</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-destructive/10 rounded-lg">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Révision manuelle</p>
              <p className="text-2xl font-bold">3</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="returns" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="returns">
            <Package className="w-4 h-4 mr-2" />
            Demandes de retour
          </TabsTrigger>
          <TabsTrigger value="automation">
            <RefreshCcw className="w-4 h-4 mr-2" />
            Automatisation
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="returns" className="space-y-4">
          <ReturnsManager />
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <RefundAutomation />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <ReturnsAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  )
}
