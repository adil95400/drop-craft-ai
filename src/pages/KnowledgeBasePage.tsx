import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Search, BookOpen, Video, HelpCircle, Lightbulb, Rocket, Shield, Zap, 
  Play, Clock, ChevronRight, Wrench, AlertTriangle, CheckCircle2, 
  ArrowRight, Package, ShoppingCart, Globe, BarChart3, Users, Bot
} from 'lucide-react';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  tags: string[];
}

interface VideoTutorial {
  id: string;
  title: string;
  duration: string;
  thumbnail: string;
  category: string;
  level: 'Débutant' | 'Intermédiaire' | 'Avancé';
}

interface TroubleshootItem {
  id: string;
  symptom: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
  steps: string[];
  resolution: string;
}

const ARTICLES: Article[] = [
  { id: '1', title: 'Premiers pas avec ShopOpti+', excerpt: 'Guide complet pour configurer votre boutique et importer vos premiers produits en moins de 10 minutes.', category: 'Démarrage', readTime: '5 min', tags: ['onboarding', 'setup'] },
  { id: '2', title: 'Connecter votre boutique Shopify', excerpt: 'Intégrez votre boutique Shopify en quelques clics pour synchroniser produits et commandes en temps réel.', category: 'Intégrations', readTime: '3 min', tags: ['shopify', 'sync'] },
  { id: '3', title: 'Automatiser les commandes fournisseurs', excerpt: 'Configurez des règles d\'auto-commande pour ne jamais manquer un réapprovisionnement critique.', category: 'Automatisation', readTime: '7 min', tags: ['automation', 'orders'] },
  { id: '4', title: 'Optimiser vos fiches produits avec l\'IA', excerpt: 'Utilisez notre assistant IA pour générer des titres, descriptions et métadonnées SEO optimisés automatiquement.', category: 'IA', readTime: '4 min', tags: ['ai', 'seo', 'products'] },
  { id: '5', title: 'Gérer votre équipe et les permissions', excerpt: 'Invitez des collaborateurs et définissez des rôles granulaires pour chaque membre de votre équipe.', category: 'Équipe', readTime: '3 min', tags: ['team', 'permissions'] },
  { id: '6', title: 'Comprendre le dashboard Analytics', excerpt: 'Décryptez vos KPIs : chiffre d\'affaires, marge, taux de conversion et tendances en un coup d\'œil.', category: 'Analytics', readTime: '6 min', tags: ['analytics', 'kpi'] },
  { id: '7', title: 'Configurer les campagnes PPC', excerpt: 'Créez et optimisez vos campagnes publicitaires avec notre moteur d\'automatisation marketing.', category: 'Marketing', readTime: '8 min', tags: ['ppc', 'ads', 'marketing'] },
  { id: '8', title: 'Sécurité et conformité RGPD', excerpt: 'Protégez vos données et celles de vos clients avec nos outils de conformité intégrés.', category: 'Sécurité', readTime: '5 min', tags: ['security', 'gdpr'] },
  { id: '9', title: 'Import CSV et enrichissement en masse', excerpt: 'Importez des centaines de produits via CSV et enrichissez-les automatiquement avec l\'IA.', category: 'Produits', readTime: '6 min', tags: ['csv', 'import', 'bulk'] },
  { id: '10', title: 'Synchronisation multi-marketplace', excerpt: 'Gérez vos produits sur Shopify, WooCommerce, Amazon et eBay depuis une interface unique.', category: 'Intégrations', readTime: '8 min', tags: ['marketplace', 'sync', 'multichannel'] },
  { id: '11', title: 'Créer un workflow d\'automatisation', excerpt: 'Construisez des workflows visuels pour automatiser prix, stock et commandes selon vos règles métier.', category: 'Automatisation', readTime: '10 min', tags: ['workflow', 'automation', 'rules'] },
  { id: '12', title: 'Gestion avancée du stock', excerpt: 'Activez les alertes de stock bas, les prédictions de rupture et le réapprovisionnement automatique.', category: 'Stock', readTime: '5 min', tags: ['stock', 'inventory', 'alerts'] },
];

const VIDEOS: VideoTutorial[] = [
  { id: 'v1', title: 'Tour complet de la plateforme', duration: '12:30', thumbnail: '🎬', category: 'Démarrage', level: 'Débutant' },
  { id: 'v2', title: 'Importer des produits en masse', duration: '8:15', thumbnail: '📦', category: 'Produits', level: 'Débutant' },
  { id: 'v3', title: 'Créer un workflow d\'automatisation', duration: '15:45', thumbnail: '⚡', category: 'Automatisation', level: 'Intermédiaire' },
  { id: 'v4', title: 'Configurer les intégrations marketplace', duration: '10:20', thumbnail: '🔗', category: 'Intégrations', level: 'Intermédiaire' },
  { id: 'v5', title: 'Optimisation SEO avancée', duration: '18:00', thumbnail: '🔍', category: 'SEO', level: 'Avancé' },
  { id: 'v6', title: 'Gestion multi-boutiques', duration: '14:30', thumbnail: '🏪', category: 'Enterprise', level: 'Avancé' },
  { id: 'v7', title: 'Enrichissement IA des fiches produit', duration: '9:45', thumbnail: '🤖', category: 'IA', level: 'Débutant' },
  { id: 'v8', title: 'Configurer les alertes de stock', duration: '6:20', thumbnail: '📊', category: 'Stock', level: 'Débutant' },
  { id: 'v9', title: 'Tableau de bord Analytics en détail', duration: '11:10', thumbnail: '📈', category: 'Analytics', level: 'Intermédiaire' },
];

const FAQ = [
  { q: 'Comment réinitialiser mon mot de passe ?', a: 'Cliquez sur "Mot de passe oublié" sur la page de connexion. Un email de réinitialisation vous sera envoyé sous 2 minutes.' },
  { q: 'Combien de produits puis-je importer ?', a: 'Cela dépend de votre plan : Free (100 produits), Pro (10 000), Ultra Pro (illimité). Consultez la page Facturation pour votre limite actuelle.' },
  { q: 'Comment connecter Amazon ?', a: 'Allez dans Intégrations > Marketplaces > Amazon, sélectionnez votre région et suivez l\'assistant de connexion OAuth.' },
  { q: 'Les données sont-elles sécurisées ?', a: 'Oui. Chiffrement AES-256 au repos, TLS 1.3 en transit, Row Level Security (RLS) activé et conformité RGPD complète.' },
  { q: 'Puis-je exporter mes données ?', a: 'Oui, depuis la page Produits (export CSV/JSON) ou Paramètres > Export complet. Formats : CSV, JSON, XLSX.' },
  { q: 'Comment fonctionne la facturation ?', a: 'La facturation est mensuelle. Changez de plan à tout moment, le prorata est calculé automatiquement via Stripe.' },
  { q: 'L\'enrichissement IA est-il inclus ?', a: 'Oui, chaque plan inclut un quota de tokens IA. Le plan Free offre 1 000 tokens, Pro 50 000, Ultra Pro 500 000.' },
  { q: 'Puis-je annuler à tout moment ?', a: 'Oui, l\'annulation est immédiate. Vous conservez l\'accès jusqu\'à la fin de la période en cours.' },
  { q: 'Les intégrations sont-elles en temps réel ?', a: 'Oui, les webhooks assurent une synchronisation en temps réel. Des syncs CRON sont aussi disponibles en fallback.' },
];

const TROUBLESHOOT: TroubleshootItem[] = [
  {
    id: 't1',
    symptom: 'Les produits ne se synchronisent pas avec Shopify',
    category: 'Intégrations',
    severity: 'high',
    steps: [
      'Vérifiez que votre connexion Shopify est active dans Intégrations > Shopify.',
      'Contrôlez que le token API n\'a pas expiré (régénérez-le si nécessaire).',
      'Vérifiez que les produits ont le statut "active" et un SKU unique.',
      'Lancez une synchronisation manuelle depuis le Sync Manager.',
      'Consultez les logs dans Monitoring > Intégrations pour identifier l\'erreur.'
    ],
    resolution: 'Dans 90% des cas, un token expiré ou un SKU en doublon est la cause. Régénérez le token et vérifiez vos SKU.'
  },
  {
    id: 't2',
    symptom: 'L\'import CSV échoue ou est incomplet',
    category: 'Import/Export',
    severity: 'medium',
    steps: [
      'Vérifiez que votre fichier CSV utilise l\'encodage UTF-8.',
      'Assurez-vous que les en-têtes correspondent au template (téléchargez le modèle).',
      'Le champ "name" est obligatoire, "price" doit être un nombre positif.',
      'Limitez l\'import à 500 lignes par batch pour les gros catalogues.',
      'En cas d\'erreur, consultez le rapport d\'import dans l\'historique.'
    ],
    resolution: 'Téléchargez le template CSV depuis la page Import et complétez-le. Encodez en UTF-8 avec séparateur virgule.'
  },
  {
    id: 't3',
    symptom: 'Page blanche ou erreur au chargement',
    category: 'Général',
    severity: 'high',
    steps: [
      'Rafraîchissez la page (Ctrl+F5 pour un refresh complet).',
      'Videz le cache du navigateur et les cookies du site.',
      'Vérifiez votre connexion internet.',
      'Essayez un autre navigateur (Chrome, Firefox, Edge recommandés).',
      'Si le problème persiste, vérifiez la page de statut (/status).'
    ],
    resolution: 'Un cache navigateur corrompu est la cause la plus fréquente. Le refresh complet résout le problème dans 95% des cas.'
  },
  {
    id: 't4',
    symptom: 'L\'enrichissement IA ne génère aucun contenu',
    category: 'IA',
    severity: 'medium',
    steps: [
      'Vérifiez votre quota de tokens IA dans Facturation > Quotas.',
      'Assurez-vous que le produit a au minimum un nom renseigné.',
      'Vérifiez que vous avez sélectionné un template de génération.',
      'Attendez 30 secondes — les générations peuvent prendre du temps.',
      'En cas d\'échec récurrent, basculez sur un modèle IA alternatif dans Paramètres.'
    ],
    resolution: 'La cause la plus courante est un quota épuisé. Upgradez votre plan ou attendez le renouvellement mensuel.'
  },
  {
    id: 't5',
    symptom: 'Les commandes ne remontent pas automatiquement',
    category: 'Commandes',
    severity: 'high',
    steps: [
      'Vérifiez que l\'intégration est connectée et active.',
      'Contrôlez les webhooks dans Intégrations > Webhooks.',
      'Assurez-vous que les permissions d\'accès aux commandes sont accordées.',
      'Lancez un sync manuel depuis le Gestionnaire de synchronisation.',
      'Consultez les logs d\'erreur dans Monitoring > API.'
    ],
    resolution: 'Un webhook mal configuré est souvent la cause. Recréez le webhook depuis la page Intégrations.'
  },
  {
    id: 't6',
    symptom: 'Mot de passe oublié ou compte verrouillé',
    category: 'Compte',
    severity: 'low',
    steps: [
      'Utilisez le lien "Mot de passe oublié" sur la page de connexion.',
      'Vérifiez votre dossier spam pour l\'email de réinitialisation.',
      'L\'email arrive sous 2 minutes — attendez avant de réessayer.',
      'Si le compte est verrouillé, attendez 15 minutes avant de retenter.',
      'Contactez le support si le problème persiste après 3 tentatives.'
    ],
    resolution: 'L\'email de réinitialisation expire après 1 heure. Vérifiez bien votre dossier spam.'
  },
  {
    id: 't7',
    symptom: 'Les prix ne se mettent pas à jour sur la boutique',
    category: 'Produits',
    severity: 'medium',
    steps: [
      'Vérifiez que la règle de prix est bien active dans Tarification.',
      'Contrôlez que le sync automatique est activé pour le canal concerné.',
      'Lancez un sync manuel pour forcer la mise à jour.',
      'Vérifiez les overrides de prix sur le canal dans la fiche produit.',
      'Consultez l\'historique de sync pour détecter les échecs.'
    ],
    resolution: 'Les overrides de prix par canal prennent priorité. Supprimez-les ou ajustez-les dans l\'onglet Prix du produit.'
  },
];

const severityConfig = {
  low: { label: 'Mineur', className: 'bg-muted text-muted-foreground' },
  medium: { label: 'Modéré', className: 'bg-warning/10 text-warning border-warning/20' },
  high: { label: 'Critique', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export default function KnowledgeBasePage() {
  const [search, setSearch] = useState('');

  const filteredArticles = ARTICLES.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.excerpt.toLowerCase().includes(search.toLowerCase()) ||
    a.tags.some(t => t.includes(search.toLowerCase()))
  );

  const filteredTroubleshoot = TROUBLESHOOT.filter(t =>
    t.symptom.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
          <BookOpen className="h-10 w-10 text-primary" />
          Centre d'Aide
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Guides, tutoriels vidéo, FAQ et playbook de dépannage pour maîtriser ShopOpti+
        </p>
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            className="pl-10 h-12 text-lg"
            placeholder="Rechercher un article, un tutoriel, un problème..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: <Rocket className="h-5 w-5" />, label: 'Démarrage', count: 3 },
          { icon: <Zap className="h-5 w-5" />, label: 'Automatisation', count: 3 },
          { icon: <Bot className="h-5 w-5" />, label: 'IA', count: 2 },
          { icon: <Shield className="h-5 w-5" />, label: 'Sécurité', count: 1 },
          { icon: <Package className="h-5 w-5" />, label: 'Produits', count: 3 },
          { icon: <Globe className="h-5 w-5" />, label: 'Intégrations', count: 2 },
          { icon: <BarChart3 className="h-5 w-5" />, label: 'Analytics', count: 1 },
          { icon: <Wrench className="h-5 w-5" />, label: 'Dépannage', count: TROUBLESHOOT.length },
        ].map(cat => (
          <Card key={cat.label} className="cursor-pointer hover:border-primary transition-colors" onClick={() => setSearch(cat.label)}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">{cat.icon}</div>
              <div>
                <p className="font-medium">{cat.label}</p>
                <p className="text-sm text-muted-foreground">{cat.count} articles</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="articles">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="articles"><BookOpen className="mr-1 h-4 w-4" />Articles ({filteredArticles.length})</TabsTrigger>
          <TabsTrigger value="videos"><Video className="mr-1 h-4 w-4" />Vidéos ({VIDEOS.length})</TabsTrigger>
          <TabsTrigger value="troubleshoot"><Wrench className="mr-1 h-4 w-4" />Dépannage ({filteredTroubleshoot.length})</TabsTrigger>
          <TabsTrigger value="faq"><HelpCircle className="mr-1 h-4 w-4" />FAQ ({FAQ.length})</TabsTrigger>
        </TabsList>

        {/* Articles */}
        <TabsContent value="articles" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {filteredArticles.map(article => (
              <Card key={article.id} className="hover:border-primary/50 transition-colors cursor-pointer group">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{article.category}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />{article.readTime}
                    </span>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors flex items-center gap-2">
                    {article.title}
                    <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{article.excerpt}</p>
                  <div className="flex gap-1 mt-3 flex-wrap">
                    {article.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Videos */}
        <TabsContent value="videos" className="mt-4">
          <div className="grid md:grid-cols-3 gap-4">
            {VIDEOS.map(video => (
              <Card key={video.id} className="hover:border-primary/50 transition-colors cursor-pointer group">
                <CardContent className="p-4 space-y-3">
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-4xl relative">
                    {video.thumbnail}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
                      <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                        <Play className="h-5 w-5 text-primary-foreground ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">{video.category}</Badge>
                      <Badge variant={video.level === 'Débutant' ? 'default' : video.level === 'Intermédiaire' ? 'secondary' : 'outline'} className="text-xs">
                        {video.level}
                      </Badge>
                    </div>
                    <p className="font-medium">{video.title}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />{video.duration}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Troubleshooting Playbook */}
        <TabsContent value="troubleshoot" className="mt-4 space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex items-center gap-3 p-4">
              <AlertTriangle className="h-5 w-5 text-primary shrink-0" />
              <p className="text-sm">
                <strong>Playbook de dépannage</strong> — Suivez les étapes pas à pas pour résoudre les problèmes courants. 
                Si le problème persiste, contactez le support avec le numéro de diagnostic.
              </p>
            </CardContent>
          </Card>

          <Accordion type="multiple" className="space-y-3">
            {filteredTroubleshoot.map((item) => {
              const severity = severityConfig[item.severity];
              return (
                <AccordionItem key={item.id} value={item.id} className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <div className="flex items-center gap-3 flex-1 mr-4">
                      <AlertTriangle className={`h-4 w-4 shrink-0 ${
                        item.severity === 'high' ? 'text-destructive' : 
                        item.severity === 'medium' ? 'text-warning' : 'text-muted-foreground'
                      }`} />
                      <div className="flex-1">
                        <p className="font-medium">{item.symptom}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{item.category}</Badge>
                          <Badge className={`text-xs ${severity.className}`}>{severity.label}</Badge>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="space-y-4 pl-7">
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                          <Wrench className="h-4 w-4 text-primary" />
                          Étapes de résolution
                        </p>
                        <ol className="space-y-2">
                          {item.steps.map((step, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                      <div className="p-3 rounded-lg bg-accent/50 border border-accent">
                        <p className="text-sm flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span><strong>Résolution :</strong> {item.resolution}</span>
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </TabsContent>

        {/* FAQ */}
        <TabsContent value="faq" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <Accordion type="multiple" className="w-full">
                {FAQ.map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
