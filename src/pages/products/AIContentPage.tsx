/**
 * Page de génération de contenu IA - Style Channable Premium
 */

import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { AIContentDashboard } from '@/components/ai-content';
import { Button } from '@/components/ui/button';
import { Sparkles, Download, Settings } from 'lucide-react';

export default function AIContentPage() {
  return (
    <ChannablePageWrapper
      title="Génération de contenu IA"
      subtitle="Automatisation créative"
      description="Créez des descriptions, titres et contenus SEO automatiquement avec l'intelligence artificielle"
      heroImage="products"
      badge={{ label: 'IA Pro', icon: Sparkles }}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-background/80 backdrop-blur-sm">
            <Settings className="h-4 w-4" />
            Templates
          </Button>
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
        </div>
      }
    >
      <AIContentDashboard />
    </ChannablePageWrapper>
  );
}
