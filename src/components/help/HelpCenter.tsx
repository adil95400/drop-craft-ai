import { useState, useCallback, useMemo } from 'react'
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetDescription
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { 
  HelpCircle, 
  Search, 
  Book, 
  MessageCircle, 
  Video, 
  FileText,
  ExternalLink,
  ChevronRight,
  Zap,
  Store,
  Package,
  TrendingUp,
  Settings,
  Users,
  ShoppingCart
} from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'

interface HelpArticle {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  icon?: React.ElementType
}

interface FAQ {
  question: string
  answer: string
  category: string
}

const HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'getting-started',
    title: 'Premiers pas avec ShopOpti',
    content: `
## Bienvenue sur ShopOpti !

ShopOpti est votre plateforme tout-en-un pour le dropshipping intelligent.

### Étapes pour commencer :

1. **Connectez votre boutique** - Intégrez Shopify, WooCommerce ou PrestaShop
2. **Ajoutez des fournisseurs** - Connectez BigBuy, Cdiscount Pro, ou importez manuellement
3. **Importez vos produits** - Choisissez les produits à vendre depuis vos fournisseurs
4. **Optimisez avec l'IA** - Améliorez descriptions, prix et SEO automatiquement
5. **Publiez et vendez** - Synchronisez vos produits vers votre boutique

### Besoin d'aide ?
Utilisez le chat d'assistance ou consultez nos guides vidéo.
    `,
    category: 'démarrage',
    tags: ['commencer', 'premiers pas', 'guide'],
    icon: Zap
  },
  {
    id: 'connect-store',
    title: 'Connecter votre boutique',
    content: `
## Intégration boutique

ShopOpti supporte les principales plateformes e-commerce :

### Shopify
1. Allez dans **Intégrations > Shopify**
2. Cliquez sur "Connecter Shopify"
3. Autorisez l'accès à votre boutique
4. Vos produits seront synchronisés automatiquement

### WooCommerce
1. Installez le plugin WooCommerce REST API
2. Générez des clés API (Lecture/Écriture)
3. Entrez vos clés dans ShopOpti
4. Testez la connexion

### PrestaShop
1. Activez l'API webservice dans PrestaShop
2. Créez une clé API avec les permissions requises
3. Configurez dans ShopOpti
    `,
    category: 'intégrations',
    tags: ['shopify', 'woocommerce', 'prestashop', 'connexion'],
    icon: Store
  },
  {
    id: 'import-products',
    title: 'Importer des produits',
    content: `
## Guide d'importation

### Depuis un fournisseur
1. Sélectionnez le fournisseur (BigBuy, AliExpress, etc.)
2. Parcourez ou recherchez des produits
3. Ajoutez au panier d'import
4. Configurez les prix et marges
5. Importez vers votre catalogue

### Par fichier CSV
1. Téléchargez notre template CSV
2. Remplissez avec vos produits
3. Uploadez le fichier
4. Mappez les colonnes
5. Validez l'import

### Par URL
1. Collez l'URL du produit fournisseur
2. ShopOpti extrait les données automatiquement
3. Modifiez si nécessaire
4. Importez
    `,
    category: 'produits',
    tags: ['import', 'csv', 'fournisseur', 'produits'],
    icon: Package
  },
  {
    id: 'ai-optimization',
    title: 'Optimisation IA',
    content: `
## Fonctionnalités IA

### Génération de descriptions
L'IA analyse votre produit et génère des descriptions optimisées SEO :
- Ton adapté à votre audience
- Mots-clés pertinents intégrés
- Structure claire avec avantages

### Optimisation des prix
- Analyse des marges recommandées
- Comparaison concurrentielle
- Suggestions de prix dynamiques

### Amélioration SEO
- Titres optimisés pour le référencement
- Meta descriptions générées
- Tags et catégories suggérés

### Traduction automatique
- Traduisez vos fiches en plusieurs langues
- Conservation du ton marketing
- Adaptation culturelle
    `,
    category: 'ia',
    tags: ['ia', 'seo', 'description', 'prix', 'optimisation'],
    icon: TrendingUp
  },
  {
    id: 'manage-orders',
    title: 'Gestion des commandes',
    content: `
## Traitement des commandes

### Flux de commande
1. Réception de commande depuis votre boutique
2. Notification automatique
3. Transmission au fournisseur
4. Suivi d'expédition
5. Mise à jour du statut client

### Automatisation
Activez le traitement automatique :
- Commandes transmises immédiatement
- Tracking synchronisé
- Emails automatiques aux clients

### Gestion manuelle
Pour les cas particuliers :
- Validation avant envoi
- Modification de l'adresse
- Annulation possible
    `,
    category: 'commandes',
    tags: ['commandes', 'traitement', 'automatisation', 'suivi'],
    icon: ShoppingCart
  }
]

const FAQS: FAQ[] = [
  {
    question: 'Comment connecter ma boutique Shopify ?',
    answer: 'Allez dans Intégrations > Shopify, cliquez sur "Connecter" et suivez les étapes d\'autorisation. La synchronisation démarre automatiquement.',
    category: 'intégrations'
  },
  {
    question: 'Combien de produits puis-je importer ?',
    answer: 'Le nombre de produits dépend de votre plan. Free: 50 produits, Pro: 5000 produits, Ultra Pro: illimité.',
    category: 'produits'
  },
  {
    question: 'Comment fonctionne l\'optimisation IA ?',
    answer: 'Notre IA analyse vos produits et génère des descriptions SEO optimisées, suggère des prix compétitifs et améliore vos titres pour le référencement.',
    category: 'ia'
  },
  {
    question: 'Les commandes sont-elles automatiquement transmises aux fournisseurs ?',
    answer: 'Oui, si vous activez l\'automatisation. Vous pouvez aussi traiter manuellement chaque commande depuis le tableau de bord.',
    category: 'commandes'
  },
  {
    question: 'Comment contacter le support ?',
    answer: 'Utilisez le chat en bas à droite, envoyez un email à support@shopopti.com, ou consultez notre documentation.',
    category: 'support'
  },
  {
    question: 'Puis-je exporter mes données ?',
    answer: 'Oui, tous vos produits, commandes et analytics peuvent être exportés en CSV depuis les paramètres.',
    category: 'général'
  },
  {
    question: 'Quels fournisseurs sont supportés ?',
    answer: 'BigBuy, Cdiscount Pro, AliExpress, et vous pouvez importer depuis n\'importe quel fournisseur via CSV ou API.',
    category: 'fournisseurs'
  },
  {
    question: 'Comment modifier mon plan ?',
    answer: 'Allez dans Paramètres > Plan & Facturation pour upgrader ou modifier votre abonnement.',
    category: 'facturation'
  }
]

const QUICK_LINKS = [
  { title: 'Guide de démarrage', icon: Book, href: '/docs/getting-started' },
  { title: 'Tutoriels vidéo', icon: Video, href: '/tutorials' },
  { title: 'Documentation API', icon: FileText, href: '/docs/api' },
  { title: 'Contacter le support', icon: MessageCircle, href: '/support' }
]

export function HelpCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('articles')

  const debouncedSearch = useDebounce(searchQuery, 300)

  // Filter articles based on search
  const filteredArticles = useMemo(() => {
    if (!debouncedSearch) return HELP_ARTICLES
    const query = debouncedSearch.toLowerCase()
    return HELP_ARTICLES.filter(article =>
      article.title.toLowerCase().includes(query) ||
      article.tags.some(tag => tag.includes(query)) ||
      article.category.includes(query)
    )
  }, [debouncedSearch])

  // Filter FAQs based on search
  const filteredFAQs = useMemo(() => {
    if (!debouncedSearch) return FAQS
    const query = debouncedSearch.toLowerCase()
    return FAQS.filter(faq =>
      faq.question.toLowerCase().includes(query) ||
      faq.answer.toLowerCase().includes(query)
    )
  }, [debouncedSearch])

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg z-50"
          aria-label="Ouvrir le centre d'aide"
        >
          <HelpCircle className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg p-0">
        <SheetHeader className="p-6 pb-0">
          <SheetTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Centre d'aide
          </SheetTitle>
          <SheetDescription>
            Trouvez rapidement des réponses et guides
          </SheetDescription>
        </SheetHeader>

        <div className="p-6 pt-4">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans l'aide..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {QUICK_LINKS.map((link) => (
              <Button
                key={link.title}
                variant="outline"
                className="h-auto py-3 justify-start"
                onClick={() => window.location.href = link.href}
              >
                <link.icon className="h-4 w-4 mr-2 text-primary" />
                <span className="text-sm">{link.title}</span>
              </Button>
            ))}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="articles" className="flex-1">
                Guides
              </TabsTrigger>
              <TabsTrigger value="faq" className="flex-1">
                FAQ
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[calc(100vh-380px)] mt-4">
              <TabsContent value="articles" className="mt-0 space-y-3">
                {filteredArticles.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Aucun article trouvé
                  </p>
                ) : (
                  filteredArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="faq" className="mt-0">
                {filteredFAQs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Aucune question trouvée
                  </p>
                ) : (
                  <Accordion type="single" collapsible className="space-y-2">
                    {filteredFAQs.map((faq, index) => (
                      <AccordionItem 
                        key={index} 
                        value={`faq-${index}`}
                        className="border rounded-lg px-4"
                      >
                        <AccordionTrigger className="text-left text-sm hover:no-underline">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background">
          <p className="text-xs text-center text-muted-foreground">
            Besoin d'aide supplémentaire ?{' '}
            <Button variant="link" className="h-auto p-0 text-xs">
              Contacter le support
            </Button>
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Article card component
function ArticleCard({ article }: { article: HelpArticle }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const Icon = article.icon || FileText

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-sm">{article.title}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {article.category}
              </Badge>
            </div>
          </div>
          <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="p-4 pt-0">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-sm text-muted-foreground">
              {article.content}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// Inline help button for specific contexts
interface InlineHelpProps {
  articleId: string
  size?: 'sm' | 'default'
}

export function InlineHelp({ articleId, size = 'sm' }: InlineHelpProps) {
  const article = HELP_ARTICLES.find(a => a.id === articleId)
  
  if (!article) return null

  return (
    <Button variant="ghost" size={size === 'sm' ? 'icon' : 'sm'} className="h-6 w-6">
      <HelpCircle className="h-4 w-4 text-muted-foreground" />
    </Button>
  )
}
