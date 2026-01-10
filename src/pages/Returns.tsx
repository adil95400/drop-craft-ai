import { ReturnsDashboard } from "@/components/returns/ReturnsDashboard"
import { EnhancedReturnFlowWrapper } from "@/components/returns/EnhancedReturnFlowWrapper"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LayoutDashboard, ArrowLeftRight } from "lucide-react"

const Returns = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Gestion des Retours</h1>
        <p className="text-muted-foreground">
          Gérez les retours clients et suivez les RMA
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="flow" className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            Flux RMA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <ReturnsDashboard />
        </TabsContent>

        <TabsContent value="flow" className="mt-6">
          <EnhancedReturnFlowWrapper />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Returns
