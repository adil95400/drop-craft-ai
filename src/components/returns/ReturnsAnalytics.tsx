import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Card } from "@/components/ui/card"
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { TrendingUp, DollarSign, Clock, Percent } from "lucide-react"

export const ReturnsAnalytics = () => {
  const { data: analytics } = useQuery({
    queryKey: ['returns-analytics'],
    queryFn: async () => {
      const { data: returns, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('action', 'return_request')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      const total = returns?.length || 0
      const approved = returns?.filter(r => {
        const meta = r.metadata as any || {}
        return meta.status === 'approved'
      }).length || 0
      const rejected = returns?.filter(r => {
        const meta = r.metadata as any || {}
        return meta.status === 'rejected'
      }).length || 0
      const pending = returns?.filter(r => {
        const meta = r.metadata as any || {}
        return meta.status === 'pending'
      }).length || 0

      const totalRefunded = returns?.reduce((sum, r) => {
        const meta = r.metadata as any || {}
        return sum + (meta.refund_amount || 0)
      }, 0) || 0
      
      const reasonsData = returns?.reduce((acc: any, r) => {
        const meta = r.metadata as any || {}
        const reason = meta.reason || 'Non spécifié'
        acc[reason] = (acc[reason] || 0) + 1
        return acc
      }, {})

      const monthlyData = returns?.reduce((acc: any, r) => {
        const month = new Date(r.created_at).toLocaleDateString('fr-FR', { month: 'short' })
        if (!acc[month]) {
          acc[month] = { month, count: 0, amount: 0 }
        }
        acc[month].count++
        const meta = r.metadata as any || {}
        acc[month].amount += meta.refund_amount || 0
        return acc
      }, {})

      return {
        total_returns: total,
        approved_count: approved,
        rejected_count: rejected,
        pending_count: pending,
        approval_rate: total > 0 ? (approved / total) * 100 : 0,
        total_refunded: totalRefunded,
        avg_refund: total > 0 ? totalRefunded / total : 0,
        reasons: Object.entries(reasonsData || {}).map(([name, value]) => ({ name, value })),
        monthly: Object.values(monthlyData || {}),
        status_distribution: [
          { name: 'Approuvés', value: approved, color: '#10b981' },
          { name: 'Rejetés', value: rejected, color: '#ef4444' },
          { name: 'En attente', value: pending, color: '#f59e0b' }
        ]
      }
    }
  })

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total retours</p>
              <p className="text-2xl font-bold">{analytics?.total_returns || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-secondary/10 rounded-lg">
              <Percent className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Taux d'approbation</p>
              <p className="text-2xl font-bold">{analytics?.approval_rate.toFixed(1) || 0}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent/10 rounded-lg">
              <DollarSign className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Montant remboursé</p>
              <p className="text-2xl font-bold">{analytics?.total_refunded.toFixed(0) || 0}€</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <Clock className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Remb. moyen</p>
              <p className="text-2xl font-bold">{analytics?.avg_refund.toFixed(0) || 0}€</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Évolution mensuelle</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics?.monthly || []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" name="Nombre" strokeWidth={2} />
              <Line type="monotone" dataKey="amount" stroke="hsl(var(--secondary))" name="Montant (€)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Distribution des statuts</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics?.status_distribution || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="hsl(var(--primary))"
                dataKey="value"
              >
                {analytics?.status_distribution?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 md:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Raisons des retours</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics?.reasons || []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}
