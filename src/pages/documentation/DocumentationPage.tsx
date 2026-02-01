/**
 * Page de Documentation - Affichage dynamique par module
 */

import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChannablePageWrapper } from '@/components/channable'
import { DocumentationHub, DocumentationViewer } from '@/components/documentation'
import { getDocumentationBySlug } from '@/data/documentation'
import { Book, HelpCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DocumentationPage() {
  const { moduleSlug } = useParams<{ moduleSlug?: string }>()
  const navigate = useNavigate()
  
  // If a module slug is provided, show the module documentation
  if (moduleSlug) {
    const module = getDocumentationBySlug(moduleSlug)
    
    if (!module) {
      return (
        <ChannablePageWrapper
          title="Documentation non trouvée"
          subtitle="Erreur 404"
          description="Le module demandé n'existe pas dans notre documentation."
          heroImage="support"
          badge={{ label: 'Erreur', icon: HelpCircle }}
        >
          <Card>
            <CardContent className="p-8 text-center">
              <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Module non trouvé</h3>
              <p className="text-muted-foreground mb-4">
                Le module "{moduleSlug}" n'existe pas dans notre documentation.
              </p>
              <Button onClick={() => navigate('/help-center')}>
                Retour au Centre d'aide
              </Button>
            </CardContent>
          </Card>
        </ChannablePageWrapper>
      )
    }
    
    return (
      <ChannablePageWrapper
        title={module.title}
        subtitle={module.subtitle}
        description={module.description}
        heroImage="support"
        badge={{ label: `Guide ${module.category}`, icon: Book }}
      >
        <DocumentationViewer 
          module={module} 
          onBack={() => navigate('/help-center')}
          onNavigateToModule={(slug) => navigate(`/help-center/documentation/${slug}`)}
        />
      </ChannablePageWrapper>
    )
  }
  
  // Default: show the documentation hub
  return (
    <ChannablePageWrapper
      title="Documentation Professionnelle"
      subtitle="Base de connaissances"
      description="Guides complets, tutoriels et bonnes pratiques pour maîtriser chaque fonctionnalité de ShopOpti+."
      heroImage="support"
      badge={{ label: 'Guides Pro', icon: Book }}
    >
      <DocumentationHub 
        onSelectModule={(moduleId) => {
          // Find module by ID and navigate to its slug
          const allModules = require('@/data/documentation').ALL_DOCUMENTATION
          const module = allModules.find((m: any) => m.id === moduleId)
          if (module) {
            navigate(`/help-center/documentation/${module.slug}`)
          }
        }}
      />
    </ChannablePageWrapper>
  )
}
