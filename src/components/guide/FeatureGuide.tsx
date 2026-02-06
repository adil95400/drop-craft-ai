/**
 * FeatureGuide - Composant réutilisable d'aide contextuelle intégrée
 * Affiche un panneau d'aide avec étapes, tips et liens vers la documentation
 */
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  BookOpen, ChevronDown, ChevronRight, CheckCircle2,
  Lightbulb, Play, HelpCircle, ExternalLink, GraduationCap,
  ArrowRight, X, Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface GuideStep {
  title: string
  description: string
  icon?: React.ComponentType<{ className?: string }>
  completed?: boolean
}

export interface GuideTip {
  text: string
  type?: 'info' | 'warning' | 'pro'
}

export interface GuideLink {
  label: string
  href?: string
  onClick?: () => void
  icon?: React.ComponentType<{ className?: string }>
}

export interface FeatureGuideProps {
  featureName: string
  description: string
  steps: GuideStep[]
  tips?: GuideTip[]
  links?: GuideLink[]
  videoUrl?: string
  academyPath?: string
  defaultOpen?: boolean
  className?: string
}

export function FeatureGuide({
  featureName,
  description,
  steps,
  tips = [],
  links = [],
  videoUrl,
  academyPath,
  defaultOpen = false,
  className
}: FeatureGuideProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [dismissedTips, setDismissedTips] = useState<number[]>([])
  const completedSteps = steps.filter(s => s.completed).length

  return (
    <Card className={cn("border-primary/20 bg-primary/[0.02]", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors rounded-t-lg pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    Guide : {featureName}
                    {completedSteps === steps.length && steps.length > 0 && (
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />Complété
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {steps.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {completedSteps}/{steps.length} étapes
                  </Badge>
                )}
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-5">
            {/* Étapes */}
            {steps.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <Play className="h-4 w-4" />
                  Étapes pour démarrer
                </h4>
                <div className="space-y-2">
                  {steps.map((step, index) => {
                    const StepIcon = step.icon || CheckCircle2
                    return (
                      <div
                        key={index}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                          step.completed
                            ? "bg-emerald-500/5 border-emerald-500/20"
                            : "bg-card border-border"
                        )}
                      >
                        <div className={cn(
                          "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                          step.completed
                            ? "bg-emerald-500 text-white"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {step.completed ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm font-medium",
                            step.completed && "line-through text-muted-foreground"
                          )}>
                            {step.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Tips */}
            {tips.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <Lightbulb className="h-4 w-4" />
                  Astuces
                </h4>
                {tips.map((tip, index) => {
                  if (dismissedTips.includes(index)) return null
                  const tipStyles = {
                    info: 'bg-blue-500/5 border-blue-500/20 text-blue-700 dark:text-blue-400',
                    warning: 'bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-400',
                    pro: 'bg-purple-500/5 border-purple-500/20 text-purple-700 dark:text-purple-400'
                  }
                  return (
                    <div
                      key={index}
                      className={cn(
                        "relative flex items-start gap-2 p-3 rounded-lg border text-sm",
                        tipStyles[tip.type || 'info']
                      )}
                    >
                      {tip.type === 'pro' ? (
                        <Sparkles className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Lightbulb className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      )}
                      <span className="flex-1">{tip.text}</span>
                      <button
                        onClick={() => setDismissedTips(prev => [...prev, index])}
                        className="flex-shrink-0 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Liens et ressources */}
            <div className="flex flex-wrap gap-2">
              {videoUrl && (
                <Button variant="outline" size="sm" onClick={() => window.open(videoUrl, '_blank')}>
                  <Play className="h-3.5 w-3.5 mr-1.5" />
                  Tutoriel vidéo
                </Button>
              )}
              {academyPath && (
                <Button variant="outline" size="sm" onClick={() => window.open(academyPath, '_self')}>
                  <GraduationCap className="h-3.5 w-3.5 mr-1.5" />
                  Cours Academy
                </Button>
              )}
              {links.map((link, index) => {
                const LinkIcon = link.icon || ExternalLink
                return (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={link.onClick || (() => link.href && window.open(link.href, '_self'))}
                  >
                    <LinkIcon className="h-3.5 w-3.5 mr-1.5" />
                    {link.label}
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

/**
 * Configurations de guides par fonctionnalité
 * Importables directement dans les pages
 */
export const FEATURE_GUIDES = {
  // ===== SOURCING =====
  winningProducts: {
    featureName: 'Produits Gagnants',
    description: 'Identifiez les produits à fort potentiel de vente grâce à l\'IA',
    steps: [
      { title: 'Définir vos critères', description: 'Configurez vos filtres de niche, marge minimale et volume de recherche' },
      { title: 'Analyser les tendances', description: 'Consultez le score de 0 à 100 basé sur demande, concurrence et marges' },
      { title: 'Importer les gagnants', description: 'Ajoutez les meilleurs produits à votre catalogue en un clic' },
      { title: 'Surveiller la performance', description: 'Suivez les ventes et ajustez vos critères régulièrement' }
    ],
    tips: [
      { text: 'Les produits avec un score > 70 ont 3x plus de chances de bien se vendre', type: 'pro' as const },
      { text: 'Actualisez vos recherches chaque semaine pour capter les nouvelles tendances', type: 'info' as const }
    ],
    academyPath: '/academy'
  },
  adsSpy: {
    featureName: 'Veille Concurrentielle (Ads Spy)',
    description: 'Surveillez les publicités de vos concurrents sur Facebook, Google et TikTok',
    steps: [
      { title: 'Ajouter des concurrents', description: 'Recherchez et ajoutez les marques ou niches à surveiller' },
      { title: 'Analyser les publicités', description: 'Consultez les créatives, textes et performances estimées' },
      { title: 'Sauvegarder dans une collection', description: 'Organisez les meilleures ads dans des collections thématiques' },
      { title: 'S\'inspirer pour vos campagnes', description: 'Adaptez les formats gagnants à votre propre marque' }
    ],
    tips: [
      { text: 'Concentrez-vous sur les ads actives depuis plus de 7 jours — elles sont probablement rentables', type: 'pro' as const },
      { text: 'Utilisez les filtres par plateforme pour cibler Facebook ou TikTok spécifiquement', type: 'info' as const }
    ],
    academyPath: '/academy'
  },
  supplierSearch: {
    featureName: 'Recherche Fournisseurs',
    description: 'Trouvez et connectez les meilleurs fournisseurs pour vos produits',
    steps: [
      { title: 'Explorer le répertoire', description: 'Parcourez les fournisseurs par catégorie, pays ou plateforme' },
      { title: 'Comparer les offres', description: 'Comparez prix, délais de livraison et MOQ entre fournisseurs' },
      { title: 'Connecter un fournisseur', description: 'Liez le fournisseur à votre boutique pour la synchro automatique' },
      { title: 'Configurer les règles', description: 'Définissez les marges automatiques et les règles de fulfillment' }
    ],
    tips: [
      { text: 'Vérifiez toujours les avis et le temps de réponse avant de vous engager', type: 'warning' as const },
      { text: 'Les fournisseurs avec "Envoi EU" offrent des délais de 3-7 jours vs 15-25 pour la Chine', type: 'info' as const }
    ],
    academyPath: '/academy'
  },

  // ===== CATALOGUE =====
  draftManager: {
    featureName: 'Gestionnaire de Brouillons',
    description: 'Gérez vos produits importés en attente de publication',
    steps: [
      { title: 'Importer des produits', description: 'Importez depuis un fournisseur, un fichier CSV ou manuellement' },
      { title: 'Éditer les fiches', description: 'Complétez titres, descriptions, images et prix de vente' },
      { title: 'Optimiser avec l\'IA', description: 'Utilisez l\'IA pour réécrire titres et descriptions SEO-friendly' },
      { title: 'Publier en lot', description: 'Publiez les brouillons prêts vers votre boutique en un clic' }
    ],
    tips: [
      { text: 'Les produits avec un score de santé > 80% se vendent mieux. Complétez toutes les informations.', type: 'pro' as const },
      { text: 'Utilisez le traitement en masse pour optimiser des dizaines de produits à la fois', type: 'info' as const }
    ],
    academyPath: '/academy'
  },
  variants: {
    featureName: 'Gestion des Variantes',
    description: 'Créez et gérez les déclinaisons de vos produits (taille, couleur, etc.)',
    steps: [
      { title: 'Identifier les produits à variantes', description: 'Repérez les produits nécessitant des déclinaisons' },
      { title: 'Créer les options', description: 'Ajoutez taille, couleur, matière ou tout attribut personnalisé' },
      { title: 'Configurer les prix', description: 'Définissez un prix unique ou différent par variante' },
      { title: 'Gérer le stock', description: 'Suivez le stock individuellement pour chaque variante' }
    ],
    tips: [
      { text: 'Limitez-vous à 3 options max par produit pour ne pas complexifier l\'achat', type: 'info' as const }
    ],
    academyPath: '/academy'
  },
  imageEditor: {
    featureName: 'Éditeur d\'Images & Médias',
    description: 'Optimisez et gérez les visuels de votre catalogue',
    steps: [
      { title: 'Auditer vos images', description: 'Identifiez les produits sans image ou avec des images de mauvaise qualité' },
      { title: 'Optimiser en lot', description: 'Redimensionnez, compressez et renommez vos images automatiquement' },
      { title: 'Éditer avec l\'IA', description: 'Supprimez les arrière-plans, améliorez la qualité ou ajoutez des effets' },
      { title: 'Organiser la galerie', description: 'Réordonnez les images et définissez l\'image principale par produit' }
    ],
    tips: [
      { text: 'Des images carrées 1000x1000px en fond blanc convertissent 25% mieux', type: 'pro' as const },
      { text: 'L\'IA peut supprimer les fonds automatiquement — parfait pour un look professionnel', type: 'info' as const }
    ],
    academyPath: '/academy'
  },
  attributes: {
    featureName: 'Attributs & Enrichissement',
    description: 'Enrichissez vos fiches produit avec des attributs structurés',
    steps: [
      { title: 'Définir les attributs', description: 'Créez les attributs nécessaires (matière, poids, dimensions, etc.)' },
      { title: 'Mapper les données', description: 'Associez les données fournisseur aux attributs de votre catalogue' },
      { title: 'Enrichir avec l\'IA', description: 'Laissez l\'IA compléter les attributs manquants automatiquement' },
      { title: 'Exporter pour les feeds', description: 'Les attributs alimentent vos feeds Google Shopping et Meta' }
    ],
    tips: [
      { text: 'Google Shopping exige certains attributs obligatoires (GTIN, marque, état). Vérifiez la conformité.', type: 'warning' as const }
    ],
    academyPath: '/academy'
  },
  categoriesBrands: {
    featureName: 'Catégories & Marques',
    description: 'Classifiez et organisez votre catalogue produit',
    steps: [
      { title: 'Créer l\'arborescence', description: 'Définissez vos catégories principales et sous-catégories' },
      { title: 'Classifier les produits', description: 'Assignez chaque produit à sa catégorie et marque' },
      { title: 'Utiliser les suggestions IA', description: 'L\'IA propose des classifications basées sur les titres et descriptions' },
      { title: 'Vérifier le score', description: 'Visez un score de classification > 90% pour un catalogue bien organisé' }
    ],
    tips: [
      { text: 'Un catalogue bien classifié améliore le SEO et l\'expérience utilisateur de votre boutique', type: 'info' as const }
    ],
    academyPath: '/academy'
  },
  catalogHealth: {
    featureName: 'Score de Santé Catalogue',
    description: 'Évaluez et améliorez la qualité globale de votre catalogue',
    steps: [
      { title: 'Consulter le score global', description: 'Visualisez le score de santé de 0 à 100 de votre catalogue' },
      { title: 'Identifier les problèmes', description: 'Repérez les produits incomplets, sans images ou avec des erreurs' },
      { title: 'Corriger en priorité', description: 'Traitez les problèmes critiques en premier (stock, prix, descriptions)' },
      { title: 'Suivre la progression', description: 'Surveillez l\'évolution de votre score au fil du temps' }
    ],
    tips: [
      { text: 'Un score > 80% est considéré comme professionnel. En dessous de 60%, des ventes sont perdues.', type: 'warning' as const }
    ],
    academyPath: '/academy'
  },

  // ===== VENTES =====
  tracking: {
    featureName: 'Suivi Automatique (Tracking)',
    description: 'Automatisez le suivi des expéditions et informez vos clients',
    steps: [
      { title: 'Connecter les transporteurs', description: 'Liez vos comptes transporteur (Colis Privé, Colissimo, DHL, etc.)' },
      { title: 'Configurer les notifications', description: 'Définissez les emails automatiques à chaque étape du suivi' },
      { title: 'Activer le suivi auto', description: 'Les numéros de suivi sont importés automatiquement depuis vos fournisseurs' },
      { title: 'Page de suivi branded', description: 'Personnalisez la page de suivi avec votre logo et vos couleurs' }
    ],
    tips: [
      { text: 'Les boutiques avec suivi automatique reçoivent 40% de tickets support en moins', type: 'pro' as const }
    ],
    academyPath: '/academy'
  },
  stockManagement: {
    featureName: 'Gestion du Stock',
    description: 'Surveillez vos niveaux de stock et évitez les ruptures',
    steps: [
      { title: 'Configurer les alertes', description: 'Définissez les seuils d\'alerte stock bas pour chaque produit' },
      { title: 'Synchroniser les stocks', description: 'Connectez vos fournisseurs pour une mise à jour automatique' },
      { title: 'Activer le repricing', description: 'Ajustez automatiquement les prix selon le niveau de stock' },
      { title: 'Prédictions IA', description: 'Utilisez les prévisions pour anticiper les commandes fournisseur' }
    ],
    tips: [
      { text: 'Le mode prédictif IA anticipe les ruptures 2 semaines à l\'avance', type: 'pro' as const },
      { text: 'Configurez des alertes email pour être notifié dès qu\'un produit passe sous le seuil', type: 'info' as const }
    ],
    academyPath: '/academy'
  },
  crm: {
    featureName: 'CRM & Pipeline',
    description: 'Gérez vos contacts clients et suivez votre pipeline de ventes',
    steps: [
      { title: 'Importer vos contacts', description: 'Importez votre base clients depuis un CSV ou votre boutique' },
      { title: 'Segmenter les audiences', description: 'Créez des segments basés sur le comportement d\'achat' },
      { title: 'Gérer le pipeline', description: 'Suivez chaque prospect à travers les étapes de conversion' },
      { title: 'Automatiser le suivi', description: 'Déclenchez des emails automatiques selon les actions clients' }
    ],
    tips: [
      { text: 'Les clients segmentés reçoivent des offres 3x plus pertinentes', type: 'pro' as const }
    ],
    academyPath: '/academy'
  },
  feeds: {
    featureName: 'Feeds Multi-canaux',
    description: 'Publiez votre catalogue sur Google Shopping, Meta, TikTok et plus',
    steps: [
      { title: 'Créer un feed', description: 'Sélectionnez la plateforme cible et les produits à inclure' },
      { title: 'Mapper les champs', description: 'Associez vos attributs produit aux champs requis par la plateforme' },
      { title: 'Optimiser le contenu', description: 'L\'IA adapte titres et descriptions pour chaque canal' },
      { title: 'Planifier la synchro', description: 'Configurez la fréquence de mise à jour du feed (toutes les heures, quotidien)' }
    ],
    tips: [
      { text: 'Google Shopping requiert des GTINs valides. Vérifiez la conformité avant de soumettre.', type: 'warning' as const },
      { text: 'Les titres optimisés par canal améliorent le Quality Score de 30%', type: 'pro' as const }
    ],
    academyPath: '/academy'
  },

  // ===== MARKETING =====
  marketingAutomation: {
    featureName: 'Marketing Automation',
    description: 'Créez des workflows automatisés pour vos campagnes marketing',
    steps: [
      { title: 'Choisir un template', description: 'Sélectionnez un workflow pré-configuré ou créez le vôtre' },
      { title: 'Configurer le déclencheur', description: 'Définissez l\'événement qui démarre le workflow (achat, abandon, etc.)' },
      { title: 'Ajouter les actions', description: 'Email, SMS, notification push, mise à jour CRM...' },
      { title: 'Tester et activer', description: 'Testez avec un contact fictif puis activez pour tous' }
    ],
    tips: [
      { text: 'Les emails de panier abandonné récupèrent en moyenne 15% des ventes perdues', type: 'pro' as const },
      { text: 'Commencez par les 3 workflows essentiels : bienvenue, abandon panier, post-achat', type: 'info' as const }
    ],
    academyPath: '/academy'
  },
  seo: {
    featureName: 'SEO Optimisation',
    description: 'Améliorez le référencement naturel de votre boutique et de vos produits',
    steps: [
      { title: 'Auditer votre site', description: 'Lancez un audit SEO complet pour identifier les problèmes' },
      { title: 'Optimiser les fiches produit', description: 'Améliorez titres, méta-descriptions et URLs de chaque produit' },
      { title: 'Rechercher des mots-clés', description: 'Identifiez les mots-clés à fort volume et faible concurrence' },
      { title: 'Suivre les positions', description: 'Surveillez votre classement sur Google pour vos mots-clés cibles' }
    ],
    tips: [
      { text: 'L\'IA peut réécrire toutes vos méta-descriptions en un clic — gain de temps énorme', type: 'pro' as const },
      { text: 'Les 3 premiers résultats Google captent 75% des clics. Visez le top 3.', type: 'info' as const }
    ],
    academyPath: '/academy'
  },

  // ===== CONFIGURATION =====
  chromeExtension: {
    featureName: 'Extension Copier/Coller',
    description: 'Importez des produits depuis n\'importe quel site en un clic',
    steps: [
      { title: 'Installer l\'extension', description: 'Téléchargez l\'extension Chrome depuis la page dédiée' },
      { title: 'Se connecter', description: 'Connectez l\'extension à votre compte ShopOpti' },
      { title: 'Importer un produit', description: 'Naviguez sur un site fournisseur et cliquez sur "Importer"' },
      { title: 'Éditer et publier', description: 'Le produit apparaît dans vos brouillons, prêt à être édité' }
    ],
    tips: [
      { text: 'L\'extension fonctionne sur AliExpress, Amazon, CJ Dropshipping et des centaines d\'autres sites', type: 'info' as const }
    ],
    academyPath: '/academy'
  },
  academy: {
    featureName: 'ShopOpti Academy',
    description: 'Formez-vous avec nos cours, tutoriels et certifications',
    steps: [
      { title: 'Choisir un parcours', description: 'Sélectionnez un parcours adapté à votre niveau (débutant, avancé, expert)' },
      { title: 'Suivre les leçons', description: 'Regardez les vidéos et complétez les exercices pratiques' },
      { title: 'Passer les quiz', description: 'Validez vos connaissances avec les quiz de fin de module' },
      { title: 'Obtenir la certification', description: 'Recevez votre certificat ShopOpti une fois le parcours complété' }
    ],
    tips: [
      { text: 'Les utilisateurs certifiés ont en moyenne 2x plus de ventes', type: 'pro' as const }
    ],
    academyPath: '/academy'
  },

  // ===== EXTRAS =====
  whiteLabel: {
    featureName: 'White-Label',
    description: 'Personnalisez l\'apparence de votre espace avec votre marque',
    steps: [
      { title: 'Ajouter votre logo', description: 'Uploadez votre logo et favicon personnalisés' },
      { title: 'Configurer les couleurs', description: 'Définissez les couleurs primaire et secondaire de votre marque' },
      { title: 'Personnaliser les emails', description: 'Ajoutez votre logo et vos couleurs aux emails transactionnels' },
      { title: 'Domaine personnalisé', description: 'Connectez votre propre nom de domaine' }
    ],
    tips: [
      { text: 'Fonctionnalité Ultra Pro — Transformez ShopOpti en votre propre plateforme', type: 'pro' as const }
    ],
    academyPath: '/academy'
  },
  priceMonitor: {
    featureName: 'Moniteur de Prix & Stock',
    description: 'Surveillez les prix et stocks de vos fournisseurs en temps réel',
    steps: [
      { title: 'Ajouter des produits à surveiller', description: 'Sélectionnez les produits dont vous voulez suivre le prix fournisseur' },
      { title: 'Définir les seuils d\'alerte', description: 'Configurez les variations de prix et stock qui déclenchent une alerte' },
      { title: 'Activer l\'ajustement auto', description: 'Activez le repricing automatique selon les changements fournisseur' },
      { title: 'Consulter l\'historique', description: 'Analysez l\'historique des prix pour anticiper les tendances' }
    ],
    tips: [
      { text: 'Le repricing automatique ajuste vos prix en < 5 minutes après un changement fournisseur', type: 'pro' as const },
      { text: 'Configurez des alertes email pour ne jamais rater une hausse de prix critique', type: 'warning' as const }
    ],
    academyPath: '/academy'
  }
} as const satisfies Record<string, Omit<FeatureGuideProps, 'className' | 'defaultOpen'>>
