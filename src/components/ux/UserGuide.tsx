import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  BookOpen,
  Search,
  Play,
  CheckCircle,
  Rocket,
  Package,
  BarChart3,
  Settings,
  Zap,
  MessageCircle,
  ExternalLink,
} from 'lucide-react'

interface GuideSection {
  id: string
  title: string
  icon: React.ElementType
  badge?: string
  items: {
    title: string
    description: string
    duration?: string
    videoUrl?: string
    completed?: boolean
    badge?: string
  }[]
}

const guideSections: GuideSection[] = [
  {
    id: 'getting-started',
    title: 'Démarrage rapide',
    icon: Rocket,
    badge: 'Essentiel',
    items: [
      {
        title: 'Configuration initiale',
        description: 'Configurez votre compte et vos préférences de base pour commencer à utiliser la plateforme.',
        duration: '5 min',
        videoUrl: '#',
      },
      {
        title: 'Connecter votre première boutique',
        description: 'Connectez Shopify, WooCommerce, PrestaShop ou autre marketplace en quelques clics.',
        duration: '10 min',
        videoUrl: '#',
      },
      {
        title: 'Importer vos premiers produits',
        description: 'Découvrez les différentes méthodes d\'import : CSV, API, scraping intelligent.',
        duration: '8 min',
        videoUrl: '#',
      },
      {
        title: 'Tour de l\'interface',
        description: 'Familiarisez-vous avec le dashboard et les principales fonctionnalités.',
        duration: '7 min',
        videoUrl: '#',
      },
    ],
  },
  {
    id: 'products',
    title: 'Gestion des produits',
    icon: Package,
    items: [
      {
        title: 'Organisation du catalogue',
        description: 'Structurez et catégorisez vos produits efficacement avec les tags et collections.',
        duration: '12 min',
      },
      {
        title: 'Optimisation SEO automatique',
        description: 'Utilisez l\'IA pour optimiser vos titres, descriptions et mots-clés.',
        duration: '15 min',
        badge: 'AI',
      },
      {
        title: 'Gestion des stocks en temps réel',
        description: 'Synchronisez vos stocks sur toutes vos plateformes automatiquement.',
        duration: '10 min',
      },
      {
        title: 'Import en masse depuis fournisseurs',
        description: 'Importez des milliers de produits depuis AliExpress, BigBuy, Spocket et 99+ autres.',
        duration: '15 min',
      },
    ],
  },
  {
    id: 'orders',
    title: 'Commandes & Fulfillment',
    icon: Package,
    items: [
      {
        title: 'Traitement automatique des commandes',
        description: 'Automatisez le passage des commandes chez vos fournisseurs.',
        duration: '12 min',
      },
      {
        title: 'Suivi des expéditions',
        description: 'Suivez tous vos colis en temps réel et notifiez vos clients automatiquement.',
        duration: '10 min',
      },
      {
        title: 'Gestion des retours',
        description: 'Traitez les demandes de retour et remboursements efficacement.',
        duration: '8 min',
      },
    ],
  },
  {
    id: 'automation',
    title: 'Automation & Workflows',
    icon: Zap,
    badge: 'Premium',
    items: [
      {
        title: 'Règles d\'automation',
        description: 'Créez des workflows automatisés pour vos tâches répétitives : pricing, stocks, notifications.',
        duration: '20 min',
      },
      {
        title: 'Pricing intelligent',
        description: 'Optimisez vos prix automatiquement avec l\'IA en fonction du marché et de vos objectifs.',
        duration: '15 min',
        badge: 'AI',
      },
      {
        title: 'Alertes et notifications',
        description: 'Configurez des alertes intelligentes : ruptures de stock, prix concurrents, performances.',
        duration: '8 min',
      },
      {
        title: 'Triggers et conditions',
        description: 'Définissez des conditions avancées pour déclencher vos automatisations.',
        duration: '12 min',
      },
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics & Rapports',
    icon: BarChart3,
    items: [
      {
        title: 'Dashboard analytics',
        description: 'Comprenez vos métriques clés en un coup d\'œil : CA, marges, conversions.',
        duration: '10 min',
      },
      {
        title: 'Rapports personnalisés',
        description: 'Créez des rapports sur mesure et programmez leur envoi automatique.',
        duration: '15 min',
      },
      {
        title: 'Insights prédictifs',
        description: 'Anticipez les tendances et les ruptures avec l\'IA prédictive.',
        duration: '12 min',
        badge: 'AI',
      },
      {
        title: 'Comparaison multi-périodes',
        description: 'Analysez l\'évolution de vos performances sur différentes périodes.',
        duration: '8 min',
      },
    ],
  },
  {
    id: 'marketing',
    title: 'Marketing & CRM',
    icon: MessageCircle,
    badge: 'Pro',
    items: [
      {
        title: 'Campagnes email automatisées',
        description: 'Créez des séquences email pour fidéliser vos clients et récupérer les paniers abandonnés.',
        duration: '18 min',
      },
      {
        title: 'Segmentation clients',
        description: 'Segmentez votre base clients pour des communications ciblées.',
        duration: '12 min',
      },
      {
        title: 'Publicités Facebook & Google',
        description: 'Gérez vos campagnes publicitaires et analysez leur ROI depuis la plateforme.',
        duration: '20 min',
      },
    ],
  },
  {
    id: 'integrations',
    title: 'Intégrations & API',
    icon: Settings,
    items: [
      {
        title: 'Connecter des marketplaces',
        description: 'Intégrez Amazon, eBay, Cdiscount et autres marketplaces populaires.',
        duration: '15 min',
      },
      {
        title: 'API REST et Webhooks',
        description: 'Utilisez notre API pour créer des intégrations personnalisées.',
        duration: '25 min',
      },
      {
        title: 'Zapier et Make',
        description: 'Connectez ShopOpti+ à des milliers d\'autres outils via Zapier ou Make.',
        duration: '10 min',
      },
    ],
  },
  {
    id: 'security',
    title: 'Sécurité & Conformité',
    icon: Settings,
    items: [
      {
        title: 'Gestion des accès',
        description: 'Configurez les rôles et permissions pour votre équipe.',
        duration: '10 min',
      },
      {
        title: 'Double authentification',
        description: 'Sécurisez votre compte avec l\'authentification à deux facteurs.',
        duration: '5 min',
      },
      {
        title: 'Conformité RGPD',
        description: 'Gérez les données personnelles conformément à la réglementation européenne.',
        duration: '12 min',
      },
    ],
  },
  {
    id: 'mobile',
    title: 'Application mobile',
    icon: Settings,
    badge: 'Nouveau',
    items: [
      {
        title: 'Installation PWA',
        description: 'Installez l\'application progressive sur votre smartphone.',
        duration: '3 min',
      },
      {
        title: 'Notifications push',
        description: 'Recevez des alertes en temps réel sur votre mobile.',
        duration: '5 min',
      },
      {
        title: 'Gestion en déplacement',
        description: 'Gérez vos commandes et stocks depuis n\'importe où.',
        duration: '8 min',
      },
    ],
  },
  {
    id: 'advanced',
    title: 'Fonctionnalités avancées',
    icon: Settings,
    badge: 'Enterprise',
    items: [
      {
        title: 'Multi-tenant',
        description: 'Gérez plusieurs boutiques et clients depuis un seul compte administrateur.',
        duration: '18 min',
      },
      {
        title: 'White label',
        description: 'Personnalisez l\'interface avec votre marque pour vos clients.',
        duration: '15 min',
      },
      {
        title: 'Import/Export avancé',
        description: 'Utilisez les formats XML, JSON et les mappings personnalisés.',
        duration: '20 min',
      },
    ],
  },
]

export function UserGuide() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSection, setActiveSection] = useState<string>('getting-started')

  const filteredSections = guideSections.filter(
    (section) =>
      section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.items.some((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
  )

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-primary rounded-lg">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Guide utilisateur</h1>
              <p className="text-muted-foreground">
                Apprenez à maîtriser toutes les fonctionnalités de votre plateforme
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans le guide..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              aria-label="Rechercher dans le guide"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sections</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  <div className="space-y-1 p-4">
                    {guideSections.map((section) => (
                      <Button
                        key={section.id}
                        variant={activeSection === section.id ? 'secondary' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => setActiveSection(section.id)}
                      >
                        <section.icon className="h-4 w-4 mr-2" />
                        <span className="flex-1 text-left">{section.title}</span>
                        {section.badge && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {section.badge}
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Besoin d'aide ?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="/support" aria-label="Contacter le support">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contacter le support
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="/knowledge-base" aria-label="Centre d'aide complet">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Centre d'aide complet
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          <div className="md:col-span-2">
            <Card>
              <CardContent className="p-6">
                <ScrollArea className="h-[700px] pr-4">
                  {filteredSections.map((section) => (
                    <motion.div
                      key={section.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mb-8"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <section.icon className="h-6 w-6 text-primary" />
                        <h2 className="text-2xl font-bold">{section.title}</h2>
                        {section.badge && (
                          <Badge className="bg-gradient-primary">
                            {section.badge}
                          </Badge>
                        )}
                      </div>

                      <Accordion type="single" collapsible className="space-y-2">
                        {section.items.map((item, index) => (
                          <AccordionItem
                            key={index}
                            value={`${section.id}-${index}`}
                            className="border rounded-lg px-4"
                          >
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center gap-3 flex-1">
                                {item.completed && (
                                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                                )}
                                <div className="text-left flex-1">
                                  <div className="font-medium">{item.title}</div>
                                  {item.duration && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {item.duration}
                                    </div>
                                  )}
                                </div>
                                {item.badge && (
                                  <Badge variant="secondary" className="text-xs">
                                    {item.badge}
                                  </Badge>
                                )}
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-4 pb-4">
                              <p className="text-muted-foreground mb-4">
                                {item.description}
                              </p>
                              {item.videoUrl && (
                                <Button size="sm" className="bg-gradient-primary">
                                  <Play className="h-4 w-4 mr-2" />
                                  Voir le tutoriel vidéo
                                </Button>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </motion.div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  )
}