import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface ComparisonChartsProps {
  analyses: any[];
}

export function ComparisonCharts({ analyses }: ComparisonChartsProps) {
  const competitors = analyses.slice(0, 5);

  // Calculate user's average price from first analysis
  const userAvgPrice = analyses[0]?.price_analysis?.user_avg_price || 50;
  const marketAvgPrice = analyses[0]?.price_analysis?.market_avg_price || 60;

  const priceData = [
    { name: 'Votre App', price: userAvgPrice, color: '#8b5cf6' },
    ...competitors.map((comp, idx) => ({
      name: comp.competitor_name,
      price: comp.price_analysis?.market_avg_price || comp.price_analysis?.avg_price || marketAvgPrice,
      color: `hsl(${idx * 60}, 70%, 50%)`
    }))
  ];

  // Calculate radar scores from competitive data
  const calculateScore = (data: any, key: string, defaultValue: number = 70) => {
    if (data?.competitive_data?.[key]) return data.competitive_data[key];
    if (data?.price_analysis?.competitiveness) return data.price_analysis.competitiveness;
    return defaultValue;
  };

  const radarData = [
    {
      metric: 'Prix',
      'Votre App': 100 - ((userAvgPrice / marketAvgPrice) * 100 - 100),
      ...competitors.slice(0, 2).reduce((acc, comp) => ({
        ...acc,
        [comp.competitor_name]: calculateScore(comp, 'price_score', 60)
      }), {})
    },
    {
      metric: 'Qualité',
      'Votre App': analyses[0]?.competitive_data?.quality_score || 85,
      ...competitors.slice(0, 2).reduce((acc, comp) => ({
        ...acc,
        [comp.competitor_name]: comp.competitive_data?.quality_score || 70
      }), {})
    },
    {
      metric: 'SEO',
      'Votre App': calculateScore(analyses[0], 'seo_score', 70),
      ...competitors.slice(0, 2).reduce((acc, comp) => ({
        ...acc,
        [comp.competitor_name]: calculateScore(comp, 'seo_score', 65)
      }), {})
    },
    {
      metric: 'UX',
      'Votre App': calculateScore(analyses[0], 'ux_score', 80),
      ...competitors.slice(0, 2).reduce((acc, comp) => ({
        ...acc,
        [comp.competitor_name]: calculateScore(comp, 'ux_score', 70)
      }), {})
    },
    {
      metric: 'Service',
      'Votre App': calculateScore(analyses[0], 'service_score', 90),
      ...competitors.slice(0, 2).reduce((acc, comp) => ({
        ...acc,
        [comp.competitor_name]: calculateScore(comp, 'service_score', 75)
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
