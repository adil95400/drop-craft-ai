/**
 * Changelog Public - Historique des mises à jour
 * Inspiré d'AutoDS et des meilleures pratiques SaaS
 */
import { Helmet } from 'react-helmet-async';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Sparkles, Bug, Zap, Shield, ArrowRight, 
  Rocket, Gift, Star, Clock, ChevronDown
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  description?: string;
  changes: {
    type: 'feature' | 'improvement' | 'fix' | 'security';
    text: string;
  }[];
  isHighlight?: boolean;
}

const CHANGELOG: ChangelogEntry[] = [
  {
    version: '2.5.0',
    date: '2025-02-02',
    title: 'Calculateur de Profit & Suivi Avancé',
    description: 'Nouvelles fonctionnalités pour optimiser vos marges et suivre vos colis.',
    isHighlight: true,
    changes: [
      { type: 'feature', text: 'Calculateur de profit intégré dans le flux d\'import avec frais Stripe/Shopify/TVA' },
      { type: 'feature', text: 'Timeline de suivi de colis avec étapes visuelles et historique détaillé' },
      { type: 'feature', text: 'États vides contextuels avec actions rapides personnalisées' },
      { type: 'feature', text: 'Export PDF des rapports analytics' },
      { type: 'improvement', text: 'Amélioration du cache Service Worker pour mises à jour automatiques' },
      { type: 'fix', text: 'Correction du texte de facturation sur la page Pricing' },
    ],
  },
  {
    version: '2.4.0',
    date: '2025-01-28',
    title: 'Command Center & IA Prédictive',
    description: 'Tableau de bord intelligent avec alertes proactives.',
    changes: [
      { type: 'feature', text: 'Widget de prévisions IA pour anticiper les ruptures de stock' },
      { type: 'feature', text: 'Panneau d\'alertes intelligentes avec actions correctives' },
      { type: 'feature', text: 'Système d\'auto-commande 100% automatisé (AliExpress, CJ, BigBuy)' },
      { type: 'improvement', text: 'Réduction du nombre de widgets par défaut à 6 essentiels' },
      { type: 'fix', text: 'Stabilisation du dashboard mobile' },
    ],
  },
  {
    version: '2.3.0',
    date: '2025-01-20',
    title: 'Import Pro & Feed URL',
    description: 'Nouvelles sources d\'import et orchestration unifiée.',
    changes: [
      { type: 'feature', text: 'Import par URL de flux (Shopify CSV, Google Shopping XML, Matterhorn JSON)' },
      { type: 'feature', text: 'Orchestrateur d\'import unifié avec monitoring temps réel' },
      { type: 'feature', text: 'Wizard d\'import en 7 étapes avec prévisualisation' },
      { type: 'improvement', text: 'Rollback Manager pour annuler les imports en masse (24h)' },
      { type: 'security', text: 'Protection SSRF sur les imports de flux externes' },
    ],
  },
  {
    version: '2.2.0',
    date: '2025-01-15',
    title: 'Multi-Store & Fulfillment Avancé',
    description: 'Gestion multi-boutiques et logistique professionnelle.',
    changes: [
      { type: 'feature', text: 'Support multi-boutiques avec synchronisation bidirectionnelle' },
      { type: 'feature', text: 'Split Fulfillment pour expéditions partielles' },
      { type: 'feature', text: 'Génération d\'étiquettes en masse (A4, A6, Thermal)' },
      { type: 'improvement', text: 'Timeline de fulfillment dans les détails commande' },
      { type: 'fix', text: 'Correction sync tracking Shopify' },
    ],
  },
  {
    version: '2.1.0',
    date: '2025-01-08',
    title: 'Pricing Dynamique & Audit SEO',
    description: 'Optimisation automatique des prix et qualité catalogue.',
    changes: [
      { type: 'feature', text: 'Règles de tarification dynamique (demande, stock, temps)' },
      { type: 'feature', text: 'Surveillance des prix concurrents avec alertes' },
      { type: 'feature', text: 'Module d\'audit SEO (densité mots-clés, meta, alt text)' },
      { type: 'feature', text: 'Validation Feed multi-canal (Google, Meta, Amazon)' },
      { type: 'improvement', text: 'Performance: réduction bundle initial de 73%' },
    ],
  },
  {
    version: '2.0.0',
    date: '2025-01-01',
    title: 'ShopOpti 2.0 - Refonte Majeure',
    description: 'Nouvelle architecture, nouvelle interface, nouvelles possibilités.',
    isHighlight: true,
    changes: [
      { type: 'feature', text: 'Nouvelle interface Channable-style avec navigation consolidée' },
      { type: 'feature', text: 'Extension Chrome v5 avec chargement dynamique' },
      { type: 'feature', text: 'Intégration de 24+ marketplaces et boutiques' },
      { type: 'feature', text: 'Moteur de règles d\'automatisation avancé' },
      { type: 'security', text: 'Authentification renforcée et chiffrement des credentials' },
      { type: 'improvement', text: 'Support mobile complet avec PWA' },
    ],
  },
];

const TYPE_CONFIG = {
  feature: { icon: Sparkles, label: 'Nouveauté', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  improvement: { icon: Zap, label: 'Amélioration', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  fix: { icon: Bug, label: 'Correction', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  security: { icon: Shield, label: 'Sécurité', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
};

export default function ChangelogPage() {
  const [expandedVersions, setExpandedVersions] = useState<string[]>([CHANGELOG[0].version]);

  const toggleVersion = (version: string) => {
    setExpandedVersions(prev => 
      prev.includes(version) 
        ? prev.filter(v => v !== version)
        : [...prev, version]
    );
  };

  return (
    <>
      <Helmet>
        <title>Changelog | ShopOpti - Historique des mises à jour</title>
        <meta name="description" content="Découvrez les dernières nouveautés, améliorations et corrections de ShopOpti. Restez informé de l'évolution de la plateforme." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        {/* Header */}
        <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Rocket className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">ShopOpti</span>
            </Link>
            
            <nav className="flex items-center gap-4">
              <Link to="/pricing">
                <Button variant="ghost" size="sm">Tarifs</Button>
              </Link>
              <Link to="/auth">
                <Button size="sm">Se connecter</Button>
              </Link>
            </nav>
          </div>
        </header>

        {/* Hero */}
        <section className="container mx-auto px-4 py-16 text-center">
          <Badge className="mb-4" variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Dernière mise à jour: {CHANGELOG[0].date}
          </Badge>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Changelog
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Suivez l'évolution de ShopOpti. Nouvelles fonctionnalités, améliorations et corrections.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            {Object.entries(TYPE_CONFIG).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <Badge key={key} variant="outline" className={cn("gap-1", config.color)}>
                  <Icon className="h-3 w-3" />
                  {config.label}
                </Badge>
              );
            })}
          </div>
        </section>

        {/* Changelog entries */}
        <section className="container mx-auto px-4 pb-20">
          <div className="max-w-3xl mx-auto space-y-6">
            {CHANGELOG.map((entry, index) => {
              const isExpanded = expandedVersions.includes(entry.version);
              
              return (
                <motion.div
                  key={entry.version}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={cn(
                    "overflow-hidden transition-all",
                    entry.isHighlight && "border-primary/50 bg-primary/5"
                  )}>
                    <CardHeader 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleVersion(entry.version)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Badge variant={entry.isHighlight ? 'default' : 'secondary'}>
                              v{entry.version}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(entry.date).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </span>
                            {entry.isHighlight && (
                              <Badge variant="outline" className="gap-1 border-yellow-500/50 text-yellow-500">
                                <Star className="h-3 w-3" />
                                Majeure
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-xl">{entry.title}</CardTitle>
                          {entry.description && (
                            <p className="text-muted-foreground">{entry.description}</p>
                          )}
                        </div>
                        
                        <ChevronDown className={cn(
                          "h-5 w-5 text-muted-foreground transition-transform",
                          isExpanded && "rotate-180"
                        )} />
                      </div>
                    </CardHeader>
                    
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <CardContent className="pt-0">
                            <Separator className="mb-4" />
                            <ul className="space-y-3">
                              {entry.changes.map((change, i) => {
                                const config = TYPE_CONFIG[change.type];
                                const Icon = config.icon;
                                
                                return (
                                  <li key={i} className="flex items-start gap-3">
                                    <Badge 
                                      variant="outline" 
                                      className={cn("flex-shrink-0 gap-1", config.color)}
                                    >
                                      <Icon className="h-3 w-3" />
                                      {config.label}
                                    </Badge>
                                    <span className="text-sm">{change.text}</span>
                                  </li>
                                );
                              })}
                            </ul>
                          </CardContent>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 pb-20">
          <Card className="max-w-3xl mx-auto bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="py-8 text-center">
              <Gift className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Prêt à essayer ?</h2>
              <p className="text-muted-foreground mb-6">
                Testez gratuitement toutes les nouvelles fonctionnalités de ShopOpti.
              </p>
              <Link to="/auth?mode=register">
                <Button size="lg" className="gap-2">
                  Démarrer gratuitement
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="border-t py-8">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>© 2025 ShopOpti. Tous droits réservés.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
