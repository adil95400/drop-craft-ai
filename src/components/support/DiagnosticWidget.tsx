/**
 * DiagnosticWidget - Widget flottant d'arbre de décision support
 * Aide les utilisateurs à résoudre leurs problèmes de manière autonome
 */
import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  HelpCircle, X, ChevronRight, ArrowLeft, CheckCircle2,
  AlertTriangle, XCircle, RotateCcw, ExternalLink, Wrench
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { trackEvent } from '@/lib/analytics'

// ─── Types ───────────────────────────────────────────────────────
type Severity = 'critical' | 'important' | 'minor'

interface DiagnosticStep {
  id: string
  question: string
  severity?: Severity
  options: {
    label: string
    nextStepId?: string
    solution?: {
      title: string
      steps: string[]
      link?: { label: string; url: string }
    }
  }[]
}

// ─── Decision Tree Data ──────────────────────────────────────────
const DIAGNOSTIC_TREE: DiagnosticStep[] = [
  {
    id: 'root',
    question: 'Quel type de problème rencontrez-vous ?',
    options: [
      { label: '🔌 Connexion / Intégration', nextStepId: 'integration' },
      { label: '📦 Import de produits', nextStepId: 'import' },
      { label: '🔄 Synchronisation', nextStepId: 'sync' },
      { label: '🤖 Génération IA', nextStepId: 'ai' },
      { label: '📊 Dashboard / Données', nextStepId: 'dashboard' },
      { label: '💳 Facturation / Abonnement', nextStepId: 'billing' },
    ],
  },
  // ── Integration ──
  {
    id: 'integration',
    question: 'Quel est le problème avec votre intégration ?',
    severity: 'critical',
    options: [
      { label: 'Impossible de connecter Shopify', nextStepId: 'shopify-connect' },
      { label: 'Clé API refusée / invalide', nextStepId: 'api-key' },
      { label: 'Erreur "unauthorized" (401)', nextStepId: 'auth-error' },
      { label: 'Autre plateforme', nextStepId: 'other-platform' },
    ],
  },
  {
    id: 'shopify-connect',
    question: 'Connexion Shopify — Diagnostic',
    severity: 'critical',
    options: [
      {
        label: 'Voir la solution',
        solution: {
          title: 'Résoudre la connexion Shopify',
          steps: [
            '1. Vérifiez que votre URL Shopify est au format "votre-boutique.myshopify.com"',
            '2. Dans Shopify Admin → Settings → Apps → Develop apps → Créez une app',
            '3. Accordez les scopes : read_products, write_products, read_orders',
            '4. Copiez le token Admin API (pas le Storefront !)',
            '5. Collez le token dans ShopOpti → Paramètres → Intégrations → Shopify',
            '6. Cliquez "Tester la connexion" pour valider',
          ],
          link: { label: 'Guide d\'intégration Shopify', url: '/help-center/documentation/integrations' },
        },
      },
    ],
  },
  {
    id: 'api-key',
    question: 'Clé API invalide — Diagnostic',
    severity: 'important',
    options: [
      {
        label: 'Voir la solution',
        solution: {
          title: 'Résoudre les problèmes de clé API',
          steps: [
            '1. Vérifiez que vous utilisez la bonne clé (Admin API, pas Storefront)',
            '2. Assurez-vous que la clé n\'a pas expiré',
            '3. Vérifiez les permissions accordées à l\'application',
            '4. Si le problème persiste, régénérez une nouvelle clé',
            '5. Supprimez l\'ancienne intégration et reconnectez-vous',
          ],
          link: { label: 'Gestion des clés API', url: '/settings/integrations' },
        },
      },
    ],
  },
  {
    id: 'auth-error',
    question: 'Erreur d\'authentification (401)',
    severity: 'critical',
    options: [
      {
        label: 'Voir la solution',
        solution: {
          title: 'Résoudre l\'erreur 401',
          steps: [
            '1. Déconnectez-vous puis reconnectez-vous à ShopOpti',
            '2. Videz le cache de votre navigateur (Ctrl+Shift+Del)',
            '3. Si le problème persiste, vérifiez vos tokens d\'intégration',
            '4. Régénérez vos clés API depuis votre plateforme e-commerce',
            '5. Contactez le support si l\'erreur continue',
          ],
        },
      },
    ],
  },
  {
    id: 'other-platform',
    question: 'Quelle plateforme ?',
    severity: 'important',
    options: [
      {
        label: 'WooCommerce / PrestaShop / Etsy',
        solution: {
          title: 'Intégration autres plateformes',
          steps: [
            '1. Activez l\'API REST de votre plateforme',
            '2. Générez les clés API avec les permissions requises',
            '3. Dans ShopOpti → Paramètres → Intégrations, sélectionnez votre plateforme',
            '4. Suivez le guide pas-à-pas correspondant',
          ],
          link: { label: 'Tous les guides d\'intégration', url: '/help-center/documentation/integrations' },
        },
      },
    ],
  },
  // ── Import ──
  {
    id: 'import',
    question: 'Quel problème avec l\'import ?',
    severity: 'important',
    options: [
      { label: 'Import CSV échoue', nextStepId: 'import-csv' },
      { label: 'Import depuis AliExpress / fournisseur', nextStepId: 'import-supplier' },
      { label: 'Produits importés mais incomplets', nextStepId: 'import-incomplete' },
      { label: 'Import trop lent / timeout', nextStepId: 'import-slow' },
    ],
  },
  {
    id: 'import-csv',
    question: 'Import CSV — Diagnostic',
    severity: 'important',
    options: [
      {
        label: 'Voir la solution',
        solution: {
          title: 'Résoudre les erreurs d\'import CSV',
          steps: [
            '1. Vérifiez l\'encodage du fichier : UTF-8 requis',
            '2. Utilisez des virgules (,) ou points-virgules (;) comme séparateur',
            '3. Colonnes obligatoires : title, price, sku',
            '4. Taille maximum : 10 Mo / 5000 lignes',
            '5. Téléchargez le template CSV depuis la page d\'import',
            '6. Réessayez avec un fichier de 10 lignes pour tester',
          ],
          link: { label: 'Template CSV', url: '/products/import' },
        },
      },
    ],
  },
  {
    id: 'import-supplier',
    question: 'Import fournisseur — Diagnostic',
    severity: 'important',
    options: [
      {
        label: 'Voir la solution',
        solution: {
          title: 'Import depuis un fournisseur',
          steps: [
            '1. Utilisez l\'extension Chrome ShopOpti pour importer depuis AliExpress',
            '2. Ou utilisez l\'import par URL dans Produits → Importer → URL',
            '3. Vérifiez que la page produit est accessible publiquement',
            '4. Certaines plateformes limitent le scraping — utilisez l\'import CSV dans ce cas',
          ],
          link: { label: 'Guide d\'import', url: '/help-center/documentation/import' },
        },
      },
    ],
  },
  {
    id: 'import-incomplete',
    question: 'Produits incomplets',
    severity: 'minor',
    options: [
      {
        label: 'Voir la solution',
        solution: {
          title: 'Compléter les produits importés',
          steps: [
            '1. Les champs manquants dépendent de la source d\'import',
            '2. Utilisez l\'enrichissement IA : Produit → Actions → Enrichir avec l\'IA',
            '3. Complétez manuellement les champs SEO (titre, description, mots-clés)',
            '4. Ajoutez des images de qualité (recommandé : 1000x1000px minimum)',
          ],
        },
      },
    ],
  },
  {
    id: 'import-slow',
    question: 'Import lent / timeout',
    severity: 'important',
    options: [
      {
        label: 'Voir la solution',
        solution: {
          title: 'Accélérer les imports',
          steps: [
            '1. Réduisez le nombre de produits par lot (max 100)',
            '2. Vérifiez votre connexion internet',
            '3. Les imports volumineux s\'exécutent en arrière-plan — consultez Tâches',
            '4. Évitez les imports simultanés multiples',
            '5. Upgrader vers un plan supérieur augmente les limites',
          ],
        },
      },
    ],
  },
  // ── Sync ──
  {
    id: 'sync',
    question: 'Quel problème de synchronisation ?',
    severity: 'critical',
    options: [
      {
        label: 'Stock / prix ne se mettent pas à jour',
        solution: {
          title: 'Résoudre la synchronisation stock/prix',
          steps: [
            '1. Vérifiez que l\'intégration est active : Paramètres → Intégrations',
            '2. Cliquez "Forcer la synchronisation" sur l\'intégration concernée',
            '3. Vérifiez les logs de synchronisation pour les erreurs',
            '4. Assurez-vous que les scopes API incluent write_products et write_inventory',
            '5. La synchro s\'exécute automatiquement toutes les 4 heures',
          ],
          link: { label: 'Paramètres d\'intégration', url: '/settings/integrations' },
        },
      },
      {
        label: 'Commandes non reçues',
        solution: {
          title: 'Résoudre la réception des commandes',
          steps: [
            '1. Vérifiez le scope read_orders dans votre intégration',
            '2. Les commandes sont importées toutes les 15 minutes',
            '3. Vérifiez les webhooks dans votre plateforme e-commerce',
            '4. Consultez le journal d\'activité pour les erreurs de webhook',
          ],
          link: { label: 'Gestion des commandes', url: '/orders' },
        },
      },
    ],
  },
  // ── AI ──
  {
    id: 'ai',
    question: 'Quel problème avec l\'IA ?',
    severity: 'important',
    options: [
      {
        label: 'Génération trop lente ou échoue',
        solution: {
          title: 'Résoudre les problèmes de génération IA',
          steps: [
            '1. Les générations prennent 10-30s selon la complexité',
            '2. Vérifiez votre quota IA restant dans Paramètres → Utilisation',
            '3. Réduisez la longueur du contenu demandé',
            '4. Relancez la génération en cas de timeout',
            '5. Le plan Free est limité à 10 générations / jour',
          ],
        },
      },
      {
        label: 'Qualité du contenu insuffisante',
        solution: {
          title: 'Améliorer la qualité des générations',
          steps: [
            '1. Fournissez plus de contexte produit (caractéristiques, avantages)',
            '2. Précisez le ton souhaité (professionnel, conversationnel, technique)',
            '3. Utilisez les templates de génération personnalisés',
            '4. Éditez manuellement les résultats et utilisez "Régénérer"',
          ],
        },
      },
    ],
  },
  // ── Dashboard ──
  {
    id: 'dashboard',
    question: 'Quel problème avec le dashboard ?',
    severity: 'minor',
    options: [
      {
        label: 'Données non à jour / vides',
        solution: {
          title: 'Actualiser les données du dashboard',
          steps: [
            '1. Rafraîchissez la page (F5 ou Ctrl+R)',
            '2. Les statistiques sont calculées toutes les heures',
            '3. Vérifiez que vous avez des produits et/ou des commandes',
            '4. Le dashboard nécessite au moins 24h de données pour les graphiques',
          ],
        },
      },
      {
        label: 'Page lente / ne charge pas',
        solution: {
          title: 'Résoudre les problèmes de performance',
          steps: [
            '1. Videz le cache du navigateur',
            '2. Désactivez les extensions navigateur qui pourraient interférer',
            '3. Essayez en navigation privée',
            '4. Réduisez la période d\'analyse (7 jours au lieu de 30)',
          ],
        },
      },
    ],
  },
  // ── Billing ──
  {
    id: 'billing',
    question: 'Quel problème de facturation ?',
    severity: 'minor',
    options: [
      {
        label: 'Problème de paiement / upgrade',
        solution: {
          title: 'Résoudre les problèmes de paiement',
          steps: [
            '1. Vérifiez que votre carte bancaire est valide et non expirée',
            '2. Assurez-vous que les paiements en ligne sont autorisés',
            '3. Essayez avec une autre méthode de paiement',
            '4. Contactez votre banque si le paiement est bloqué',
            '5. Contactez le support pour un paiement manuel',
          ],
          link: { label: 'Gérer mon abonnement', url: '/settings/billing' },
        },
      },
      {
        label: 'Fonctionnalité limitée par mon plan',
        solution: {
          title: 'Comprendre les limites de votre plan',
          steps: [
            '1. Consultez votre plan actuel : Paramètres → Abonnement',
            '2. Comparez les fonctionnalités sur la page Tarifs',
            '3. L\'upgrade est instantané et sans perte de données',
            '4. Les plans Pro et Ultra Pro débloquent l\'IA, les imports massifs et plus',
          ],
          link: { label: 'Voir les tarifs', url: '/pricing' },
        },
      },
    ],
  },
]

// ─── Severity Helpers ────────────────────────────────────────────
const severityConfig: Record<Severity, { label: string; icon: typeof CheckCircle2; className: string }> = {
  critical: { label: 'Critique', icon: XCircle, className: 'bg-destructive/10 text-destructive border-destructive/20' },
  important: { label: 'Important', icon: AlertTriangle, className: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  minor: { label: 'Mineur', icon: CheckCircle2, className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
}

// ─── Component ───────────────────────────────────────────────────
export function DiagnosticWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [history, setHistory] = useState<string[]>(['root'])
  const [solution, setSolution] = useState<DiagnosticStep['options'][0]['solution'] | null>(null)

  const currentStepId = history[history.length - 1]
  const currentStep = DIAGNOSTIC_TREE.find((s) => s.id === currentStepId)

  const handleOption = useCallback(
    (option: DiagnosticStep['options'][0]) => {
      trackEvent('diagnostic_option_selected', { stepId: currentStepId, option: option.label })

      if (option.solution) {
        setSolution(option.solution)
        trackEvent('diagnostic_solution_shown', { title: option.solution.title })
      } else if (option.nextStepId) {
        setHistory((prev) => [...prev, option.nextStepId!])
      }
    },
    [currentStepId],
  )

  const goBack = useCallback(() => {
    if (solution) {
      setSolution(null)
    } else if (history.length > 1) {
      setHistory((prev) => prev.slice(0, -1))
    }
  }, [solution, history])

  const reset = useCallback(() => {
    setHistory(['root'])
    setSolution(null)
    trackEvent('diagnostic_reset')
  }, [])

  const open = useCallback(() => {
    setIsOpen(true)
    trackEvent('diagnostic_widget_opened')
  }, [])

  return (
    <>
      {/* ── Floating Button ── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-24 right-4 z-50 md:bottom-6 md:right-24"
          >
            <Button
              onClick={open}
              size="lg"
              variant="outline"
              className="h-14 w-14 rounded-full shadow-lg border-2 border-primary/20 bg-background hover:bg-primary/5"
            >
              <Wrench className="h-6 w-6 text-primary" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-24 z-50 w-[400px]"
          >
            <Card className="shadow-2xl border-2 overflow-hidden">
              {/* Header */}
              <CardHeader className="bg-primary text-primary-foreground p-4 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wrench className="h-5 w-5" />
                  <div>
                    <CardTitle className="text-sm font-semibold">Diagnostic Rapide</CardTitle>
                    <p className="text-xs text-primary-foreground/70">Résolvez votre problème en 2 min</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                    onClick={reset}
                    title="Recommencer"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <ScrollArea className="max-h-[420px]">
                <CardContent className="p-4">
                  {/* ── Solution View ── */}
                  {solution ? (
                    <div className="space-y-4">
                      <button
                        onClick={goBack}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Retour
                      </button>

                      <div className="space-y-3">
                        <h3 className="font-semibold text-base flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          {solution.title}
                        </h3>

                        <div className="space-y-2">
                          {solution.steps.map((step, i) => (
                            <p key={i} className="text-sm text-muted-foreground pl-2 border-l-2 border-primary/20">
                              {step}
                            </p>
                          ))}
                        </div>

                        {solution.link && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                            onClick={() => {
                              trackEvent('diagnostic_link_clicked', { url: solution.link!.url })
                              window.location.href = solution.link!.url
                            }}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            {solution.link.label}
                          </Button>
                        )}

                        <div className="pt-3 border-t space-y-2">
                          <p className="text-xs text-muted-foreground text-center">Le problème est-il résolu ?</p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                trackEvent('diagnostic_resolved', { title: solution.title })
                                setIsOpen(false)
                                reset()
                              }}
                            >
                              ✅ Oui, résolu !
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                trackEvent('diagnostic_unresolved', { title: solution.title })
                                reset()
                              }}
                            >
                              ❌ Non, autre problème
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* ── Decision Tree View ── */
                    <div className="space-y-4">
                      {history.length > 1 && (
                        <button
                          onClick={goBack}
                          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Retour
                        </button>
                      )}

                      {currentStep?.severity && (
                        <Badge variant="outline" className={severityConfig[currentStep.severity].className}>
                          {(() => {
                            const Icon = severityConfig[currentStep.severity!].icon
                            return <Icon className="h-3 w-3 mr-1" />
                          })()}
                          Niveau : {severityConfig[currentStep.severity].label}
                        </Badge>
                      )}

                      <h3 className="font-semibold">{currentStep?.question}</h3>

                      <div className="space-y-2">
                        {currentStep?.options.map((option, i) => (
                          <motion.button
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => handleOption(option)}
                            className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center justify-between group"
                          >
                            <span className="text-sm">{option.label}</span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </motion.button>
                        ))}
                      </div>

                      {/* Progress indicator */}
                      <div className="flex items-center gap-1 pt-2">
                        {history.map((_, i) => (
                          <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all ${
                              i === history.length - 1 ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </ScrollArea>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
