/**
 * Advanced Modules Hub - Accès aux modules avancés et premium
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, Shield, Plug, TrendingUp, Zap, Search, 
  Users, Crown, Sparkles, Building2, Settings 
} from 'lucide-react';

interface ModuleCard {
  id: string;
  title: string;
  description: string;
  icon: any;
  route: string;
  badge: string;
  features: string[];
}

const advancedModules: ModuleCard[] = [
  {
    id: 'analytics',
    title: 'Analytics Pro',
    description: 'Analytics avancés avec insights IA',
    icon: TrendingUp,
    route: '/analytics',
    badge: 'PRO',
    features: ['Reports personnalisés', 'Prédictions IA', 'Dashboards avancés']
  },
  {
    id: 'automation',
    title: 'Automatisation',
    description: 'Automatisez vos processus e-commerce',
    icon: Zap,
    route: '/automation',
    badge: 'PRO',
    features: ['Workflow builder', 'Auto-pricing', 'Sync inventaire']
  },
  {
    id: 'ai',
    title: 'IA Avancée',
    description: 'Suite complète d\'intelligence artificielle',
    icon: Brain,
    route: '/automation/ai',
    badge: 'ULTRA',
    features: ['Analyse prédictive', 'Recommandations', 'Optimisation auto']
  },
  {
    id: 'crm',
    title: 'CRM Pro',
    description: 'Gestion relation client avancée',
    icon: Users,
    route: '/marketing/crm',
    badge: 'PRO',
    features: ['Segmentation', 'Campagnes email', 'Pipeline ventes']
  },
  {
    id: 'seo',
    title: 'SEO Manager',
    description: 'Optimisation SEO automatisée',
    icon: Search,
    route: '/marketing/seo',
    badge: 'PRO',
    features: ['Audit SEO', 'Mots-clés', 'Rank tracking']
  },
  {
    id: 'security',
    title: 'Sécurité Enterprise',
    description: 'Sécurité et conformité avancées',
    icon: Shield,
    route: '/admin/security',
    badge: 'ULTRA',
    features: ['Audit logs', 'Access control', 'Monitoring']
  },
  {
    id: 'integrations',
    title: 'Intégrations Premium',
    description: 'API et connecteurs avancés',
    icon: Plug,
    route: '/integrations',
    badge: 'ULTRA',
    features: ['Custom APIs', 'Webhooks', 'Connecteurs premium']
  },
  {
    id: 'multi-tenant',
    title: 'Multi-Tenant',
    description: 'Gestion multi-tenant enterprise',
    icon: Building2,
    route: '/enterprise/multi-tenant',
    badge: 'ULTRA',
    features: ['White-label', 'Tenant isolation', 'Admin global']
  },
  {
    id: 'admin',
    title: 'Admin Panel',
    description: 'Panneau d\'administration système',
    icon: Settings,
    route: '/admin',
    badge: 'ULTRA',
    features: ['User management', 'System config', 'Advanced settings']
  }
];

export default function AdvancedModulesPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Crown className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Modules Avancés</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Accédez aux fonctionnalités premium et enterprise pour faire passer votre boutique au niveau supérieur
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {advancedModules.map((module) => {
          const IconComponent = module.icon;
          return (
            <Card key={module.id} className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-primary/10 w-fit">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                  <Badge variant={module.badge === 'ULTRA' ? 'default' : 'secondary'}>
                    {module.badge}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{module.title}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {module.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full group-hover:bg-primary/90 transition-colors"
                  onClick={() => navigate(module.route)}
                >
                  Accéder au module
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6 text-center">
        <h2 className="text-xl font-semibold mb-2">🚀 Besoin d'aide ?</h2>
        <p className="text-muted-foreground mb-4">
          Notre équipe est disponible pour vous accompagner dans l'utilisation des modules avancés
        </p>
        <Button variant="outline" onClick={() => navigate('/integrations/support')}>
          Contacter le support
        </Button>
      </div>
    </div>
  );
}
