import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, Image } from "lucide-react";
import { WinnerProduct } from "@/domains/winners/types";
import { useToast } from "@/hooks/use-toast";

interface WinnersExportToolsProps {
  products: WinnerProduct[];
}

export const WinnersExportTools = ({ products }: WinnersExportToolsProps) => {
  const { toast } = useToast();

  const exportToCSV = () => {
    if (products.length === 0) {
      toast({ title: "Aucun produit à exporter", variant: "destructive" });
      return;
    }

    const headers = ['Titre', 'Prix', 'Score', 'Demande', 'Avis', 'Note', 'Source', 'URL'];
    const rows = products.map(p => [
      p.title,
      p.price,
      p.trending_score,
      p.market_demand,
      p.reviews || 0,
      p.rating || 0,
      p.source,
      p.url
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `winners_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({ title: "✅ Export CSV réussi", description: `${products.length} produits exportés` });
  };

  const exportToJSON = () => {
    if (products.length === 0) {
      toast({ title: "Aucun produit à exporter", variant: "destructive" });
      return;
    }

    const dataStr = JSON.stringify(products, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `winners_${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    toast({ title: "✅ Export JSON réussi", description: `${products.length} produits exportés` });
  };

  const exportReport = () => {
    const avgScore = products.reduce((sum, p) => sum + p.trending_score, 0) / products.length;
    const avgPrice = products.reduce((sum, p) => sum + p.price, 0) / products.length;
    const topProducts = products.slice(0, 10);

    const report = `
RAPPORT D'ANALYSE WINNERS
Date: ${new Date().toLocaleDateString('fr-FR')}
=====================================

STATISTIQUES GLOBALES
-------------------------------------
Total de produits analysés: ${products.length}
Score moyen: ${avgScore.toFixed(1)}/100
Prix moyen: €${avgPrice.toFixed(2)}

TOP 10 PRODUITS
-------------------------------------
${topProducts.map((p, i) => `
${i + 1}. ${p.title}
   Score: ${p.trending_score}/100 | Prix: €${p.price}
   Source: ${p.source}
   URL: ${p.url}
`).join('\n')}

CATÉGORIES
-------------------------------------
${Object.entries(
  products.reduce((acc, p) => {
    const cat = p.category || 'Non catégorisé';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>)
).map(([cat, count]) => `${cat}: ${count} produits`).join('\n')}

RECOMMANDATIONS IA
-------------------------------------
- ${products.length > 50 ? 'Excellente opportunité' : 'Recherche plus approfondie nécessaire'}
- Focus sur les produits avec score > 80
- Analyser la concurrence avant import
`;

    const blob = new Blob([report], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rapport_winners_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();

    toast({ title: "📊 Rapport généré", description: "Rapport d'analyse complet" });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exporter ({products.length})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exporter en CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToJSON}>
          <FileText className="h-4 w-4 mr-2" />
          Exporter en JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportReport}>
          <FileText className="h-4 w-4 mr-2" />
          Générer Rapport
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
