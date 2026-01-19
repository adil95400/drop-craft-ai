/**
 * Page d'audit SEO des produits
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Search, TrendingUp, AlertCircle, CheckCircle2, RefreshCw, FileText, Globe, Link } from 'lucide-react';

export default function AuditSEOPage() {
  const seoMetrics = [
    { 
      label: 'Titres optimisés', 
      value: 78, 
      total: 100, 
      icon: FileText,
      description: '78% de vos titres respectent les bonnes pratiques SEO'
    },
    { 
      label: 'Meta descriptions', 
      value: 65, 
      total: 100, 
      icon: Globe,
      description: '35% de vos produits manquent de meta descriptions'
    },
    { 
      label: 'URLs optimisées', 
      value: 92, 
      total: 100, 
      icon: Link,
      description: '92% de vos URLs sont SEO-friendly'
    },
    { 
      label: 'Score global SEO', 
      value: 71, 
      total: 100, 
      icon: Search,
      description: 'Score moyen de référencement de votre catalogue'
    },
  ];

  const issues = [
    { 
      type: 'error', 
      title: 'Titres trop courts', 
      count: 24, 
      description: 'Les titres doivent contenir au moins 30 caractères' 
    },
    { 
      type: 'error', 
      title: 'Meta descriptions manquantes', 
      count: 35, 
      description: 'Ajoutez des descriptions pour améliorer le CTR' 
    },
    { 
      type: 'warning', 
      title: 'Mots-clés absents', 
      count: 18, 
      description: 'Certains produits n\'ont pas de mots-clés pertinents' 
    },
    { 
      type: 'warning', 
      title: 'Images sans alt text', 
      count: 12, 
      description: 'L\'attribut alt améliore l\'accessibilité et le SEO' 
    },
    { 
      type: 'info', 
      title: 'URLs non optimisées', 
      count: 8, 
      description: 'Utilisez des URLs lisibles avec des mots-clés' 
    },
  ];

  return (
    <ChannablePageWrapper
      title="Audit SEO"
      description="Analysez et optimisez le référencement de vos produits"
      heroImage="analytics"
      badge={{ label: "SEO", icon: Search }}
      actions={
        <Button size="lg" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Lancer l'audit SEO
        </Button>
      }
    >
      {/* Barre de recherche */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher un produit à auditer..." className="pl-10" />
            </div>
            <Button>Analyser</Button>
          </div>
        </CardContent>
      </Card>

      {/* Métriques SEO */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {seoMetrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <metric.icon className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-sm">{metric.label}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className={`text-3xl font-bold ${
                  metric.value >= 80 ? 'text-green-600' : 
                  metric.value >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {metric.value}%
                </div>
                <div className="flex-1">
                  <Progress value={metric.value} className="h-2" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Problèmes détectés */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Problèmes Détectés</CardTitle>
              <CardDescription>Corrigez ces problèmes pour améliorer votre référencement</CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="destructive">{issues.filter(i => i.type === 'error').length} erreurs</Badge>
              <Badge variant="secondary">{issues.filter(i => i.type === 'warning').length} avertissements</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {issues.map((issue, index) => (
              <div 
                key={index}
                className={`flex items-center justify-between p-4 border rounded-lg ${
                  issue.type === 'error' ? 'border-red-200 bg-red-50 dark:bg-red-900/10' :
                  issue.type === 'warning' ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10' :
                  'border-blue-200 bg-blue-50 dark:bg-blue-900/10'
                }`}
              >
                <div className="flex items-center gap-4">
                  <AlertCircle className={`h-5 w-5 ${
                    issue.type === 'error' ? 'text-red-600' :
                    issue.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                  }`} />
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {issue.title}
                      <Badge variant="outline">{issue.count} produits</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{issue.description}</p>
                  </div>
                </div>
                <Button size="sm" variant={issue.type === 'error' ? 'destructive' : 'outline'}>
                  Corriger
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conseils SEO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Bonnes Pratiques SEO
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">Titres produits</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Entre 50 et 60 caractères idéalement</li>
                <li>• Inclure le nom du produit et la marque</li>
                <li>• Utiliser des mots-clés pertinents</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Descriptions</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Minimum 150-300 caractères</li>
                <li>• Structure avec les points clés en premier</li>
                <li>• Éviter le contenu dupliqué</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </ChannablePageWrapper>
  );
}
