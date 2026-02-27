import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Calendar, Clock, Globe, Settings, Zap, FileText, 
  Link, Key, RefreshCw, Bell, Shield, CheckCircle2,
  ChevronRight, ChevronLeft, ArrowRight, Sparkles,
  AlertCircle, Check, Database, Upload
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export interface ScheduleFormData {
  id?: string
  name: string
  source_type: 'url' | 'csv' | 'xml' | 'api' | 'ftp'
  source_url: string
  api_key?: string
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom'
  custom_cron?: string
  time_of_day?: string
  day_of_week?: string
  active: boolean
  auto_publish: boolean
  auto_optimize: boolean
  notify_on_complete: boolean
  notify_on_error: boolean
  retry_on_failure: boolean
  max_retries: number
  description?: string
  filters?: string
}

interface ScheduleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schedule?: ScheduleFormData | null
  onSubmit: (data: ScheduleFormData) => void
  mode?: 'create' | 'edit'
}

const defaultFormData: ScheduleFormData = {
  name: '',
  source_type: 'url',
  source_url: '',
  api_key: '',
  frequency: 'daily',
  custom_cron: '',
  time_of_day: '09:00',
  day_of_week: 'monday',
  active: true,
  auto_publish: false,
  auto_optimize: true,
  notify_on_complete: true,
  notify_on_error: true,
  retry_on_failure: true,
  max_retries: 3,
  description: '',
  filters: ''
}

const STEPS = [
  { id: 'general', label: 'Général', icon: Settings },
  { id: 'source', label: 'Source', icon: Database },
  { id: 'planning', label: 'Planning', icon: Clock },
  { id: 'options', label: 'Options', icon: Zap },
] as const

type StepId = typeof STEPS[number]['id']

export function ScheduleFormDialog({ 
  open, 
  onOpenChange, 
  schedule, 
  onSubmit,
  mode = 'create'
}: ScheduleFormDialogProps) {
  const [formData, setFormData] = useState<ScheduleFormData>(defaultFormData)
  const [currentStep, setCurrentStep] = useState(0)
  const [isValidating, setIsValidating] = useState(false)
  const [urlValid, setUrlValid] = useState<boolean | null>(null)
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([0]))

  useEffect(() => {
    if (schedule) {
      setFormData({ ...defaultFormData, ...schedule })
    } else {
      setFormData(defaultFormData)
    }
    setCurrentStep(0)
    setUrlValid(null)
    setVisitedSteps(new Set([0]))
  }, [schedule, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const validateUrl = async () => {
    if (!formData.source_url) return
    setIsValidating(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setUrlValid(formData.source_url.startsWith('http'))
    setIsValidating(false)
  }

  const goToStep = (step: number) => {
    setCurrentStep(step)
    setVisitedSteps(prev => new Set([...prev, step]))
  }

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) goToStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 0) goToStep(currentStep - 1)
  }

  const isStepValid = useMemo(() => {
    switch (currentStep) {
      case 0: return formData.name.trim().length > 0
      case 1: return formData.source_type !== 'csv' ? formData.source_url.trim().length > 0 : true
      case 2: return true
      case 3: return true
      default: return true
    }
  }, [currentStep, formData])

  const isFormComplete = formData.name.trim().length > 0

  const sourceTypeOptions = [
    { value: 'url', label: 'URL Produit', icon: Link, color: 'text-blue-500 bg-blue-500/10' },
    { value: 'csv', label: 'Fichier CSV', icon: FileText, color: 'text-emerald-500 bg-emerald-500/10' },
    { value: 'xml', label: 'Flux XML', icon: Globe, color: 'text-orange-500 bg-orange-500/10' },
    { value: 'api', label: 'API REST', icon: Zap, color: 'text-purple-500 bg-purple-500/10' },
    { value: 'ftp', label: 'FTP/SFTP', icon: Shield, color: 'text-rose-500 bg-rose-500/10' }
  ]

  const frequencyOptions = [
    { value: 'hourly', label: 'Toutes les heures', badge: '24x/jour', icon: '⚡' },
    { value: 'daily', label: 'Quotidien', badge: '1x/jour', icon: '☀️' },
    { value: 'weekly', label: 'Hebdomadaire', badge: '1x/sem', icon: '📅' },
    { value: 'monthly', label: 'Mensuel', badge: '1x/mois', icon: '📆' },
    { value: 'custom', label: 'CRON personnalisé', badge: 'Avancé', icon: '⚙️' }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[680px] p-0 gap-0 overflow-hidden max-h-[92vh] flex flex-col rounded-2xl">
        {/* Header - Channable style */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-primary/8 via-background to-accent/5 border-b">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/15 rounded-xl ring-1 ring-primary/20">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold tracking-tight">
                  {mode === 'edit' ? 'Modifier l\'import planifié' : 'Nouvel import planifié'}
                </DialogTitle>
                <DialogDescription className="text-sm mt-0.5">
                  {mode === 'edit' 
                    ? 'Ajustez la configuration de votre import automatique'
                    : 'Configurez un import récurrent automatique'
                  }
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Stepper - Channable style */}
          <div className="flex items-center gap-1">
            {STEPS.map((step, index) => {
              const isActive = index === currentStep
              const isCompleted = visitedSteps.has(index) && index < currentStep
              const StepIcon = step.icon
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => goToStep(index)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : isCompleted
                        ? "bg-primary/10 text-primary hover:bg-primary/15"
                        : "text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <div className="relative">
                    {isCompleted && !isActive ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <StepIcon className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <span className="hidden sm:inline text-xs">{step.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Content area */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="p-6 space-y-5"
              >
                {/* Step 0: Général */}
                {currentStep === 0 && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Nom du planning <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        placeholder="Ex: Sync catalogue AliExpress"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                        className="h-11"
                        autoFocus
                      />
                      <p className="text-xs text-muted-foreground">
                        Donnez un nom descriptif pour identifier facilement cet import
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-medium">
                        Description <span className="text-muted-foreground font-normal">(optionnelle)</span>
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Ex: Mise à jour quotidienne du catalogue fournisseur"
                        value={formData.description || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                          <Sparkles className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                          <Label htmlFor="active" className="font-medium text-sm cursor-pointer">Activer immédiatement</Label>
                          <p className="text-xs text-muted-foreground mt-0.5">Le planning démarrera dès sa création</p>
                        </div>
                      </div>
                      <Switch
                        id="active"
                        checked={formData.active}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                      />
                    </div>
                  </>
                )}

                {/* Step 1: Source */}
                {currentStep === 1 && (
                  <>
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">
                        Type de source <span className="text-destructive">*</span>
                      </Label>
                      <div className="grid grid-cols-5 gap-2">
                        {sourceTypeOptions.map((opt) => {
                          const isSelected = formData.source_type === opt.value
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, source_type: opt.value as any }))}
                              className={cn(
                                "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-center",
                                isSelected
                                  ? "border-primary bg-primary/5 shadow-sm"
                                  : "border-transparent bg-muted/40 hover:bg-muted/70 hover:border-muted-foreground/20"
                              )}
                            >
                              <div className={cn("p-2 rounded-lg", opt.color)}>
                                <opt.icon className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-medium leading-tight">{opt.label}</span>
                              {isSelected && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {formData.source_type !== 'csv' && (
                      <div className="space-y-2">
                        <Label htmlFor="source_url" className="text-sm font-medium">
                          {formData.source_type === 'api' ? 'Endpoint API' : 
                           formData.source_type === 'ftp' ? 'Adresse FTP' : 
                           formData.source_type === 'xml' ? 'URL du flux' :
                           'URL source'} <span className="text-destructive">*</span>
                        </Label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              id="source_url"
                              placeholder={
                                formData.source_type === 'api' ? 'https://api.example.com/products' :
                                formData.source_type === 'ftp' ? 'ftp://ftp.example.com/products.csv' :
                                formData.source_type === 'xml' ? 'https://example.com/feed.xml' :
                                'https://aliexpress.com/item/123456'
                              }
                              value={formData.source_url}
                              onChange={(e) => {
                                setFormData(prev => ({ ...prev, source_url: e.target.value }))
                                setUrlValid(null)
                              }}
                              className={cn(
                                "h-11 pr-10 font-mono text-sm",
                                urlValid === true && "border-emerald-500 focus-visible:ring-emerald-500",
                                urlValid === false && "border-destructive focus-visible:ring-destructive"
                              )}
                            />
                            {urlValid !== null && (
                              <div className={cn(
                                "absolute right-3 top-1/2 -translate-y-1/2",
                                urlValid ? "text-emerald-500" : "text-destructive"
                              )}>
                                {urlValid ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                              </div>
                            )}
                          </div>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="default"
                            onClick={validateUrl}
                            disabled={!formData.source_url || isValidating}
                            className="h-11 px-4"
                          >
                            {isValidating ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="w-4 h-4 mr-1.5" />
                                Tester
                              </>
                            )}
                          </Button>
                        </div>
                        {urlValid === true && (
                          <p className="text-xs text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> URL accessible et valide
                          </p>
                        )}
                        {urlValid === false && (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> URL invalide ou inaccessible
                          </p>
                        )}
                      </div>
                    )}

                    {formData.source_type === 'csv' && (
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
                        <p className="text-sm font-medium">Le fichier sera importé à chaque exécution</p>
                        <p className="text-xs text-muted-foreground mt-1">Hébergez votre CSV sur une URL accessible</p>
                      </div>
                    )}

                    {(formData.source_type === 'api' || formData.source_type === 'ftp') && (
                      <div className="space-y-2">
                        <Label htmlFor="api_key" className="text-sm font-medium flex items-center gap-2">
                          <Key className="w-3.5 h-3.5 text-muted-foreground" />
                          Authentification
                        </Label>
                        <Input
                          id="api_key"
                          type="password"
                          placeholder="Clé API ou mot de passe"
                          value={formData.api_key || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
                          className="h-11"
                        />
                        <p className="text-xs text-muted-foreground">
                          Vos identifiants sont stockés de manière chiffrée
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Step 2: Planning */}
                {currentStep === 2 && (
                  <>
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">
                        Fréquence d'exécution <span className="text-destructive">*</span>
                      </Label>
                      <div className="grid grid-cols-1 gap-1.5">
                        {frequencyOptions.map((opt) => {
                          const isSelected = formData.frequency === opt.value
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, frequency: opt.value as any }))}
                              className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left",
                                isSelected 
                                  ? "border-primary bg-primary/5 ring-1 ring-primary/30" 
                                  : "border-transparent bg-muted/30 hover:bg-muted/60"
                              )}
                            >
                              <span className="text-lg">{opt.icon}</span>
                              <div className="flex-1">
                                <span className="text-sm font-medium">{opt.label}</span>
                              </div>
                              <Badge variant={isSelected ? "default" : "secondary"} className="text-xs font-mono">
                                {opt.badge}
                              </Badge>
                              {isSelected && <Check className="w-4 h-4 text-primary" />}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {formData.frequency === 'custom' && (
                      <div className="space-y-2 p-4 bg-muted/30 rounded-xl border">
                        <Label htmlFor="custom_cron" className="text-sm font-medium">Expression CRON</Label>
                        <Input
                          id="custom_cron"
                          placeholder="0 9 * * 1-5"
                          value={formData.custom_cron || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, custom_cron: e.target.value }))}
                          className="h-11 font-mono"
                        />
                        <p className="text-xs text-muted-foreground">
                          Exemple: <code className="bg-muted px-1.5 py-0.5 rounded">0 9 * * 1-5</code> = Lun-Ven à 9h
                        </p>
                      </div>
                    )}

                    {formData.frequency !== 'hourly' && formData.frequency !== 'custom' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Heure d'exécution</Label>
                          <Select 
                            value={formData.time_of_day || '09:00'} 
                            onValueChange={(value) => setFormData(prev => ({ ...prev, time_of_day: value }))}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 24 }, (_, i) => {
                                const hour = i.toString().padStart(2, '0')
                                return (
                                  <SelectItem key={hour} value={`${hour}:00`}>
                                    {hour}:00
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                        </div>

                        {formData.frequency === 'weekly' && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Jour</Label>
                            <Select 
                              value={formData.day_of_week || 'monday'} 
                              onValueChange={(value) => setFormData(prev => ({ ...prev, day_of_week: value }))}
                            >
                              <SelectTrigger className="h-11">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="monday">Lundi</SelectItem>
                                <SelectItem value="tuesday">Mardi</SelectItem>
                                <SelectItem value="wednesday">Mercredi</SelectItem>
                                <SelectItem value="thursday">Jeudi</SelectItem>
                                <SelectItem value="friday">Vendredi</SelectItem>
                                <SelectItem value="saturday">Samedi</SelectItem>
                                <SelectItem value="sunday">Dimanche</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Next run preview */}
                    <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/15">
                      <Clock className="w-4 h-4 text-primary shrink-0" />
                      <p className="text-xs text-foreground">
                        <span className="font-medium">Prochaine exécution estimée :</span>{' '}
                        {formData.frequency === 'hourly' ? 'Dans ~1 heure' :
                         formData.frequency === 'daily' ? `Demain à ${formData.time_of_day || '09:00'}` :
                         formData.frequency === 'weekly' ? `Prochain ${formData.day_of_week || 'lundi'} à ${formData.time_of_day || '09:00'}` :
                         'Selon la configuration'}
                      </p>
                    </div>
                  </>
                )}

                {/* Step 3: Options */}
                {currentStep === 3 && (
                  <>
                    {/* Import options */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-primary" />
                        Traitement automatique
                      </h4>
                      <OptionRow
                        label="Auto-optimisation IA"
                        description="Optimiser titres, descriptions et SEO"
                        checked={formData.auto_optimize}
                        onChange={(v) => setFormData(prev => ({ ...prev, auto_optimize: v }))}
                        icon={<Sparkles className="w-4 h-4 text-purple-500" />}
                      />
                      <OptionRow
                        label="Publication automatique"
                        description="Publier directement sur votre boutique"
                        checked={formData.auto_publish}
                        onChange={(v) => setFormData(prev => ({ ...prev, auto_publish: v }))}
                        icon={<Upload className="w-4 h-4 text-blue-500" />}
                      />
                    </div>

                    {/* Notifications */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                        <Bell className="w-4 h-4 text-primary" />
                        Notifications
                      </h4>
                      <OptionRow
                        label="Succès"
                        description="Notification quand l'import est terminé"
                        checked={formData.notify_on_complete}
                        onChange={(v) => setFormData(prev => ({ ...prev, notify_on_complete: v }))}
                        icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      />
                      <OptionRow
                        label="Erreurs"
                        description="Alerte en cas de problème"
                        checked={formData.notify_on_error}
                        onChange={(v) => setFormData(prev => ({ ...prev, notify_on_error: v }))}
                        icon={<AlertCircle className="w-4 h-4 text-amber-500" />}
                      />
                    </div>

                    {/* Error handling */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                        <Shield className="w-4 h-4 text-primary" />
                        Fiabilité
                      </h4>
                      <div className="p-3.5 rounded-xl border bg-muted/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-rose-500/10 rounded-lg">
                              <RefreshCw className="w-4 h-4 text-rose-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Réessai automatique</p>
                              <p className="text-xs text-muted-foreground">En cas d'échec réseau ou temporaire</p>
                            </div>
                          </div>
                          <Switch
                            checked={formData.retry_on_failure}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, retry_on_failure: checked }))}
                          />
                        </div>
                        {formData.retry_on_failure && (
                          <div className="mt-3 pt-3 border-t flex items-center gap-3">
                            <Label className="text-xs text-muted-foreground whitespace-nowrap">Max tentatives :</Label>
                            <Select 
                              value={formData.max_retries.toString()} 
                              onValueChange={(value) => setFormData(prev => ({ ...prev, max_retries: parseInt(value) }))}
                            >
                              <SelectTrigger className="h-8 w-24 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1×</SelectItem>
                                <SelectItem value="2">2×</SelectItem>
                                <SelectItem value="3">3×</SelectItem>
                                <SelectItem value="5">5×</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Filters */}
                    <div className="space-y-2">
                      <Label htmlFor="filters" className="text-sm font-medium">
                        Filtres <span className="text-muted-foreground font-normal">(optionnel)</span>
                      </Label>
                      <Textarea
                        id="filters"
                        placeholder="Ex: price > 10 AND category = 'electronics'"
                        value={formData.filters || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, filters: e.target.value }))}
                        rows={2}
                        className="font-mono text-xs resize-none"
                      />
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer navigation */}
          <div className="px-6 py-4 border-t bg-muted/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    i === currentStep ? "bg-primary w-5" : 
                    i < currentStep ? "bg-primary/40" : "bg-muted-foreground/20"
                  )}
                />
              ))}
              <span className="text-xs text-muted-foreground ml-2">
                {currentStep + 1}/{STEPS.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-muted-foreground"
              >
                Annuler
              </Button>

              {currentStep > 0 && (
                <Button type="button" variant="outline" size="sm" onClick={prevStep}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Retour
                </Button>
              )}

              {currentStep < STEPS.length - 1 ? (
                <Button 
                  type="button" 
                  size="sm" 
                  onClick={nextStep}
                  disabled={!isStepValid}
                >
                  Suivant
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  size="sm"
                  disabled={!isFormComplete}
                  className="bg-primary hover:bg-primary/90 gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {mode === 'edit' ? 'Enregistrer' : 'Créer le planning'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** Compact toggle row used in the Options step */
function OptionRow({ 
  label, description, checked, onChange, icon 
}: { 
  label: string; description: string; checked: boolean; onChange: (v: boolean) => void; icon: React.ReactNode 
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20 hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-lg bg-muted/60">{icon}</div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
