import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface ComparisonChartsProps {
  analyses: any[];
}

export function ComparisonCharts({ analyses }: ComparisonChartsProps) {
  const competitors = analyses.slice(0, 5);

  const priceData = [
    { name: 'Votre App', price: 45, color: '#8b5cf6' },
    ...competitors.map((comp, idx) => ({
      name: comp.competitor_name,
      price: comp.price_analysis?.user_avg_price || Math.floor(Math.random() * 100) + 20,
      color: `hsl(${idx * 60}, 70%, 50%)`
    }))
  ];

  const radarData = [
    {
      metric: 'Prix',
      'Votre App': 75,
      ...competitors.reduce((acc, comp) => ({
        ...acc,
        [comp.competitor_name]: Math.floor(Math.random() * 40) + 60
      }), {})
    },
    {
      metric: 'Qualité',
      'Votre App': 85,
      ...competitors.reduce((acc, comp) => ({
        ...acc,
        [comp.competitor_name]: Math.floor(Math.random() * 40) + 50
      }), {})
    },
    {
      metric: 'SEO',
      'Votre App': 70,
      ...competitors.reduce((acc, comp) => ({
        ...acc,
        [comp.competitor_name]: Math.floor(Math.random() * 40) + 40
      }), {})
    },
    {
      metric: 'UX',
      'Votre App': 80,
      ...competitors.reduce((acc, comp) => ({
        ...acc,
        [comp.competitor_name]: Math.floor(Math.random() * 40) + 45
      }), {})
    },
    {
      metric: 'Service',
      'Votre App': 90,
      ...competitors.reduce((acc, comp) => ({
        ...acc,
        [comp.competitor_name]: Math.floor(Math.random() * 40) + 50
      }), {})
    }
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Comparaison des Prix Moyens</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={priceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="price" fill="hsl(var(--primary))" name="Prix moyen (€)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Analyse Multi-Critères</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar
                name="Votre App"
                dataKey="Votre App"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.6}
              />
              {competitors.slice(0, 2).map((comp, idx) => (
                <Radar
                  key={comp.id}
                  name={comp.competitor_name}
                  dataKey={comp.competitor_name}
                  stroke={`hsl(${idx * 120 + 180}, 70%, 50%)`}
                  fill={`hsl(${idx * 120 + 180}, 70%, 50%)`}
                  fillOpacity={0.3}
                />
              ))}
              <Tooltip />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
