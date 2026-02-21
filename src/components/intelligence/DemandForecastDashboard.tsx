/**
 * P2-1: Dashboard de prévisions de demande
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Brain, BarChart3, Sparkles } from 'lucide-react';
import { useDemandForecasts } from '@/hooks/useDemandForecasts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

export function DemandForecastDashboard() {
  const { forecasts, isLoading, generateForecast, isGenerating } = useDemandForecasts();

  const realisticForecasts = forecasts.filter(f => f.scenario === 'realistic');
  const avgConfidence = realisticForecasts.length
    ? Math.round(realisticForecasts.reduce((s, f) => s + f.confidence_score, 0) / realisticForecasts.length * 100)
    : 0;
  const totalDemand = realisticForecasts.reduce((s, f) => s + f.predicted_demand, 0);
  const trendUp = realisticForecasts.filter(f => f.trend_direction === 'up').length;

  const chartData = realisticForecasts.slice(0, 15).map(f => ({
    name: f.product_id?.slice(0, 8) || '?',
    demand: f.predicted_demand,
    confidence: f.confidence_score * 100,
    trend: f.trend_direction,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: 'Prévisions générées', value: realisticForecasts.length, icon: BarChart3, color: 'text-primary' },
          { title: 'Demande totale (30j)', value: totalDemand, icon: Sparkles, color: 'text-amber-500' },
          { title: 'Confiance moyenne', value: `${avgConfidence}%`, icon: Brain, color: 'text-primary' },
          { title: 'Tendance haussière', value: trendUp, icon: TrendingUp, color: 'text-primary' },
        ].map((s, i) => (
          <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{s.title}</p>
                    <p className="text-2xl font-bold mt-1">{s.value}</p>
                  </div>
                  <s.icon className={`h-8 w-8 ${s.color} opacity-70`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Prévisions de demande par produit</CardTitle>
          <CardDescription>Demande estimée sur 30 jours (scénario réaliste)</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                <YAxis className="text-xs fill-muted-foreground" />
                <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--popover-foreground))' }} />
                <Bar dataKey="demand" name="Demande prévue" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.trend === 'up' ? 'hsl(var(--primary))' : entry.trend === 'down' ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))'} fillOpacity={0.7} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune prévision générée</p>
                <p className="text-xs mt-1">Lancez l'analyse depuis la page produit</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {realisticForecasts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Détail des prévisions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto max-h-[400px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background border-b">
                  <tr>
                    <th className="text-left p-2 font-medium text-muted-foreground">Produit</th>
                    <th className="text-right p-2 font-medium text-muted-foreground">Demande 30j</th>
                    <th className="text-right p-2 font-medium text-muted-foreground">Confiance</th>
                    <th className="text-center p-2 font-medium text-muted-foreground">Tendance</th>
                    <th className="text-right p-2 font-medium text-muted-foreground">Saisonnalité</th>
                  </tr>
                </thead>
                <tbody>
                  {realisticForecasts.map(f => {
                    const TrendIcon = trendIcons[f.trend_direction];
                    return (
                      <tr key={f.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="p-2 font-mono text-xs">{f.product_id?.slice(0, 12)}...</td>
                        <td className="p-2 text-right font-bold">{f.predicted_demand}</td>
                        <td className="p-2 text-right">
                          <Badge variant={f.confidence_score > 0.7 ? 'default' : 'secondary'}>
                            {Math.round(f.confidence_score * 100)}%
                          </Badge>
                        </td>
                        <td className="p-2 text-center">
                          <TrendIcon className={`h-4 w-4 mx-auto ${f.trend_direction === 'up' ? 'text-primary' : f.trend_direction === 'down' ? 'text-destructive' : 'text-muted-foreground'}`} />
                        </td>
                        <td className="p-2 text-right">x{f.seasonality_factor.toFixed(1)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
