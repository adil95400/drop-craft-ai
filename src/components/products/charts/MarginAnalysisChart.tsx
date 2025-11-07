import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ZAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface MarginData {
  name: string
  price: number
  margin: number
  stock: number
}

interface MarginAnalysisChartProps {
  data: MarginData[]
}

export function MarginAnalysisChart({ data }: MarginAnalysisChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="rounded-lg border bg-background p-3 shadow-sm">
          <p className="font-medium mb-2">{data.name}</p>
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Prix:</span>
              <span className="font-medium">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(data.price)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Marge:</span>
              <span className="font-medium">{data.margin.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Stock:</span>
              <span className="font-medium">{data.stock} unités</span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analyse Prix vs Marge</CardTitle>
        <CardDescription>
          Positionnement des produits selon leur prix et leur marge bénéficiaire
          <br />
          <span className="text-xs">La taille des bulles représente le stock disponible</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              type="number" 
              dataKey="price" 
              name="Prix"
              unit="€"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              type="number" 
              dataKey="margin" 
              name="Marge"
              unit="%"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <ZAxis type="number" dataKey="stock" range={[50, 400]} name="Stock" />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <Legend />
            <Scatter 
              name="Produits" 
              data={data} 
              fill="hsl(var(--chart-4))"
              fillOpacity={0.6}
            />
          </ScatterChart>
        </ResponsiveContainer>
        
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="font-medium mb-1">Zone optimale</p>
            <p className="text-xs text-muted-foreground">
              Marge &gt; 30% et prix élevé
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="font-medium mb-1">À optimiser</p>
            <p className="text-xs text-muted-foreground">
              Marge &lt; 20% ou stock excessif
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
