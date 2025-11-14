import { Card } from '@/components/ui/card'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ProfitChartProps {
  data: Array<{
    date: string
    revenue: number
    expenses: number
    profit: number
  }>
}

export const RealTimeProfitChart = ({ data }: ProfitChartProps) => {
  return (
    <div className="space-y-6">
      {/* Profit Evolution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Évolution du Profit Net</h3>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => `${value}€`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
              formatter={(value: number) => [`${value.toFixed(2)} €`, 'Profit']}
            />
            <Area 
              type="monotone" 
              dataKey="profit" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              fill="url(#profitGradient)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Revenue vs Expenses */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Revenus vs Dépenses</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => `${value}€`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
              formatter={(value: number) => `${value.toFixed(2)} €`}
            />
            <Legend />
            <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenus" />
            <Bar dataKey="expenses" fill="hsl(var(--destructive))" name="Dépenses" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Daily Profit Trend */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Tendance Profit Quotidien</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => `${value}€`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
              formatter={(value: number) => [`${value.toFixed(2)} €`, 'Profit']}
            />
            <Line 
              type="monotone" 
              dataKey="profit" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--primary))', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
