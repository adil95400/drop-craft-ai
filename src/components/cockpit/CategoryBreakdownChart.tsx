/**
 * Graphique de répartition par catégorie pour le Cockpit
 */
import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { BarChart3 } from 'lucide-react'
import { UnifiedProduct } from '@/hooks/unified/useProductsUnified'

const COLORS = [
  'hsl(var(--primary))',
  'hsl(210, 70%, 55%)',
  'hsl(150, 60%, 45%)',
  'hsl(40, 90%, 55%)',
  'hsl(0, 70%, 55%)',
  'hsl(270, 60%, 55%)',
  'hsl(180, 50%, 45%)',
  'hsl(330, 60%, 50%)',
]

interface CategoryBreakdownChartProps {
  products: UnifiedProduct[]
}

export function CategoryBreakdownChart({ products }: CategoryBreakdownChartProps) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {}
    products.forEach(p => {
      const cat = p.category || 'Sans catégorie'
      counts[cat] = (counts[cat] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [products])

  if (data.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Répartition par catégorie
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              dataKey="value"
              paddingAngle={2}
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
              formatter={(value: number) => [`${value} produits`, '']}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => <span className="text-xs">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
