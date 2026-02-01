/**
 * Viewer de Documentation - Affichage d'un module complet
 * Rendu structuré avec navigation interne
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, Clock, BookOpen, Target, Lightbulb, AlertTriangle,
  CheckCircle2, ChevronRight, ThumbsUp, ThumbsDown, ExternalLink,
  Star, Zap, Users, TrendingUp, Info, HelpCircle
} from 'lucide-react'
import { 
  type ModuleDocumentation, 
  type UserLevel,
  getRelatedDocumentation,
  getDocumentationBySlug
} from '@/data/documentation'

const LEVEL_CONFIG: Record<UserLevel, { label: string; color: string; description: string }> = {
  beginner: { 
    label: 'Débutant', 
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    description: 'Premiers pas avec le module'
  },
  intermediate: { 
    label: 'Intermédiaire', 
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    description: 'Fonctionnalités avancées'
  },
  advanced: { 
    label: 'Avancé', 
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    description: 'Optimisation et automatisation'
  },
  expert: { 
    label: 'Expert', 
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    description: 'Stratégies agence et gros volume'
  }
}

interface DocumentationViewerProps {
  module: ModuleDocumentation
  onBack?: () => void
  onNavigateToModule?: (slug: string) => void
}

export function DocumentationViewer({ module, onBack, onNavigateToModule }: DocumentationViewerProps) {
  const navigate = useNavigate()
  const [feedback, setFeedback] = useState<'helpful' | 'not-helpful' | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  
  const relatedModules = getRelatedDocumentation(module.id)
  
  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate('/help-center')
    }
  }
  
  const handleRelatedClick = (slug: string) => {
    if (onNavigateToModule) {
      onNavigateToModule(slug)
    } else {
      navigate(`/help-center/documentation/${slug}`)
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" onClick={handleBack} className="mb-2 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la documentation
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">{module.title}</h1>
          <p className="text-muted-foreground mt-1">{module.subtitle}</p>
          
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {module.targetLevels.map(level => (
              <Badge key={level} className={LEVEL_CONFIG[level].color}>
                {LEVEL_CONFIG[level].label}
              </Badge>
            ))}
            <Separator orientation="vertical" className="h-4" />
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {module.estimatedReadTime} min de lecture
            </span>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              v{module.version}
            </span>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
          <TabsTrigger value="overview" className="gap-1">
            <Info className="h-4 w-4" />
            <span className="hidden sm:inline">Vue d'ensemble</span>
            <span className="sm:hidden">Aperçu</span>
          </TabsTrigger>
          <TabsTrigger value="usecases" className="gap-1">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Cas d'usage</span>
            <span className="sm:hidden">Cas</span>
          </TabsTrigger>
          <TabsTrigger value="guide" className="gap-1">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Guide</span>
          </TabsTrigger>
          <TabsTrigger value="troubleshooting" className="gap-1">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Dépannage</span>
            <span className="sm:hidden">Aide</span>
          </TabsTrigger>
          <TabsTrigger value="expert" className="gap-1">
            <Star className="h-4 w-4" />
            <span className="hidden sm:inline">Expert</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                À quoi sert ce module ?
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>{module.overview.purpose}</p>
            </CardContent>
          </Card>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  Quand l'utiliser ?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{module.overview.whenToUse}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-500" />
                  Pour qui ?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{module.overview.targetAudience}</p>
              </CardContent>
            </Card>
          </div>
          
          {module.overview.prerequisites && module.overview.prerequisites.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-orange-500" />
                  Prérequis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {module.overview.prerequisites.map((prereq, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <ChevronRight className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span>{prereq}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Fonctionnalités clés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2">
                {module.overview.keyFeatures.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Use Cases Tab */}
        <TabsContent value="usecases" className="space-y-4">
          {(Object.keys(LEVEL_CONFIG) as UserLevel[]).map(level => {
            const useCases = module.useCases.filter(uc => uc.level === level)
            if (useCases.length === 0) return null
            
            const config = LEVEL_CONFIG[level]
            return (
              <Card key={level}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Badge className={config.color}>{config.label}</Badge>
                    <CardDescription>{config.description}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {useCases.map((useCase, idx) => (
                    <div key={idx} className="p-4 rounded-lg border bg-card">
                      <h4 className="font-semibold mb-2">{useCase.title}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{useCase.description}</p>
                      
                      {useCase.steps && useCase.steps.length > 0 && (
                        <div className="space-y-2 mb-3">
                          <p className="text-xs font-medium text-muted-foreground uppercase">Étapes:</p>
                          {useCase.steps.map((step, stepIdx) => (
                            <div key={stepIdx} className="flex items-start gap-2 text-sm">
                              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center">
                                {stepIdx + 1}
                              </span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {useCase.expectedOutcome && (
                        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                          <p className="text-sm text-green-800 dark:text-green-300 flex items-start gap-2">
                            <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span><strong>Résultat attendu:</strong> {useCase.expectedOutcome}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>
        
        {/* Step-by-Step Guide Tab */}
        <TabsContent value="guide" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Guide pas-à-pas
              </CardTitle>
              <CardDescription>
                Suivez ces étapes pour maîtriser {module.title}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {module.stepByStep.map((step, idx) => (
                <div key={idx} className="relative pl-8 pb-6 last:pb-0">
                  {/* Vertical line */}
                  {idx < module.stepByStep.length - 1 && (
                    <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-border" />
                  )}
                  
                  {/* Step number */}
                  <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                    {step.stepNumber}
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                    
                    {step.tip && (
                      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-800 dark:text-blue-300 flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span><strong>Astuce:</strong> {step.tip}</span>
                        </p>
                      </div>
                    )}
                    
                    {step.warning && (
                      <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                        <p className="text-sm text-orange-800 dark:text-orange-300 flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span><strong>Attention:</strong> {step.warning}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          
          {/* Best Practices */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Bonnes pratiques
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {module.bestPractices.recommendations.map((rec, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30">
                    <p className="font-medium text-sm">{rec.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                    <Badge variant="outline" className="mt-2 text-xs">
                      Impact: {rec.impact === 'high' ? 'Élevé' : rec.impact === 'medium' ? 'Moyen' : 'Faible'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  Pièges à éviter
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {module.bestPractices.pitfalls.map((pitfall, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
                    <p className="font-medium text-sm">{pitfall.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{pitfall.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Troubleshooting Tab */}
        <TabsContent value="troubleshooting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Problèmes fréquents & Solutions
              </CardTitle>
              <CardDescription>
                Solutions rapides aux problèmes courants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium">Symptôme</th>
                      <th className="text-left py-3 px-2 font-medium">Cause</th>
                      <th className="text-left py-3 px-2 font-medium">Solution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {module.troubleshooting.map((item, idx) => (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="py-3 px-2 align-top">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <span>{item.symptom}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 align-top text-muted-foreground">
                          {item.cause}
                        </td>
                        <td className="py-3 px-2 align-top">
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{item.solution}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          {/* FAQ */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-blue-500" />
                Questions fréquentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {module.faqs.map((faq, idx) => (
                  <AccordionItem key={idx} value={`faq-${idx}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground">{faq.answer}</p>
                      {faq.relatedLinks && faq.relatedLinks.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {faq.relatedLinks.map((link, linkIdx) => (
                            <Button key={linkIdx} variant="outline" size="sm" asChild>
                              <a href={link.url} target="_blank" rel="noopener noreferrer">
                                {link.label}
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            </Button>
                          ))}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Expert Tips Tab */}
        <TabsContent value="expert" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Conseils d'expert
              </CardTitle>
              <CardDescription>
                Stratégies utilisées par les vendeurs les plus performants
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {module.expertTips.map((tip, idx) => (
                <div key={idx} className="p-4 rounded-lg border bg-gradient-to-r from-primary/5 to-transparent">
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    {tip.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">{tip.content}</p>
                  {tip.differentiator && (
                    <div className="p-2 rounded bg-primary/10 text-sm">
                      <strong className="text-primary">Ce qui différencie ShopOpti+:</strong>{' '}
                      {tip.differentiator}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
          
          {/* Call to Value */}
          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                {module.callToValue.headline}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{module.callToValue.description}</p>
              
              {module.callToValue.metrics && module.callToValue.metrics.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-3">
                  {module.callToValue.metrics.map((metric, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-background border text-center">
                      <p className="text-2xl font-bold text-primary">{metric.value}</p>
                      <p className="text-xs text-muted-foreground">{metric.label}</p>
                      {metric.improvement && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {metric.improvement}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {module.callToValue.cta && (
                <Button className="w-full sm:w-auto" onClick={() => navigate(module.callToValue.cta!.route)}>
                  {module.callToValue.cta.label}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Related Modules */}
      {relatedModules.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Modules connexes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {relatedModules.map(related => (
                <Button
                  key={related.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleRelatedClick(related.slug)}
                >
                  {related.title}
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Feedback */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Cette documentation vous a-t-elle été utile ?
            </p>
            <div className="flex gap-2">
              <Button
                variant={feedback === 'helpful' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFeedback('helpful')}
              >
                <ThumbsUp className="h-4 w-4 mr-1" />
                Oui
              </Button>
              <Button
                variant={feedback === 'not-helpful' ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => setFeedback('not-helpful')}
              >
                <ThumbsDown className="h-4 w-4 mr-1" />
                Non
              </Button>
            </div>
          </div>
          {feedback && (
            <p className="text-sm text-muted-foreground mt-2">
              Merci pour votre retour ! {feedback === 'helpful' ? '🎉' : 'Nous allons améliorer cette page.'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
