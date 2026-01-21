/**
 * Démo interactive sans inscription - Phase 3.2
 * Preview interactive des fonctionnalités
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  Package, 
  Zap, 
  BarChart3, 
  Sparkles, 
  ArrowRight,
  ShoppingCart,
  TrendingUp,
  CheckCircle2,
  Loader2
} from 'lucide-react';

interface DemoTab {
  id: string;
  label: string;
  icon: React.ElementType;
  title: string;
  description: string;
  features: string[];
  animation: 'import' | 'automation' | 'analytics' | 'ai';
}

const DEMO_TABS: DemoTab[] = [
  {
    id: 'import',
    label: 'Import',
    icon: Package,
    title: 'Import produits en 1 clic',
    description: 'Importez des milliers de produits depuis 99+ fournisseurs directement dans votre boutique.',
    features: ['AliExpress, BigBuy, Spocket...', 'Descriptions optimisées', 'Prix automatiques'],
    animation: 'import'
  },
  {
    id: 'automation',
    label: 'Automation',
    icon: Zap,
    title: 'Automatisez tout',
    description: 'Règles intelligentes pour gérer les stocks, prix et commandes sans intervention.',
    features: ['Sync multi-plateformes', 'Alertes stock bas', 'Fulfillment auto'],
    animation: 'automation'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    title: 'Insights temps réel',
    description: 'Tableaux de bord avancés pour suivre vos performances et prendre les bonnes décisions.',
    features: ['ROI par produit', 'Prévisions IA', 'Rapports exportables'],
    animation: 'analytics'
  },
  {
    id: 'ai',
    label: 'IA',
    icon: Sparkles,
    title: 'Intelligence artificielle',
    description: 'L\'IA optimise automatiquement vos descriptions, prix et stratégies marketing.',
    features: ['SEO automatique', 'Pricing dynamique', 'Content generation'],
    animation: 'ai'
  }
];

// Mock animation components
function ImportAnimation() {
  const [progress, setProgress] = useState(0);
  const [products, setProducts] = useState<string[]>([]);

  useState(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
      
      const mockProducts = ['T-shirt Premium', 'Montre Connectée', 'Écouteurs Bluetooth', 'Sac à dos', 'Sneakers Sport'];
      setProducts(prev => {
        if (prev.length >= 5) return prev;
        return [...prev, mockProducts[prev.length]];
      });
    }, 500);

    return () => clearInterval(interval);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Import en cours...</span>
        <span className="font-medium">{progress}%</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <div className="space-y-2">
        {products.map((product, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-sm"
          >
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span>{product}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function AutomationAnimation() {
  const rules = [
    { label: 'Stock < 5', action: 'Alerte email', active: true },
    { label: 'Nouvelle commande', action: 'Fulfillment auto', active: true },
    { label: 'Prix concurrent -10%', action: 'Ajuster prix', active: false },
  ];

  return (
    <div className="space-y-3">
      {rules.map((rule, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.2 }}
          className={`p-3 rounded-lg border ${rule.active ? 'border-success/50 bg-success/5' : 'border-border'}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className={`h-4 w-4 ${rule.active ? 'text-success' : 'text-muted-foreground'}`} />
              <span className="text-sm font-medium">{rule.label}</span>
            </div>
            <Badge variant={rule.active ? 'default' : 'secondary'} className="text-xs">
              {rule.action}
            </Badge>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function AnalyticsAnimation() {
  const data = [
    { label: 'Aujourd\'hui', value: '€2,450', change: '+12%' },
    { label: 'Cette semaine', value: '€15,800', change: '+8%' },
    { label: 'Ce mois', value: '€48,200', change: '+24%' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {data.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.15 }}
          className="p-3 rounded-lg bg-secondary/50 text-center"
        >
          <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
          <div className="text-lg font-bold">{item.value}</div>
          <div className="text-xs text-success flex items-center justify-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {item.change}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function AIAnimation() {
  const [generating, setGenerating] = useState(true);
  const [text, setText] = useState('');
  const fullText = "Découvrez notre montre connectée premium avec suivi fitness avancé, notifications intelligentes et design élégant. Autonomie 7 jours.";

  useState(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index <= fullText.length) {
        setText(fullText.slice(0, index));
        index++;
      } else {
        setGenerating(false);
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {generating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Génération IA en cours...
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4 text-success" />
            Description optimisée !
          </>
        )}
      </div>
      <div className="p-3 rounded-lg bg-secondary/50 text-sm">
        {text}
        {generating && <span className="animate-pulse">|</span>}
      </div>
    </div>
  );
}

export function InteractiveDemo() {
  const [activeTab, setActiveTab] = useState('import');
  const navigate = useNavigate();

  const getAnimation = (type: string) => {
    switch (type) {
      case 'import': return <ImportAnimation />;
      case 'automation': return <AutomationAnimation />;
      case 'analytics': return <AnalyticsAnimation />;
      case 'ai': return <AIAnimation />;
      default: return null;
    }
  };

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20">
            <Play className="h-3 w-3 mr-1 inline" />
            Démo interactive
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold">
            Testez avant de vous inscrire
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Découvrez les fonctionnalités principales sans créer de compte
          </p>
        </div>

        {/* Demo Card */}
        <Card className="max-w-4xl mx-auto border-2 shadow-xl overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Tab List */}
            <div className="border-b bg-secondary/30">
              <TabsList className="w-full justify-start gap-0 bg-transparent h-auto p-0 rounded-none">
                {DEMO_TABS.map((tab) => {
                  const TabIcon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="flex-1 sm:flex-none data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 px-4 sm:px-6"
                    >
                      <TabIcon className="h-4 w-4 mr-2 hidden sm:inline" />
                      {tab.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {/* Tab Content */}
            <CardContent className="p-6 lg:p-8">
              {DEMO_TABS.map((tab) => (
                <TabsContent key={tab.id} value={tab.id} className="m-0">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={tab.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="grid lg:grid-cols-2 gap-8 items-center"
                    >
                      {/* Left: Info */}
                      <div className="space-y-4">
                        <h3 className="text-2xl font-bold">{tab.title}</h3>
                        <p className="text-muted-foreground">{tab.description}</p>
                        <ul className="space-y-2">
                          {tab.features.map((feature, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <Button onClick={() => navigate('/auth')} className="mt-4 gap-2">
                          Essayer gratuitement
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Right: Animation */}
                      <div className="bg-secondary/20 rounded-xl p-6 min-h-[200px]">
                        {getAnimation(tab.animation)}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </TabsContent>
              ))}
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </section>
  );
}

export default InteractiveDemo;
