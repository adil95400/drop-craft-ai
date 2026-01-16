/**
 * Page Catalogue Ultra Pro - Style Channable Premium
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Package, Zap, TrendingUp, Settings, Sparkles, Wand2, 
  BarChart3, Target, Upload, Download, RefreshCw, CheckCircle,
  AlertCircle, Brain, Layers, ArrowRight
} from 'lucide-react';

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  subtext, 
  color = 'primary',
  trend
}: { 
  icon: any; 
  label: string; 
  value: string | number; 
  subtext?: string;
  color?: string;
  trend?: { value: number; up: boolean };
}) => {
  const colorClasses = {
    primary: 'from-primary/20 to-primary/5 text-primary',
    success: 'from-emerald-500/20 to-emerald-500/5 text-emerald-600',
    warning: 'from-amber-500/20 to-amber-500/5 text-amber-600',
    destructive: 'from-red-500/20 to-red-500/5 text-red-600',
    info: 'from-blue-500/20 to-blue-500/5 text-blue-600',
    purple: 'from-purple-500/20 to-purple-500/5 text-purple-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="relative overflow-hidden border-border/50 hover:shadow-lg transition-all">
        <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses] || colorClasses.primary} opacity-50`} />
        <CardContent className="relative p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <p className="text-3xl font-bold">{value}</p>
              {subtext && (
                <p className="text-xs text-muted-foreground">{subtext}</p>
              )}
              {trend && (
                <div className={`flex items-center gap-1 text-xs ${trend.up ? 'text-emerald-600' : 'text-red-600'}`}>
                  <TrendingUp className={`h-3 w-3 ${!trend.up && 'rotate-180'}`} />
                  <span>{trend.value}%</span>
                </div>
              )}
            </div>
            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses] || colorClasses.primary} flex items-center justify-center`}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ActionCard = ({
  icon: Icon,
  title,
  description,
  buttonLabel,
  onClick,
  variant = 'default'
}: {
  icon: any;
  title: string;
  description: string;
  buttonLabel: string;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'success';
}) => {
  const variants = {
    default: 'border-border/50 hover:border-primary/30',
    primary: 'border-primary/30 bg-primary/5',
    success: 'border-emerald-500/30 bg-emerald-500/5'
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`h-full ${variants[variant]} transition-all hover:shadow-md`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <CardDescription className="text-sm">{description}</CardDescription>
          <Button 
            onClick={onClick} 
            className="w-full gap-2"
            variant={variant === 'primary' ? 'default' : 'outline'}
          >
            {buttonLabel}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function AdvancedProductsPage() {
  const [activeTab, setActiveTab] = useState('bulk');

  const stats = {
    totalProducts: 1247,
    optimized: 892,
    pending: 355,
    aiScore: 78
  };

  return (
    <ChannablePageWrapper
      title="Catalogue Ultra Pro"
      subtitle="Gestion avancée"
      description="Gestion intelligente avec optimisations IA et opérations en masse sur vos produits"
      heroImage="products"
      badge={{ label: 'Pro', icon: Zap }}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-background/80 backdrop-blur-sm">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
          <Button className="gap-2">
            <Sparkles className="h-4 w-4" />
            Optimiser tout
          </Button>
        </div>
      }
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={Package} 
          label="Total Produits" 
          value={stats.totalProducts.toLocaleString()}
          subtext="Dans le catalogue"
          color="primary"
          trend={{ value: 12, up: true }}
        />
        <StatCard 
          icon={CheckCircle} 
          label="Optimisés" 
          value={stats.optimized.toLocaleString()}
          subtext={`${Math.round((stats.optimized / stats.totalProducts) * 100)}% du total`}
          color="success"
        />
        <StatCard 
          icon={AlertCircle} 
          label="En attente" 
          value={stats.pending.toLocaleString()}
          subtext="À traiter"
          color="warning"
        />
        <StatCard 
          icon={Brain} 
          label="Score IA moyen" 
          value={`${stats.aiScore}%`}
          subtext="Qualité catalogue"
          color="purple"
          trend={{ value: 5, up: true }}
        />
      </div>

      {/* Progress Overview */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Progression de l'optimisation</h3>
              <p className="text-sm text-muted-foreground">
                {stats.optimized} / {stats.totalProducts} produits optimisés
              </p>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Target className="h-3 w-3" />
              {Math.round((stats.optimized / stats.totalProducts) * 100)}%
            </Badge>
          </div>
          <Progress value={(stats.optimized / stats.totalProducts) * 100} className="h-3" />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/50 p-1 w-full md:w-auto">
          <TabsTrigger value="bulk" className="gap-2 flex-1 md:flex-none">
            <Zap className="h-4 w-4" />
            Actions Bulk
          </TabsTrigger>
          <TabsTrigger value="optimization" className="gap-2 flex-1 md:flex-none">
            <TrendingUp className="h-4 w-4" />
            Optimisation IA
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2 flex-1 md:flex-none">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bulk" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ActionCard
              icon={Upload}
              title="Import en masse"
              description="Importez des milliers de produits depuis CSV, Excel ou API externe."
              buttonLabel="Importer"
              variant="primary"
            />
            <ActionCard
              icon={Download}
              title="Export catalogue"
              description="Exportez vos produits vers différents formats et canaux de vente."
              buttonLabel="Exporter"
            />
            <ActionCard
              icon={RefreshCw}
              title="Mise à jour bulk"
              description="Modifiez prix, stocks et attributs sur des milliers de produits."
              buttonLabel="Modifier"
            />
            <ActionCard
              icon={Layers}
              title="Gestion catégories"
              description="Réorganisez et mappez vos catégories en masse."
              buttonLabel="Organiser"
            />
            <ActionCard
              icon={Wand2}
              title="Enrichissement IA"
              description="Enrichissez automatiquement les descriptions et attributs."
              buttonLabel="Enrichir"
              variant="success"
            />
            <ActionCard
              icon={Settings}
              title="Règles automatiques"
              description="Créez des règles pour automatiser la gestion catalogue."
              buttonLabel="Configurer"
            />
          </div>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Optimisation SEO</CardTitle>
                    <CardDescription>Améliorez le référencement de vos fiches</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Titres optimisés</span>
                    <span className="font-medium">67%</span>
                  </div>
                  <Progress value={67} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Descriptions enrichies</span>
                    <span className="font-medium">45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
                <Button className="w-full gap-2">
                  <Wand2 className="h-4 w-4" />
                  Lancer l'optimisation
                </Button>
              </CardContent>
            </Card>

            <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Brain className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle>Contenu IA</CardTitle>
                    <CardDescription>Génération automatique de contenu</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Descriptions générées</span>
                    <span className="font-medium">234</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Qualité moyenne</span>
                    <span className="font-medium">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                <Button variant="outline" className="w-full gap-2">
                  <Sparkles className="h-4 w-4" />
                  Générer du contenu
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Analytics Détaillées
              </CardTitle>
              <CardDescription>
                Performance, scoring qualité et recommandations intelligentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-6 rounded-xl bg-muted/50">
                  <div className="text-4xl font-bold text-primary mb-2">92%</div>
                  <p className="text-sm text-muted-foreground">Taux de complétion</p>
                </div>
                <div className="text-center p-6 rounded-xl bg-muted/50">
                  <div className="text-4xl font-bold text-emerald-600 mb-2">+23%</div>
                  <p className="text-sm text-muted-foreground">Amélioration SEO</p>
                </div>
                <div className="text-center p-6 rounded-xl bg-muted/50">
                  <div className="text-4xl font-bold text-purple-600 mb-2">847</div>
                  <p className="text-sm text-muted-foreground">Optimisations IA</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
}
