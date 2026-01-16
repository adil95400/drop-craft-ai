/**
 * Page Analytics Données Réelles avec design Channable premium
 */
import React from 'react';
import { RealDataAnalyticsDashboard } from '@/components/analytics';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Button } from '@/components/ui/button';
import { TrendingUp, Download, RefreshCw, Sparkles, Calendar } from 'lucide-react';

export default function RealDataAnalyticsPage() {
  return (
    <ChannablePageWrapper
      title="Analytics en Temps Réel"
      subtitle="Données Live"
      description="Tableau de bord analytique avec données réelles de votre boutique, mise à jour en temps réel"
      heroImage="analytics"
      badge={{
        label: 'Temps réel',
        icon: Sparkles
      }}
      actions={
        <>
          <Button className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
            <TrendingUp className="h-4 w-4" />
            Générer insights
          </Button>
          <Button variant="outline" className="gap-2 backdrop-blur-sm bg-background/50">
            <Calendar className="h-4 w-4" />
            Période
          </Button>
          <Button variant="outline" className="gap-2 backdrop-blur-sm bg-background/50">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
        </>
      }
    >
      <RealDataAnalyticsDashboard />
    </ChannablePageWrapper>
  );
}
