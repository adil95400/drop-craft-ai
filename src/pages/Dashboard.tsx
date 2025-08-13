import { ProductionDashboard } from "@/components/dashboard/ProductionDashboard"
import { Separator } from "@/components/ui/separator"
export default function Dashboard() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Production Dashboard</h2>
        <div className="text-sm text-muted-foreground">
          Real data from Supabase database
        </div>
      </div>
      <Separator />
      
      <ProductionDashboard />
    </div>
  )
}
