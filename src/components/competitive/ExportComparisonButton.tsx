import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileJson, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExportComparisonButtonProps {
  analyses: any[];
  comparisonResult?: any;
}

export function ExportComparisonButton({ analyses, comparisonResult }: ExportComparisonButtonProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const exportAsJSON = () => {
    setIsExporting(true);
    try {
      const exportData = {
        timestamp: new Date().toISOString(),
        analyses: analyses,
        comparison: comparisonResult,
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `competitive-analysis-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export réussi',
        description: 'Le rapport a été exporté en JSON',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'exporter le rapport',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsCSV = () => {
    setIsExporting(true);
    try {
      let csv = 'Concurrent,Position,Niveau de Menace,Score Qualité,Prix Moyen\n';
      
      analyses.forEach(analysis => {
        const row = [
          analysis.competitor_name,
          analysis.competitive_data?.market_position || 'N/A',
          analysis.threat_level || 'N/A',
          analysis.competitive_data?.quality_score || 'N/A',
          analysis.price_analysis?.user_avg_price || 'N/A',
        ].join(',');
        csv += row + '\n';
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `competitive-analysis-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export réussi',
        description: 'Le rapport a été exporté en CSV',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'exporter le rapport',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsMarkdown = () => {
    setIsExporting(true);
    try {
      let markdown = '# Rapport d\'Analyse Concurrentielle\n\n';
      markdown += `**Date:** ${new Date().toLocaleDateString('fr-FR')}\n\n`;
      markdown += `## Analyses des Concurrents (${analyses.length})\n\n`;

      analyses.forEach((analysis, idx) => {
        markdown += `### ${idx + 1}. ${analysis.competitor_name}\n\n`;
        markdown += `- **Position:** ${analysis.competitive_data?.market_position || 'N/A'}\n`;
        markdown += `- **Niveau de Menace:** ${analysis.threat_level || 'N/A'}\n`;
        markdown += `- **Score Qualité:** ${analysis.competitive_data?.quality_score || 'N/A'}/100\n`;
        markdown += `- **Prix Moyen:** ${analysis.price_analysis?.user_avg_price || 'N/A'}€\n\n`;
        
        if (analysis.competitive_data?.differentiation_factors?.length > 0) {
          markdown += `**Facteurs de Différenciation:**\n`;
          analysis.competitive_data.differentiation_factors.forEach((factor: string) => {
            markdown += `- ${factor}\n`;
          });
          markdown += '\n';
        }
      });

      if (comparisonResult?.comparison) {
        markdown += '\n## Analyse Comparative\n\n';
        if (comparisonResult.comparison.comparison_summary) {
          const summary = comparisonResult.comparison.comparison_summary;
          markdown += `- **Leader du Marché:** ${summary.market_leader || 'N/A'}\n`;
          markdown += `- **Leader Prix:** ${summary.price_leader || 'N/A'}\n`;
          markdown += `- **Leader Qualité:** ${summary.quality_leader || 'N/A'}\n\n`;
        }
      }

      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `competitive-analysis-${Date.now()}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export réussi',
        description: 'Le rapport a été exporté en Markdown',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'exporter le rapport',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={isExporting}>
          <Download className="w-4 h-4" />
          {isExporting ? 'Export en cours...' : 'Exporter'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Format d'export</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportAsJSON} className="gap-2">
          <FileJson className="w-4 h-4" />
          JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsCSV} className="gap-2">
          <FileSpreadsheet className="w-4 h-4" />
          CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsMarkdown} className="gap-2">
          <FileText className="w-4 h-4" />
          Markdown
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
