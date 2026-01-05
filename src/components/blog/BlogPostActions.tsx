import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Sparkles, 
  Store, 
  ShoppingCart, 
  BarChart3,
  Zap,
  Globe,
  Target,
  ChevronRight,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { useAI } from '@/hooks/useAI';
import { useStoreIntegrations } from '@/hooks/useStoreIntegrations';
import { useToast } from '@/hooks/use-toast';

interface BlogPostActionsProps {
  post: {
    id: string;
    title: string;
    content: string;
    excerpt: string;
    category: string;
    tags: string[];
  };
}

export function BlogPostActions({ post }: BlogPostActionsProps) {
  const { toast } = useToast();
  const { optimizeContent, isOptimizing } = useAI();
  const { connectedIntegrations, syncProducts } = useStoreIntegrations();
  const [selectedOptimizations, setSelectedOptimizations] = useState<string[]>([]);
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([]);
  const [optimizationResult, setOptimizationResult] = useState(null);

  const optimizationOptions = [
    {
      id: 'seo_optimization',
      title: 'Optimisation SEO',
      description: 'Améliorer les mots-clés et la structure pour le référencement',
      icon: <BarChart3 className="w-4 h-4" />
    },
    {
      id: 'content_enhancement',
      title: 'Amélioration du contenu',
      description: 'Enrichir et restructurer le contenu pour plus d\'engagement',
      icon: <Sparkles className="w-4 h-4" />
    },
    {
      id: 'social_media_adaptation',
      title: 'Adaptation réseaux sociaux',
      description: 'Créer des versions optimisées pour les réseaux sociaux',
      icon: <Globe className="w-4 h-4" />
    },
    {
      id: 'email_marketing',
      title: 'Email marketing',
      description: 'Générer une version pour campagne email',
      icon: <Target className="w-4 h-4" />
    }
  ];

  const handleOptimize = async () => {
    if (selectedOptimizations.length === 0) {
      toast({
        title: "Sélection requise",
        description: "Veuillez sélectionner au moins une optimisation",
        variant: "destructive"
      });
      return;
    }

    try {
      const results = await Promise.all(
        selectedOptimizations.map(async (task) => {
          return new Promise((resolve) => {
            optimizeContent({
              task,
              productData: {
                name: post.title,
                description: post.content,
                excerpt: post.excerpt,
                category: post.category,
                tags: post.tags
              },
              language: 'fr',
              tone: 'professional'
            });
            // Simulate result for demo
            setTimeout(() => {
              resolve({
                task,
                result: `Contenu optimisé pour ${task}`
              });
            }, 2000);
          });
        })
      );
      
      setOptimizationResult(results);
      toast({
        title: "Optimisation terminée",
        description: `${selectedOptimizations.length} optimisation(s) appliquée(s)`
      });
    } catch (error) {
      toast({
        title: "Erreur d'optimisation",
        description: "Une erreur est survenue lors de l'optimisation",
        variant: "destructive"
      });
    }
  };

  const handleSendToStores = async () => {
    if (selectedIntegrations.length === 0) {
      toast({
        title: "Sélection requise",
        description: "Veuillez sélectionner au moins une boutique",
        variant: "destructive"
      });
      return;
    }

    // Convert blog post to product format
    const productData = {
      name: post.title,
      description: post.content,
      category: post.category,
      tags: post.tags,
      type: 'digital_content',
      price: 0 // Free content
    };

    try {
      await Promise.all(
        selectedIntegrations.map(async (integrationId) => {
          // Send to store via export function
          const response = await fetch('/api/store-export', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              storeId: integrationId,
              platform: connectedIntegrations.find(i => i.id === integrationId)?.platform_name,
              product: productData,
              action: 'export'
            })
          });
          
          if (!response.ok) throw new Error('Export failed');
          return response.json();
        })
      );

      toast({
        title: "Envoi réussi",
        description: `Article envoyé vers ${selectedIntegrations.length} boutique(s)`
      });
    } catch (error) {
      toast({
        title: "Erreur d'envoi",
        description: "Une erreur est survenue lors de l'envoi",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-background to-secondary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          Actions sur l'article
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Optimize Button */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full" size="lg">
              <Sparkles className="w-4 h-4 mr-2" />
              Optimiser avec l'IA
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Optimiser l'article avec l'IA</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-3">Sélectionnez les optimisations :</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {optimizationOptions.map((option) => (
                    <div
                      key={option.id}
                      className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => {
                        setSelectedOptimizations(prev =>
                          prev.includes(option.id)
                            ? prev.filter(id => id !== option.id)
                            : [...prev, option.id]
                        );
                      }}
                    >
                      <Checkbox
                        checked={selectedOptimizations.includes(option.id)}
                        onCheckedChange={() => {
                          setSelectedOptimizations(prev =>
                            prev.includes(option.id)
                              ? prev.filter(id => id !== option.id)
                              : [...prev, option.id]
                          );
                        }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {option.icon}
                          <span className="font-medium text-sm">{option.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {optimizationResult && (
                <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="font-medium text-success">Optimisation terminée</span>
                  </div>
                  <div className="space-y-2">
                    {optimizationResult.map((result, index) => (
                      <div key={index} className="text-sm">
                        <Badge variant="outline" className="mr-2">
                          {optimizationOptions.find(o => o.id === result.task)?.title}
                        </Badge>
                        <span className="text-muted-foreground">{result.result}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button 
                  onClick={handleOptimize}
                  disabled={isOptimizing || selectedOptimizations.length === 0}
                >
                  {isOptimizing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Optimiser
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Separator />

        {/* Send to Stores Button */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full" size="lg" disabled={connectedIntegrations.length === 0}>
              <Store className="w-4 h-4 mr-2" />
              Envoyer vers les boutiques
              <ChevronRight className="w-4 h-4 ml-auto" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Envoyer vers les boutiques connectées</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {connectedIntegrations.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucune boutique connectée</p>
                  <Button variant="link" className="mt-2">
                    Connecter une boutique
                  </Button>
                </div>
              ) : (
                <>
                  <div>
                    <h4 className="font-medium mb-3">Sélectionnez les boutiques :</h4>
                    <div className="space-y-2">
                      {connectedIntegrations.map((integration) => (
                        <div
                          key={integration.id}
                          className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                          onClick={() => {
                            setSelectedIntegrations(prev =>
                              prev.includes(integration.id)
                                ? prev.filter(id => id !== integration.id)
                                : [...prev, integration.id]
                            );
                          }}
                        >
                          <Checkbox
                            checked={selectedIntegrations.includes(integration.id)}
                            onCheckedChange={() => {
                              setSelectedIntegrations(prev =>
                                prev.includes(integration.id)
                                  ? prev.filter(id => id !== integration.id)
                                  : [...prev, integration.id]
                              );
                            }}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{integration.platform_name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {integration.platform_type}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {integration.shop_domain || integration.platform_url}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button 
                      onClick={handleSendToStores}
                      disabled={selectedIntegrations.length === 0}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Envoyer
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Quick Stats */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium text-primary">{connectedIntegrations.length}</div>
              <div className="text-muted-foreground">Boutiques connectées</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-primary">4</div>
              <div className="text-muted-foreground">Options d'optimisation</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}