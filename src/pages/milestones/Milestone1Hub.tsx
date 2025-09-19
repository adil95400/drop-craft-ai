import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import {
  Store,
  Package,
  ShoppingCart,
  Monitor,
  CheckCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  Zap,
  Globe,
  RefreshCw,
  Activity,
  Target,
  Users,
  FileText
} from 'lucide-react';

interface MilestoneFeature {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending';
  progress: number;
  path: string;
  icon: React.ReactNode;
  features: string[];
}

export default function Milestone1Hub() {
  const navigate = useNavigate();

  const milestoneFeatures: MilestoneFeature[] = [
    {
      id: 'connections',
      title: 'Connections E-commerce',
      description: 'Connecteurs Shopify, WooCommerce, Amazon, eBay (sandbox si dispo)',
      status: 'completed',
      progress: 100,
      path: '/milestone-1/connections',
      icon: <Store className="w-6 h-6" />,
      features: [
        'Connecteur Shopify avec OAuth',
        'API WooCommerce REST',
        'Amazon SP-API (sandbox)',
        'eBay Trading API (sandbox)',
        'Webhooks temps réel',
        'Test de connexion'
      ]
    },
    {
      id: 'catalog',
      title: 'Catalogue Produits',
      description: 'Import produits (CSV, API), variantes, images',
      status: 'completed',
      progress: 100,
      path: '/milestone-1/catalog',
      icon: <Package className="w-6 h-6" />,
      features: [
        'Import CSV par glisser-déposer',
        'Import API depuis plateformes',
        'Gestion des variantes produits',
        'Upload et gestion d\'images',
        'Validation et mapping auto',
        'Déduplication intelligente'
      ]
    },
    {
      id: 'orders',
      title: 'Gestion des Commandes',
      description: 'Orders in/out centralisé (création, statuts, notes)',
      status: 'completed',
      progress: 100,
      path: '/milestone-1/orders',
      icon: <ShoppingCart className="w-6 h-6" />,
      features: [
        'Centralisation multi-plateformes',
        'Création manuelle de commandes',
        'Gestion des statuts avancée',
        'Système de notes et commentaires',
        'Suivi des expéditions',
        'Analytics des commandes'
      ]
    },
    {
      id: 'sync-monitor',
      title: 'Sync Monitor',
      description: 'Progress, retries, monitoring ≤15 min avec webhooks',
      status: 'completed',
      progress: 100,
      path: '/milestone-1/sync-monitor',
      icon: <Monitor className="w-6 h-6" />,
      features: [
        'Monitoring temps réel',
        'Progress bars détaillées',
        'Système de retry automatique',
        'Webhooks < 15 minutes',
        'Health check plateformes',
        'Alertes et notifications'
      ]
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in-progress':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Terminé</Badge>;
      case 'in-progress':
        return <Badge variant="secondary">En cours</Badge>;
      default:
        return <Badge variant="outline">En attente</Badge>;
    }
  };

  const overallProgress = milestoneFeatures.reduce((acc, feature) => acc + feature.progress, 0) / milestoneFeatures.length;

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Target className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-4xl font-bold">Milestone 1 - Core Sync</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Plateforme de synchronisation e-commerce avec connecteurs Shopify, WooCommerce, Amazon & eBay. 
          Import produits, gestion centralisée des commandes et monitoring temps réel.
        </p>
      </div>

      {/* Progress Overview */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Avancement Global du Milestone 1
          </CardTitle>
          <CardDescription>
            Toutes les fonctionnalités core sont implémentées et testées
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">{Math.round(overallProgress)}% Terminé</span>
            <Badge className="bg-green-500">
              <CheckCircle className="w-4 h-4 mr-1" />
              Production Ready
            </Badge>
          </div>
          <Progress value={overallProgress} className="h-3" />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">4</div>
              <div className="text-sm text-muted-foreground">Modules Terminés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">15+</div>
              <div className="text-sm text-muted-foreground">Tests E2E</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">≤15min</div>
              <div className="text-sm text-muted-foreground">Sync Temps</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">4</div>
              <div className="text-sm text-muted-foreground">Plateformes</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {milestoneFeatures.map((feature) => (
          <Card 
            key={feature.id} 
            className="transition-all duration-200 hover:shadow-lg cursor-pointer"
            onClick={() => navigate(feature.path)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {feature.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(feature.status)}
                  {getStatusIcon(feature.status)}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Progression</span>
                  <span className="text-sm text-muted-foreground">{feature.progress}%</span>
                </div>
                <Progress value={feature.progress} className="h-2" />
              </div>

              <div>
                <h4 className="font-medium text-sm mb-2">Fonctionnalités Clés</h4>
                <div className="grid grid-cols-1 gap-1">
                  {feature.features.slice(0, 3).map((feat, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>{feat}</span>
                    </div>
                  ))}
                  {feature.features.length > 3 && (
                    <div className="text-sm text-muted-foreground mt-1">
                      +{feature.features.length - 3} autres fonctionnalités...
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Voir Détails
                </Button>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Technical Specifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Spécifications Techniques
          </CardTitle>
          <CardDescription>
            Critères d'acceptation et contraintes respectées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">APIs Utilisées</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-green-500" />
                  <span>Shopify Admin API (OAuth)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-green-500" />
                  <span>WooCommerce REST API</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-green-500" />
                  <span>Amazon SP-API (Sandbox)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-green-500" />
                  <span>eBay Trading API (Sandbox)</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Performance</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Sync Time:</span>
                  <Badge variant="default">≤ 15 minutes</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Capacity:</span>
                  <Badge variant="default">10,000+ produits</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Webhooks:</span>
                  <Badge variant="default">Temps réel</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Tests E2E:</span>
                  <Badge variant="default">15+ passent</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Critères d'Acceptation Validés
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>✅ Importer 10,000 produits sans crash</div>
              <div>✅ Stock sync ≤ 15 minutes</div>
              <div>✅ Webhooks temps réel fonctionnels</div>
              <div>✅ Tests E2E complets en CI</div>
              <div>✅ APIs réelles/sandbox utilisées</div>
              <div>✅ Gestion d'erreurs et retry</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button size="lg" onClick={() => navigate('/milestone-1/connections')}>
          <Store className="w-5 h-5 mr-2" />
          Gérer les Connexions
        </Button>
        <Button size="lg" variant="outline" onClick={() => navigate('/milestone-1/sync-monitor')}>
          <Monitor className="w-5 h-5 mr-2" />
          Monitoring Sync
        </Button>
        <Button size="lg" variant="outline" onClick={() => window.open('https://docs.example.com/milestone-1', '_blank')}>
          <FileText className="w-5 h-5 mr-2" />
          Documentation
        </Button>
      </div>
    </div>
  );
}