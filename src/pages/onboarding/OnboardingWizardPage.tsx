/**
 * Sprint 21: Onboarding Wizard - Assistant de configuration guidé multi-plateformes
 * 4 étapes: Bienvenue → Plateforme → Configuration → Terminé
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  Rocket, Store, Upload, Package, CheckCircle2, ArrowRight, ArrowLeft,
  Sparkles, Globe, ShoppingCart, Zap, FileSpreadsheet, Link,
  Wand2, PartyPopper, ChevronRight, Building2
} from 'lucide-react'

const PLATFORMS = [
  { id: 'shopify', name: 'Shopify', icon: ShoppingCart, color: 'bg-green-500', desc: 'La plateforme e-commerce #1 mondiale' },
  { id: 'woocommerce', name: 'WooCommerce', icon: Globe, color: 'bg-purple-500', desc: 'Extension WordPress puissante' },
  { id: 'prestashop', name: 'PrestaShop', icon: Store, color: 'bg-blue-500', desc: 'Solution open-source française' },
  { id: 'amazon', name: 'Amazon', icon: Package, color: 'bg-orange-500', desc: 'Marketplace mondiale' },
  { id: 'etsy', name: 'Etsy', icon: Sparkles, color: 'bg-amber-500', desc: 'Marketplace créative et artisanale' },
  { id: 'other', name: 'Autre', icon: Building2, color: 'bg-muted-foreground', desc: 'Autre plateforme ou démarrage from scratch' },
]

const IMPORT_METHODS = [
  { id: 'url', name: 'Import par URL', icon: Link, desc: 'Importez depuis un lien produit' },
  { id: 'csv', name: 'Fichier CSV/Excel', icon: FileSpreadsheet, desc: 'Upload de fichier en masse' },
  { id: 'api', name: 'Connexion API', icon: Zap, desc: 'Synchronisation automatique' },
  { id: 'manual', name: 'Saisie manuelle', icon: Wand2, desc: 'Créer manuellement vos fiches' },
]

const BUSINESS_TYPES = [
  { id: 'dropshipping', label: 'Dropshipping' },
  { id: 'ecommerce', label: 'E-commerce classique' },
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'b2b', label: 'B2B / Grossiste' },
  { id: 'agency', label: 'Agence / Multi-clients' },
  { id: 'other', label: 'Autre' },
]

const STEPS = [
  { id: 1, label: 'Bienvenue', icon: Rocket },
  { id: 2, label: 'Plateforme', icon: Store },
  { id: 3, label: 'Import', icon: Upload },
  { id: 4, label: 'Terminé', icon: PartyPopper },
]

export default function OnboardingWizardPage() {
  const navigate = useNavigate()
  const { profile } = useUnifiedAuth()
  const store = useOnboardingStore()
  const [businessName, setBusinessName] = useState(store.businessName)
  const [businessType, setBusinessType] = useState(store.businessType)
  const [selectedPlatform, setSelectedPlatform] = useState(store.storePlatform)
  const [selectedImport, setSelectedImport] = useState(store.importMethod)
  const currentStep = store.currentStep

  const progressPercent = ((currentStep - 1) / (STEPS.length - 1)) * 100

  const handleNext = () => {
    if (currentStep === 1) {
      store.setBusinessInfo(businessName, businessType)
      store.completeStep(1)
    } else if (currentStep === 2) {
      store.setPlatform(selectedPlatform)
      store.completeStep(2)
    } else if (currentStep === 3) {
      store.setImportMethod(selectedImport)
      store.completeStep(3)
    }
    store.nextStep()
  }

  const handleFinish = () => {
    store.completeOnboarding()
    if (selectedPlatform && selectedPlatform !== 'other') {
      navigate('/stores-channels')
    } else if (selectedImport === 'csv') {
      navigate('/import')
    } else {
      navigate('/dashboard')
    }
  }

  const canProceed = () => {
    if (currentStep === 1) return businessName.trim().length > 0 && businessType.length > 0
    if (currentStep === 2) return selectedPlatform.length > 0
    if (currentStep === 3) return selectedImport.length > 0
    return true
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      {/* Header with progress */}
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              <span className="font-semibold">Configuration initiale</span>
            </div>
            <Badge variant="secondary">{currentStep}/{STEPS.length}</Badge>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-2">
            {STEPS.map((step, i) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className={cn(
                  'flex items-center gap-1.5 text-xs font-medium transition-colors',
                  currentStep >= step.id ? 'text-primary' : 'text-muted-foreground'
                )}>
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all',
                    currentStep > step.id ? 'bg-primary text-primary-foreground' :
                    currentStep === step.id ? 'bg-primary/20 text-primary ring-2 ring-primary' :
                    'bg-muted text-muted-foreground'
                  )}>
                    {currentStep > step.id ? <CheckCircle2 className="w-4 h-4" /> : step.id}
                  </div>
                  <span className="hidden sm:inline">{step.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn(
                    'flex-1 h-0.5 mx-2 rounded transition-colors',
                    currentStep > step.id ? 'bg-primary' : 'bg-muted'
                  )} />
                )}
              </div>
            ))}
          </div>
          <Progress value={progressPercent} className="h-1" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {/* Step 1: Welcome */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-6"
              >
                <div className="text-center space-y-3">
                  <motion.div
                    className="mx-auto p-4 rounded-2xl bg-gradient-to-br from-primary to-violet-600 w-fit"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Rocket className="h-10 w-10 text-white" />
                  </motion.div>
                  <h1 className="text-3xl font-bold">
                    Bienvenue{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''} ! 🎉
                  </h1>
                  <p className="text-muted-foreground text-lg max-w-md mx-auto">
                    Configurons votre espace en quelques étapes simples.
                  </p>
                </div>

                <Card>
                  <CardContent className="p-6 space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Nom de votre entreprise / boutique</Label>
                      <Input
                        id="businessName"
                        placeholder="Ma Super Boutique"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="text-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Type d'activité</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {BUSINESS_TYPES.map((type) => (
                          <button
                            key={type.id}
                            onClick={() => setBusinessType(type.id)}
                            className={cn(
                              'p-3 rounded-lg border text-sm font-medium text-left transition-all',
                              businessType === type.id
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border hover:border-primary/50 hover:bg-muted/50'
                            )}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 2: Platform Selection */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h1 className="text-2xl font-bold">Quelle est votre plateforme ?</h1>
                  <p className="text-muted-foreground">Sélectionnez votre plateforme e-commerce principale.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PLATFORMS.map((platform, i) => (
                    <motion.button
                      key={platform.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setSelectedPlatform(platform.id)}
                      className={cn(
                        'flex items-center gap-4 p-4 rounded-xl border text-left transition-all',
                        selectedPlatform === platform.id
                          ? 'border-primary bg-primary/5 ring-2 ring-primary shadow-md'
                          : 'border-border hover:border-primary/40 hover:bg-muted/50'
                      )}
                    >
                      <div className={cn('p-2.5 rounded-lg', platform.color)}>
                        <platform.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">{platform.name}</p>
                        <p className="text-xs text-muted-foreground">{platform.desc}</p>
                      </div>
                      {selectedPlatform === platform.id && (
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Import Method */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h1 className="text-2xl font-bold">Comment importer vos produits ?</h1>
                  <p className="text-muted-foreground">Choisissez votre méthode d'import préférée.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {IMPORT_METHODS.map((method, i) => (
                    <motion.button
                      key={method.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setSelectedImport(method.id)}
                      className={cn(
                        'flex items-center gap-4 p-5 rounded-xl border text-left transition-all',
                        selectedImport === method.id
                          ? 'border-primary bg-primary/5 ring-2 ring-primary shadow-md'
                          : 'border-border hover:border-primary/40 hover:bg-muted/50'
                      )}
                    >
                      <div className="p-2.5 rounded-lg bg-primary/10">
                        <method.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{method.name}</p>
                        <p className="text-xs text-muted-foreground">{method.desc}</p>
                      </div>
                      {selectedImport === method.id && (
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 4: Complete */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="text-center space-y-4">
                  <motion.div
                    className="mx-auto p-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 w-fit"
                    animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 1.5, repeat: 2 }}
                  >
                    <PartyPopper className="h-12 w-12 text-white" />
                  </motion.div>
                  <h1 className="text-3xl font-bold">Tout est prêt ! 🚀</h1>
                  <p className="text-muted-foreground text-lg max-w-md mx-auto">
                    Votre espace est configuré. Voici un récapitulatif :
                  </p>
                </div>

                <Card className="overflow-hidden">
                  <CardContent className="p-6 space-y-4">
                    <SummaryRow label="Entreprise" value={businessName || '—'} icon={Building2} />
                    <SummaryRow
                      label="Type"
                      value={BUSINESS_TYPES.find(t => t.id === businessType)?.label || '—'}
                      icon={ShoppingCart}
                    />
                    <SummaryRow
                      label="Plateforme"
                      value={PLATFORMS.find(p => p.id === selectedPlatform)?.name || '—'}
                      icon={Store}
                    />
                    <SummaryRow
                      label="Méthode d'import"
                      value={IMPORT_METHODS.find(m => m.id === selectedImport)?.name || '—'}
                      icon={Upload}
                    />
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <QuickAction
                    label="Connecter boutique"
                    desc="Liez votre plateforme"
                    icon={Store}
                    onClick={() => { store.completeOnboarding(); navigate('/stores-channels') }}
                  />
                  <QuickAction
                    label="Importer produits"
                    desc="Ajoutez vos premiers produits"
                    icon={Upload}
                    onClick={() => { store.completeOnboarding(); navigate('/import') }}
                  />
                  <QuickAction
                    label="Explorer"
                    desc="Découvrir la plateforme"
                    icon={Sparkles}
                    onClick={() => { store.completeOnboarding(); navigate('/dashboard') }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="border-t bg-card/80 backdrop-blur-sm sticky bottom-0">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => store.prevStep()}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>

          {currentStep < 4 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-gradient-to-r from-primary to-violet-600 hover:opacity-90"
            >
              Continuer
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:opacity-90"
            >
              Lancer ShopOpti
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function SummaryRow({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  )
}

function QuickAction({ label, desc, icon: Icon, onClick }: {
  label: string; desc: string; icon: React.ElementType; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
    >
      <Icon className="h-5 w-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
      <p className="font-semibold text-sm">{label}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </button>
  )
}
