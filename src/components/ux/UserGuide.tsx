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
        description: 'Configurez votre compte et vos préférences de base',
        duration: '5 min',
        videoUrl: '#',
      },
      {
        title: 'Connecter votre première boutique',
        description: 'Connectez Shopify, WooCommerce ou autre marketplace',
        duration: '10 min',
        videoUrl: '#',
      },
      {
        title: 'Importer vos premiers produits',
        description: 'Découvrez les différentes méthodes d\'import',
        duration: '8 min',
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
        description: 'Structurez et catégorisez vos produits efficacement',
        duration: '12 min',
      },
      {
        title: 'Optimisation SEO automatique',
        description: 'Utilisez l\'IA pour optimiser vos descriptions',
        duration: '15 min',
        badge: 'AI',
      },
      {
        title: 'Gestion des stocks en temps réel',
        description: 'Synchronisez vos stocks sur toutes vos plateformes',
        duration: '10 min',
      },
    ],
  },
  {
    id: 'automation',
    title: 'Automation & IA',
    icon: Zap,
    badge: 'Premium',
    items: [
      {
        title: 'Règles d\'automation',
        description: 'Créez des workflows automatisés pour vos tâches répétitives',
        duration: '20 min',
      },
      {
        title: 'Pricing intelligent',
        description: 'Optimisez vos prix automatiquement avec l\'IA',
        duration: '15 min',
        badge: 'AI',
      },
      {
        title: 'Alertes et notifications',
        description: 'Configurez des alertes intelligentes pour votre business',
        duration: '8 min',
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
        description: 'Comprenez vos métriques clés en un coup d\'œil',
        duration: '10 min',
      },
      {
        title: 'Rapports personnalisés',
        description: 'Créez des rapports adaptés à vos besoins',
        duration: '15 min',
      },
      {
        title: 'Insights prédictifs',
        description: 'Anticipez les tendances avec l\'IA prédictive',
        duration: '12 min',
        badge: 'AI',
      },
    ],
  },
  {
    id: 'advanced',
    title: 'Fonctionnalités avancées',
    icon: Settings,
    items: [
      {
        title: 'API et webhooks',
        description: 'Intégrez des services tiers via notre API',
        duration: '25 min',
      },
      {
        title: 'Multi-tenant',
        description: 'Gérez plusieurs boutiques depuis un seul compte',
        duration: '18 min',
        badge: 'Enterprise',
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
                  <a
                    href="https://docs.example.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Documentation complète"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Documentation complète
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