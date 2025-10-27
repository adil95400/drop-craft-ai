import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, AlertTriangle, FileText, Target, Search, Zap, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSEOOptimization } from "@/hooks/useSEOOptimization";

interface PageData {
  url: string;
  score: number;
  issues: number;
  status: 'good' | 'warning' | 'error';
}

interface SEOPageOptimizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  page: PageData | null;
}

export const SEOPageOptimizationModal = ({ 
  open, 
  onOpenChange, 
  page 
}: SEOPageOptimizationModalProps) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedTitle, setOptimizedTitle] = useState('');
  const [optimizedDescription, setOptimizedDescription] = useState('');
  const { toast } = useToast();
  const { startOptimization, isOptimizing: isApplying } = useSEOOptimization();

  if (!page) return null;

  const getPageAnalysis = (url: string) => {
    const analyses = {
      '/products': {
        currentTitle: 'Produits - Drop Craft AI',
        currentDescription: 'Découvrez notre catalogue de produits',
        issues: [
          { type: 'warning', title: 'Titre trop court', description: 'Le titre fait seulement 23 caractères' },
          { type: 'error', title: 'Meta description manquante', description: 'Aucune meta description optimisée' }
        ],
        keywords: ['produits', 'catalogue', 'e-commerce'],
        competitors: ['amazon.fr', 'cdiscount.com', 'fnac.com']
      },
      '/suppliers': {
        currentTitle: 'Fournisseurs - Drop Craft AI',
        currentDescription: 'Connectez-vous avec nos fournisseurs partenaires',
        issues: [
          { type: 'warning', title: 'Meta description trop courte', description: 'La description fait seulement 45 caractères' },
          { type: 'warning', title: 'Mots-clés manquants', description: 'Peu de mots-clés stratégiques dans le contenu' }
        ],
        keywords: ['fournisseurs', 'grossistes', 'dropshipping'],
        competitors: ['alibaba.com', 'made-in-china.com']
      },
      '/analytics': {
        currentTitle: 'Analytics - Tableau de bord',
        currentDescription: 'Suivez vos performances avec nos outils d\'analyse',
        issues: [
          { type: 'error', title: 'H1 manquant', description: 'Aucune balise H1 détectée sur la page' }
        ],
        keywords: ['analytics', 'statistiques', 'performance'],
        competitors: ['google.com/analytics', 'mixpanel.com']
      },
      '/automation': {
        currentTitle: 'Automation - Drop Craft AI',
        currentDescription: 'Automatisez vos processus business avec l\'IA',
        issues: [
          { type: 'warning', title: 'Images sans alt', description: '3 images sans attribut alt détectées' },
          { type: 'warning', title: 'Liens internes insuffisants', description: 'Seulement 2 liens internes trouvés' }
        ],
        keywords: ['automation', 'intelligence artificielle', 'processus'],
        competitors: ['zapier.com', 'make.com']
      }
    };
    
    return analyses[url as keyof typeof analyses] || analyses['/products'];
  };

  const pageAnalysis = getPageAnalysis(page.url);

  const handleOptimize = async () => {
    setIsOptimizing(true);
    
    // Simulation de l'optimisation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Génération d'optimisations basées sur la page
    const optimizations = {
      '/products': {
        title: 'Catalogue Produits E-commerce | Dropshipping & Grossistes | Drop Craft AI',
        description: 'Découvrez notre catalogue de +10 000 produits pour votre e-commerce. Connexion directe avec fournisseurs et grossistes vérifiés. Démarrez votre dropshipping maintenant!'
      },
      '/suppliers': {
        title: 'Fournisseurs Vérifiés & Grossistes Dropshipping | Drop Craft AI',
        description: 'Connectez-vous avec +500 fournisseurs et grossistes vérifiés. Trouvez les meilleurs partenaires pour votre business dropshipping. Catalogue mis à jour quotidiennement.'
      },
      '/analytics': {
        title: 'Analytics E-commerce | Tableau de Bord Performance | Drop Craft AI',
        description: 'Suivez vos ventes, analysez vos performances et optimisez votre ROI avec nos outils analytics avancés. Dashboard en temps réel pour votre business e-commerce.'
      },
      '/automation': {
        title: 'Automatisation IA E-commerce | Processus Automatisés | Drop Craft AI',
        description: 'Automatisez votre e-commerce avec l\'intelligence artificielle. Gestion des commandes, stock, pricing dynamique. Gagnez du temps et augmentez vos profits.'
      }
    };
    
    const pageOptimization = optimizations[page.url as keyof typeof optimizations] || optimizations['/products'];
    
    setOptimizedTitle(pageOptimization.title);
    setOptimizedDescription(pageOptimization.description);
    setIsOptimizing(false);
    
    toast({
      title: "Optimisation terminée",
      description: "Les suggestions SEO ont été générées avec succès"
    });
  };

  const handleApplyOptimizations = () => {
    const recommendations = [
      `Titre optimisé: ${optimizedTitle}`,
      `Meta description optimisée: ${optimizedDescription}`
    ];
    
    startOptimization({ 
      checkType: `page_${page.url}`,
      recommendations 
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Target className="h-6 w-6 text-primary" />
            Optimisation SEO - {page.url}
            <Badge variant={page.status === 'good' ? 'default' : 'secondary'}>
              Score: {page.score}/100
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Optimisez cette page pour améliorer son référencement naturel
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="analysis" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analysis">Analyse</TabsTrigger>
            <TabsTrigger value="optimization">Optimisation</TabsTrigger>
            <TabsTrigger value="preview">Aperçu</TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* État actuel */}
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  État actuel
                </h4>
                
                <div className="space-y-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <Label className="text-xs text-muted-foreground">TITRE ACTUEL</Label>
                    <p className="text-sm font-medium">{pageAnalysis.currentTitle}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {pageAnalysis.currentTitle.length} caractères
                    </p>
                  </div>
                  
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <Label className="text-xs text-muted-foreground">DESCRIPTION ACTUELLE</Label>
                    <p className="text-sm">{pageAnalysis.currentDescription}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {pageAnalysis.currentDescription.length} caractères
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Problèmes détectés */}
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Problèmes détectés ({page.issues})
                </h4>
                
                <div className="space-y-2">
                  {pageAnalysis.issues.map((issue, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 border rounded-lg">
                      {issue.type === 'error' ? (
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{issue.title}</p>
                        <p className="text-xs text-muted-foreground">{issue.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Mots-clés et concurrence */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-semibold">Mots-clés cibles</h4>
                <div className="flex flex-wrap gap-2">
                  {pageAnalysis.keywords.map((keyword, index) => (
                    <Badge key={index} variant="outline">{keyword}</Badge>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold">Principaux concurrents</h4>
                <div className="flex flex-wrap gap-2">
                  {pageAnalysis.competitors.map((competitor, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">{competitor}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="optimization" className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold">Génération d'optimisations IA</h4>
              <Button onClick={handleOptimize} disabled={isOptimizing}>
                {isOptimizing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Optimisation...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Optimiser avec IA
                  </>
                )}
              </Button>
            </div>
            
            {(optimizedTitle || optimizedDescription) && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre optimisé</Label>
                  <Input
                    id="title"
                    value={optimizedTitle}
                    onChange={(e) => setOptimizedTitle(e.target.value)}
                    placeholder="Titre SEO optimisé..."
                  />
                  <p className="text-xs text-muted-foreground">
                    {optimizedTitle.length}/60 caractères recommandés
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Meta description optimisée</Label>
                  <Textarea
                    id="description"
                    value={optimizedDescription}
                    onChange={(e) => setOptimizedDescription(e.target.value)}
                    placeholder="Meta description SEO optimisée..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    {optimizedDescription.length}/160 caractères recommandés
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="space-y-4">
              <h4 className="font-semibold">Aperçu dans les résultats Google</h4>
              
              {optimizedTitle && optimizedDescription ? (
                <div className="p-4 border rounded-lg bg-muted/20">
                  <div className="space-y-1">
                    <div className="text-blue-600 text-lg font-medium hover:underline cursor-pointer">
                      {optimizedTitle}
                    </div>
                    <div className="text-green-700 text-sm">
                      https://dropcraft.ai{page.url}
                    </div>
                    <div className="text-gray-600 text-sm leading-relaxed">
                      {optimizedDescription}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-2" />
                  <p>Générez d'abord les optimisations pour voir l'aperçu</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          {(optimizedTitle || optimizedDescription) && (
            <Button onClick={handleApplyOptimizations} disabled={isApplying}>
              <CheckCircle className="mr-2 h-4 w-4" />
              {isApplying ? 'Application...' : 'Appliquer les optimisations'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};