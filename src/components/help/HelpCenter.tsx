import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { 
  HelpCircle, Search, Book, Video, MessageCircle, 
  ExternalLink, ChevronRight, Lightbulb, Zap, Package,
  ShoppingCart, TrendingUp, Settings, Users
} from 'lucide-react'

const FAQ_ITEMS = [
  {
    category: 'Démarrage',
    questions: [
      { q: "Comment importer mes premiers produits ?", a: "Allez dans Import > CSV/URL, sélectionnez votre fichier et mappez les colonnes. L'assistant vous guidera." },
      { q: "Comment connecter ma boutique Shopify ?", a: "Dans Boutiques & Canaux, cliquez sur 'Connecter', choisissez Shopify et suivez l'authentification OAuth." },
      { q: "Qu'est-ce que le score d'audit produit ?", a: "C'est une note de 0-100 évaluant la qualité SEO, images, descriptions de vos produits pour optimiser les ventes." },
    ]
  },
  {
    category: 'Produits',
    questions: [
      { q: "Comment optimiser mes titres avec l'IA ?", a: "Sur la fiche produit, cliquez sur 'Optimiser avec IA' pour générer automatiquement des titres SEO-friendly." },
      { q: "Comment gérer les variantes ?", a: "Dans l'éditeur produit, onglet 'Variantes', ajoutez taille/couleur avec leurs prix et stocks respectifs." },
      { q: "Comment publier sur plusieurs canaux ?", a: "Sélectionnez les produits, cliquez 'Actions en masse' > 'Publier' et choisissez vos canaux cibles." },
    ]
  },
  {
    category: 'Automatisations',
    questions: [
      { q: "Comment créer une règle de repricing ?", a: "Dans Automatisations, créez un workflow avec trigger 'Prix modifié' et action 'Mettre à jour prix'." },
      { q: "Comment recevoir des alertes stock ?", a: "Configurez une alerte dans Automatisations avec trigger 'Stock faible' et action 'Notification'." },
      { q: "Puis-je connecter Zapier/Make ?", a: "Oui, utilisez les webhooks dans vos workflows pour déclencher des actions externes." },
    ]
  },
  {
    category: 'Fournisseurs',
    questions: [
      { q: "Comment ajouter un fournisseur ?", a: "Dans Fournisseurs > Connecter, entrez l'URL ou les identifiants API du fournisseur." },
      { q: "Comment synchroniser les stocks ?", a: "Activez la sync auto dans les paramètres du fournisseur ou lancez manuellement depuis le tableau de bord." },
      { q: "Que faire si un produit est en rupture ?", a: "Configurez une alerte automatique et/ou un fournisseur de backup dans les paramètres." },
    ]
  }
]

const TUTORIALS = [
  { title: "Démarrage rapide", duration: "5 min", icon: Zap, category: "Bases" },
  { title: "Import CSV avancé", duration: "8 min", icon: Package, category: "Import" },
  { title: "Optimisation IA produits", duration: "6 min", icon: Lightbulb, category: "IA" },
  { title: "Créer des workflows", duration: "10 min", icon: Settings, category: "Automation" },
  { title: "Multi-canal publishing", duration: "7 min", icon: ShoppingCart, category: "Canaux" },
  { title: "Analytics & rapports", duration: "5 min", icon: TrendingUp, category: "Analytics" },
]

const GUIDES = [
  { title: "Guide complet du dropshipping", pages: 25, icon: Book },
  { title: "Optimisation SEO e-commerce", pages: 18, icon: Book },
  { title: "Stratégies de pricing", pages: 12, icon: Book },
  { title: "Gestion multi-fournisseurs", pages: 15, icon: Book },
]

export function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const filteredFAQ = FAQ_ITEMS.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
           q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(c => c.questions.length > 0)

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="fixed bottom-20 right-4 z-50 h-12 w-12 rounded-full shadow-lg">
          <HelpCircle className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Centre d'aide ShopOpti
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans l'aide..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs defaultValue="faq" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="faq">FAQ</TabsTrigger>
              <TabsTrigger value="tutorials">Tutoriels</TabsTrigger>
              <TabsTrigger value="guides">Guides</TabsTrigger>
            </TabsList>

            <TabsContent value="faq" className="mt-4">
              <ScrollArea className="h-[60vh]">
                {filteredFAQ.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Aucun résultat pour "{searchQuery}"
                  </p>
                ) : (
                  <Accordion type="single" collapsible className="space-y-2">
                    {filteredFAQ.map((category, idx) => (
                      <div key={idx} className="space-y-2">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                          {category.category}
                        </h4>
                        {category.questions.map((item, qIdx) => (
                          <AccordionItem key={qIdx} value={`${idx}-${qIdx}`} className="border rounded-lg px-4">
                            <AccordionTrigger className="text-sm text-left hover:no-underline">
                              {item.q}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                              {item.a}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </div>
                    ))}
                  </Accordion>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="tutorials" className="mt-4">
              <ScrollArea className="h-[60vh]">
                <div className="space-y-2">
                  {TUTORIALS.map((tutorial, idx) => (
                    <Card key={idx} className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <tutorial.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{tutorial.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {tutorial.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {tutorial.duration}
                            </span>
                          </div>
                        </div>
                        <Video className="h-4 w-4 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="guides" className="mt-4">
              <ScrollArea className="h-[60vh]">
                <div className="space-y-2">
                  {GUIDES.map((guide, idx) => (
                    <Card key={idx} className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-secondary/10">
                          <guide.icon className="h-5 w-5 text-secondary-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{guide.title}</p>
                          <span className="text-xs text-muted-foreground">
                            {guide.pages} pages
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {/* Contact */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">Besoin d'aide ?</p>
                  <p className="text-xs text-muted-foreground">Contactez le support</p>
                </div>
              </div>
              <Button size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Contacter
              </Button>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function ContextualHelp({ topic, children }: { topic: string; children: React.ReactNode }) {
  return (
    <div className="group relative inline-flex items-center">
      {children}
      <HelpCircle className="ml-1 h-4 w-4 text-muted-foreground cursor-help" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 w-48 text-center">
        {topic}
      </div>
    </div>
  )
}
