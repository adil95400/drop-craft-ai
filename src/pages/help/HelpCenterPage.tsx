/**
 * Help Center Unifié — FAQ, Documentation, Playbook dépannage, Guides, API
 */
import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChannablePageWrapper } from '@/components/channable'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  Search, MessageCircle, Book, Video, Phone, Mail, ExternalLink,
  ThumbsUp, Clock, Users, Zap, BookOpen, ArrowRight, AlertTriangle,
  CheckCircle2, XCircle, Wrench, Code2, Shield, RefreshCw, Package,
  Globe, CreditCard, Bot, BarChart3, HelpCircle, FileText
} from 'lucide-react'
import { DocumentationHub } from '@/components/documentation'

// ─── FAQ Data ──────────────────────────────────────────────────────
const FAQ_CATEGORIES = [
  { id: 'all', label: 'Tous', icon: Search },
  { id: 'getting-started', label: 'Démarrage', icon: Zap },
  { id: 'import', label: 'Import', icon: Package },
  { id: 'sync', label: 'Synchronisation', icon: RefreshCw },
  { id: 'ai', label: 'IA & SEO', icon: Bot },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'billing', label: 'Facturation', icon: CreditCard },
  { id: 'integrations', label: 'Intégrations', icon: Globe },
  { id: 'security', label: 'Sécurité', icon: Shield },
]

const FAQ_ITEMS = [
  { id: '1', q: 'Comment importer mes premiers produits ?', a: 'Rendez-vous dans Import > Sources de données. Importez via CSV, connectez un fournisseur (BigBuy, AliExpress, CJ) ou collez une URL produit pour extraction IA automatique.', cat: 'import', helpful: 89 },
  { id: '2', q: 'Comment connecter ma boutique Shopify ?', a: 'Dans Intégrations > Shopify, entrez votre domaine boutique et autorisez la connexion OAuth. La synchronisation bidirectionnelle se configure ensuite automatiquement.', cat: 'integrations', helpful: 73 },
  { id: '3', q: 'Que signifient les scores de compétitivité ?', a: 'Les scores analysent vos prix vs le marché, la demande produit et la rentabilité potentielle. Plus le score est élevé (0-100), plus le produit est recommandé pour la vente.', cat: 'analytics', helpful: 67 },
  { id: '4', q: 'Comment utiliser l\'IA pour optimiser mes descriptions ?', a: 'Dans IA > Optimisation, sélectionnez vos produits et "Optimiser descriptions". L\'IA améliore automatiquement vos contenus pour le SEO et la conversion en 50+ langues.', cat: 'ai', helpful: 52 },
  { id: '5', q: 'Comment configurer les alertes de stock ?', a: 'Paramètres > Notifications, configurez les seuils d\'alerte. Les notifications push et emails sont envoyés automatiquement quand le stock passe sous le seuil.', cat: 'sync', helpful: 44 },
  { id: '6', q: 'Comment fonctionne le repricing automatique ?', a: 'Le repricing analyse les prix concurrents et ajuste vos tarifs selon vos règles (marge min, prix max, arrondi psychologique). Activez dans Pricing > Repricing automatique.', cat: 'analytics', helpful: 41 },
  { id: '7', q: 'Comment créer un workflow d\'automatisation ?', a: 'Dans Automation > Workflows, cliquez "Nouveau". Choisissez un déclencheur (stock bas, commande reçue), puis des actions (notification push, email Brevo, mise à jour prix).', cat: 'sync', helpful: 48 },
  { id: '8', q: 'Quelle différence entre les plans Free, Pro et Ultra Pro ?', a: 'Free: 50 produits, import basique. Pro: 5000 produits, IA illimitée, multi-boutiques, repricing. Ultra Pro: illimité, API, support prioritaire 24/7, fonctions enterprise.', cat: 'billing', helpful: 85 },
  { id: '9', q: 'Comment récupérer un panier abandonné ?', a: 'Les paniers abandonnés (>1h) sont détectés automatiquement. Des relances email (Brevo) et push (Firebase) sont envoyées. Consultez Marketing > Paniers abandonnés pour le suivi.', cat: 'getting-started', helpful: 56 },
  { id: '10', q: 'Comment fonctionne le programme de fidélité ?', a: 'Dans Marketing > Fidélité, configurez les règles d\'accumulation de points (achat, parrainage, fréquence). Les clients gagnent des points échangeables contre des remises ou récompenses.', cat: 'getting-started', helpful: 38 },
  { id: '11', q: 'Comment sécuriser mon compte avec la 2FA ?', a: 'Paramètres > Sécurité > Authentification deux facteurs. Activez via app d\'authentification (recommandé) ou SMS pour une couche de protection supplémentaire.', cat: 'security', helpful: 34 },
  { id: '12', q: 'Comment configurer les webhooks API ?', a: 'Paramètres > API > Webhooks. Ajoutez une URL de callback, sélectionnez les événements (commande, stock, produit) et testez. Documentation complète dans le portail développeur.', cat: 'integrations', helpful: 22 },
  { id: '13', q: 'Comment exporter mes données ?', a: 'Chaque section (produits, commandes, clients) a un bouton "Exporter". Formats disponibles: Excel (.xlsx), CSV, JSON. Vous pouvez filtrer avant export.', cat: 'getting-started', helpful: 33 },
  { id: '14', q: 'Comment suivre les expéditions ?', a: 'Les numéros de tracking sont synchronisés automatiquement depuis vos fournisseurs. Consultez Commandes > Suivi pour le statut temps réel de chaque expédition.', cat: 'sync', helpful: 44 },
  { id: '15', q: 'Mon import échoue, que faire ?', a: 'Vérifiez le format du fichier (CSV/XLSX), les colonnes obligatoires (titre, prix, SKU). Utilisez le mapping de colonnes si les noms diffèrent. Consultez le playbook de dépannage ci-dessous.', cat: 'import', helpful: 61 },
]

// ─── Troubleshooting Playbook ──────────────────────────────────────
const PLAYBOOK_SECTIONS = [
  {
    id: 'api-errors',
    title: 'Erreurs API & Connexion',
    icon: Code2,
    severity: 'critical' as const,
    problems: [
      {
        symptom: 'Erreur 401 — "Invalid or expired token"',
        causes: ['Token JWT expiré', 'Session déconnectée', 'Clé API révoquée'],
        steps: ['Déconnectez-vous et reconnectez-vous', 'Régénérez votre clé API dans Paramètres > API', 'Vérifiez que votre abonnement est actif'],
      },
      {
        symptom: 'Erreur 429 — "Rate limit exceeded"',
        causes: ['Trop de requêtes en peu de temps', 'Quota API dépassé'],
        steps: ['Attendez 1 minute avant de réessayer', 'Vérifiez votre quota dans Paramètres > Consommation', 'Passez à un plan supérieur pour plus de requêtes/min'],
      },
      {
        symptom: 'Erreur 500 — Erreur serveur',
        causes: ['Problème temporaire côté serveur', 'Données corrompues'],
        steps: ['Attendez 30 secondes et réessayez', 'Videz le cache du navigateur', 'Si persistant, contactez le support avec l\'ID de requête'],
      },
    ],
  },
  {
    id: 'sync-issues',
    title: 'Synchronisation & Import',
    icon: RefreshCw,
    severity: 'important' as const,
    problems: [
      {
        symptom: 'La synchronisation Shopify ne se lance pas',
        causes: ['Token OAuth expiré', 'Permissions manquantes', 'URL boutique incorrecte'],
        steps: ['Vérifiez la connexion dans Intégrations > Shopify', 'Réautorisez l\'application Shopify', 'Vérifiez que votre URL est au format monshop.myshopify.com', 'Vérifiez les permissions requises dans l\'app Shopify'],
      },
      {
        symptom: 'Import CSV échoue avec "colonnes manquantes"',
        causes: ['En-têtes de colonnes non reconnus', 'Séparateur incorrect', 'Encodage du fichier'],
        steps: ['Vérifiez que le fichier utilise le séparateur virgule ou point-virgule', 'Utilisez le mapping de colonnes pour faire correspondre vos en-têtes', 'Sauvegardez votre fichier en UTF-8', 'Téléchargez notre template CSV dans Import > Aide'],
      },
      {
        symptom: 'Produits dupliqués après import',
        causes: ['SKU non unique', 'Import lancé plusieurs fois', 'Pas de déduplication'],
        steps: ['Vérifiez l\'unicité des SKU dans votre fichier', 'Activez la déduplication par SKU dans les paramètres d\'import', 'Utilisez la fonction "Fusionner les doublons" dans Catalogue'],
      },
    ],
  },
  {
    id: 'notifications',
    title: 'Notifications & Emails',
    icon: Mail,
    severity: 'important' as const,
    problems: [
      {
        symptom: 'Je ne reçois pas les notifications push',
        causes: ['Notifications bloquées par le navigateur', 'Service worker non installé', 'Token FCM expiré'],
        steps: ['Vérifiez les permissions de notification dans votre navigateur', 'Autorisez les notifications pour le site', 'Déconnectez-vous et reconnectez-vous pour réinitialiser le token', 'Vérifiez Paramètres > Notifications > Push'],
      },
      {
        symptom: 'Les emails de relance ne partent pas',
        causes: ['Brevo non configuré', 'Quota email épuisé', 'Adresse email en liste de suppression'],
        steps: ['Vérifiez la configuration Brevo dans Paramètres > Email', 'Consultez votre quota Brevo (300 emails/jour en gratuit)', 'Vérifiez que l\'email du destinataire n\'est pas en bounce/suppression'],
      },
    ],
  },
  {
    id: 'ai-issues',
    title: 'IA & Génération de contenu',
    icon: Bot,
    severity: 'minor' as const,
    problems: [
      {
        symptom: 'La génération IA est lente ou timeout',
        causes: ['Lot trop volumineux', 'Quota IA épuisé', 'Modèle surchargé'],
        steps: ['Réduisez le nombre de produits par lot (max 50 recommandé)', 'Vérifiez votre quota IA dans Paramètres > Consommation', 'Réessayez dans quelques minutes', 'Utilisez le modèle Flash pour des résultats plus rapides'],
      },
      {
        symptom: 'Les descriptions générées sont de mauvaise qualité',
        causes: ['Données produit insuffisantes', 'Template mal configuré', 'Mauvais choix de ton/langue'],
        steps: ['Ajoutez plus de détails au produit (specs, catégorie, marque)', 'Configurez un template personnalisé dans IA > Templates', 'Ajustez le ton (professionnel, décontracté) et la langue cible'],
      },
    ],
  },
  {
    id: 'billing',
    title: 'Facturation & Abonnement',
    icon: CreditCard,
    severity: 'minor' as const,
    problems: [
      {
        symptom: 'Mon paiement a échoué',
        causes: ['Carte expirée', 'Fonds insuffisants', 'Carte bloquée par la banque'],
        steps: ['Mettez à jour votre carte dans Paramètres > Facturation', 'Vérifiez les fonds disponibles', 'Contactez votre banque pour autoriser le paiement', 'Réessayez le paiement après 24h'],
      },
      {
        symptom: 'Mes fonctionnalités Pro ne sont plus accessibles',
        causes: ['Abonnement expiré', 'Paiement en retard', 'Downgrade accidentel'],
        steps: ['Vérifiez votre statut d\'abonnement dans Paramètres > Plan', 'Régularisez le paiement si nécessaire', 'Contactez le support pour une restauration rapide'],
      },
    ],
  },
]

// ─── Guides Data ───────────────────────────────────────────────────
const GUIDES = [
  { id: '1', title: 'Guide de démarrage rapide', desc: 'Les bases en 10 minutes', duration: '10 min', level: 'Débutant' as const, cat: 'Démarrage', type: 'article' as const, url: '/guides/quick-start' },
  { id: '2', title: 'Maîtriser l\'import de données', desc: 'Techniques avancées d\'import et nettoyage', duration: '25 min', level: 'Intermédiaire' as const, cat: 'Import', type: 'video' as const, url: '/guides/data-import' },
  { id: '3', title: 'Automatisation avec l\'IA', desc: 'Workflows intelligents pour votre business', duration: '30 min', level: 'Avancé' as const, cat: 'IA', type: 'tutorial' as const, url: '/guides/ai-automation' },
  { id: '4', title: 'Analytics et reporting', desc: 'Comprendre vos métriques de performance', duration: '20 min', level: 'Intermédiaire' as const, cat: 'Analytics', type: 'article' as const, url: '/guides/analytics' },
  { id: '5', title: 'Connecter Shopify pas à pas', desc: 'Guide complet de connexion et synchronisation', duration: '15 min', level: 'Débutant' as const, cat: 'Intégrations', type: 'tutorial' as const, url: '/guides/shopify-connect' },
  { id: '6', title: 'SEO & optimisation produits', desc: 'Boostez vos fiches avec l\'IA SEO', duration: '20 min', level: 'Intermédiaire' as const, cat: 'IA', type: 'video' as const, url: '/guides/seo-optimization' },
  { id: '7', title: 'Gestion multi-boutiques', desc: 'Centralisez plusieurs boutiques et marketplaces', duration: '35 min', level: 'Avancé' as const, cat: 'Intégrations', type: 'tutorial' as const, url: '/guides/multi-store' },
  { id: '8', title: 'API & webhooks développeur', desc: 'Intégrez ShopOpti+ dans votre stack', duration: '45 min', level: 'Avancé' as const, cat: 'API', type: 'tutorial' as const, url: '/api-documentation' },
]

// ─── Component ─────────────────────────────────────────────────────
export default function HelpCenterPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFaqCat, setSelectedFaqCat] = useState('all')

  const filteredFAQ = useMemo(() => FAQ_ITEMS.filter(item => {
    const matchesSearch = !searchQuery || item.q.toLowerCase().includes(searchQuery.toLowerCase()) || item.a.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCat = selectedFaqCat === 'all' || item.cat === selectedFaqCat
    return matchesSearch && matchesCat
  }), [searchQuery, selectedFaqCat])

  const filteredPlaybook = useMemo(() => {
    if (!searchQuery) return PLAYBOOK_SECTIONS
    const q = searchQuery.toLowerCase()
    return PLAYBOOK_SECTIONS.map(s => ({
      ...s,
      problems: s.problems.filter(p =>
        p.symptom.toLowerCase().includes(q) ||
        p.causes.some(c => c.toLowerCase().includes(q)) ||
        p.steps.some(st => st.toLowerCase().includes(q))
      )
    })).filter(s => s.problems.length > 0)
  }, [searchQuery])

  const filteredGuides = useMemo(() => {
    if (!searchQuery) return GUIDES
    const q = searchQuery.toLowerCase()
    return GUIDES.filter(g => g.title.toLowerCase().includes(q) || g.desc.toLowerCase().includes(q))
  }, [searchQuery])

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'critical': return 'text-destructive bg-destructive/10'
      case 'important': return 'text-warning bg-warning/10'
      default: return 'text-muted-foreground bg-muted'
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Débutant': return 'bg-success/10 text-success'
      case 'Intermédiaire': return 'bg-warning/10 text-warning'
      case 'Avancé': return 'bg-destructive/10 text-destructive'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <ChannablePageWrapper
      title="Centre d'aide"
      subtitle="Support & Documentation"
      description="FAQ, documentation, playbook de dépannage et guides — tout ce dont vous avez besoin."
      heroImage="support"
      badge={{ label: 'Help Center', icon: HelpCircle }}
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
          {[
            { icon: FileText, value: '150+', label: 'Articles', color: 'text-info' },
            { icon: Video, value: '45', label: 'Vidéos', color: 'text-success' },
            { icon: HelpCircle, value: `${FAQ_ITEMS.length}`, label: 'FAQ', color: 'text-primary' },
            { icon: Wrench, value: `${PLAYBOOK_SECTIONS.reduce((a, s) => a + s.problems.length, 0)}`, label: 'Dépannages', color: 'text-warning' },
            { icon: Clock, value: '< 2h', label: 'Réponse', color: 'text-destructive' },
          ].map((s, i) => (
            <Card key={i}>
              <CardContent className="p-3 flex items-center gap-3">
                <s.icon className={`h-6 w-6 ${s.color} shrink-0`} />
                <div>
                  <p className="text-lg font-bold leading-tight">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher dans la FAQ, le playbook, les guides..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-3 md:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate('/support')}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10 group-hover:bg-info/20 transition-colors">
                <MessageCircle className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="font-medium text-sm">Chat & Tickets</p>
                <p className="text-xs text-muted-foreground">Support structuré</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate('/api-documentation')}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Code2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Documentation API</p>
                <p className="text-xs text-muted-foreground">Swagger & SDK</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate('/academy')}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10 group-hover:bg-success/20 transition-colors">
                <Video className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="font-medium text-sm">Academy</p>
                <p className="text-xs text-muted-foreground">Tutoriels vidéo</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate('/guides/quick-start')}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10 group-hover:bg-warning/20 transition-colors">
                <Zap className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="font-medium text-sm">Démarrage rapide</p>
                <p className="text-xs text-muted-foreground">Guide étape par étape</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="faq">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="faq" className="gap-1 text-xs sm:text-sm">
              <HelpCircle className="h-4 w-4 hidden sm:block" />
              FAQ
            </TabsTrigger>
            <TabsTrigger value="playbook" className="gap-1 text-xs sm:text-sm">
              <Wrench className="h-4 w-4 hidden sm:block" />
              Dépannage
            </TabsTrigger>
            <TabsTrigger value="documentation" className="gap-1 text-xs sm:text-sm">
              <BookOpen className="h-4 w-4 hidden sm:block" />
              Documentation
            </TabsTrigger>
            <TabsTrigger value="guides" className="gap-1 text-xs sm:text-sm">
              <Book className="h-4 w-4 hidden sm:block" />
              Guides
            </TabsTrigger>
          </TabsList>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {FAQ_CATEGORIES.map(cat => (
                <Button
                  key={cat.id}
                  variant={selectedFaqCat === cat.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFaqCat(cat.id)}
                  className="gap-1"
                >
                  <cat.icon className="h-3 w-3" />
                  {cat.label}
                </Button>
              ))}
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Questions fréquentes</CardTitle>
                <CardDescription>{filteredFAQ.length} résultat{filteredFAQ.length > 1 ? 's' : ''}</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {filteredFAQ.map(item => (
                    <AccordionItem key={item.id} value={item.id}>
                      <AccordionTrigger className="text-left text-sm">
                        <div className="flex items-center gap-2 w-full mr-4">
                          <span className="flex-1">{item.q}</span>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                            <ThumbsUp className="h-3 w-3" />
                            {item.helpful}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-muted-foreground text-sm">{item.a}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                {filteredFAQ.length === 0 && (
                  <div className="text-center py-8">
                    <Search className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Aucun résultat. Essayez une autre recherche ou contactez le support.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Playbook Tab */}
          <TabsContent value="playbook" className="space-y-4">
            <Card className="bg-gradient-to-r from-warning/5 to-transparent border-warning/20">
              <CardContent className="p-4 flex items-center gap-3">
                <Wrench className="h-5 w-5 text-warning shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Playbook de dépannage</p>
                  <p className="text-xs text-muted-foreground">Résolvez les problèmes courants étape par étape — sans contacter le support</p>
                </div>
              </CardContent>
            </Card>

            {filteredPlaybook.map(section => (
              <Card key={section.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <section.icon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">{section.title}</CardTitle>
                    <Badge className={getSeverityColor(section.severity)} variant="outline">
                      {section.severity === 'critical' ? 'Critique' : section.severity === 'important' ? 'Important' : 'Mineur'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {section.problems.map((prob, idx) => (
                      <AccordionItem key={idx} value={`${section.id}-${idx}`}>
                        <AccordionTrigger className="text-left text-sm">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                            <span>{prob.symptom}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3 pl-6">
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Causes possibles</p>
                              <ul className="space-y-1">
                                {prob.causes.map((c, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <XCircle className="h-3 w-3 text-destructive mt-1 shrink-0" />
                                    {c}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Étapes de résolution</p>
                              <ol className="space-y-1">
                                {prob.steps.map((s, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm">
                                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">{i + 1}</span>
                                    {s}
                                  </li>
                                ))}
                              </ol>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}

            {filteredPlaybook.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="h-8 w-8 mx-auto text-success mb-2" />
                  <p className="text-sm text-muted-foreground">Aucun problème correspondant trouvé.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Documentation Tab */}
          <TabsContent value="documentation" className="space-y-4">
            <Card className="bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold text-sm">Documentation Professionnelle</p>
                    <p className="text-xs text-muted-foreground">15 modules • Guides complets • Tous niveaux</p>
                  </div>
                </div>
                <Button size="sm" onClick={() => navigate('/help-center/documentation')} className="gap-1">
                  Voir tout
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
            <DocumentationHub onSelectModule={(moduleId) => {
              try {
                const { ALL_DOCUMENTATION } = require('@/data/documentation')
                const mod = ALL_DOCUMENTATION.find((m: any) => m.id === moduleId)
                if (mod) navigate(`/help-center/documentation/${mod.slug}`)
              } catch { /* ignore */ }
            }} />
          </TabsContent>

          {/* Guides Tab */}
          <TabsContent value="guides" className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              {filteredGuides.map(guide => (
                <Card key={guide.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(guide.url)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {guide.type === 'video' ? <Video className="h-4 w-4 text-info" /> : guide.type === 'tutorial' ? <Zap className="h-4 w-4 text-warning" /> : <Book className="h-4 w-4 text-primary" />}
                        <CardTitle className="text-sm">{guide.title}</CardTitle>
                      </div>
                      <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                    </div>
                    <CardDescription className="text-xs">{guide.desc}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getLevelColor(guide.level)} variant="outline">{guide.level}</Badge>
                        <Badge variant="outline" className="text-xs">{guide.cat}</Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {guide.duration}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Contact CTA */}
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">Vous n'avez pas trouvé votre réponse ?</p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => navigate('/support')} className="gap-2">
                <MessageCircle className="h-4 w-4" />
                Contacter le support
              </Button>
              <Button variant="outline" onClick={() => navigate('/customer-service/tickets')} className="gap-2">
                <Mail className="h-4 w-4" />
                Ouvrir un ticket
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ChannablePageWrapper>
  )
}
