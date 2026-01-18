import { useState, useEffect } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Calendar, Clock, Globe, Settings, Zap, FileText, 
  Link, Key, RefreshCw, Bell, Shield, CheckCircle2
} from 'lucide-react'
import { cn } from '@/lib/utils'

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

export function ScheduleFormDialog({ 
  open, 
  onOpenChange, 
  schedule, 
  onSubmit,
  mode = 'create'
}: ScheduleFormDialogProps) {
  const [formData, setFormData] = useState<ScheduleFormData>(defaultFormData)
  const [activeTab, setActiveTab] = useState('basic')
  const [isValidating, setIsValidating] = useState(false)
  const [urlValid, setUrlValid] = useState<boolean | null>(null)

  useEffect(() => {
    if (schedule) {
      setFormData({ ...defaultFormData, ...schedule })
    } else {
      setFormData(defaultFormData)
    }
    setActiveTab('basic')
    setUrlValid(null)
  }, [schedule, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const validateUrl = async () => {
    if (!formData.source_url) return
    setIsValidating(true)
    // Simulate URL validation
    await new Promise(resolve => setTimeout(resolve, 1000))
    setUrlValid(formData.source_url.startsWith('http'))
    setIsValidating(false)
  }

  const sourceTypeOptions = [
    { value: 'url', label: 'URL Produit', icon: Link, description: 'Import depuis une URL de page produit' },
    { value: 'csv', label: 'Fichier CSV', icon: FileText, description: 'Import depuis un fichier CSV' },
    { value: 'xml', label: 'Flux XML', icon: Globe, description: 'Flux XML/RSS (Google Shopping, etc.)' },
    { value: 'api', label: 'API REST', icon: Zap, description: 'Connexion à une API externe' },
    { value: 'ftp', label: 'FTP/SFTP', icon: Shield, description: 'Téléchargement depuis serveur FTP' }
  ]

  const frequencyOptions = [
    { value: 'hourly', label: 'Toutes les heures', description: 'Exécution chaque heure' },
    { value: 'daily', label: 'Quotidien', description: 'Une fois par jour' },
    { value: 'weekly', label: 'Hebdomadaire', description: 'Une fois par semaine' },
    { value: 'monthly', label: 'Mensuel', description: 'Une fois par mois' },
    { value: 'custom', label: 'Personnalisé', description: 'Expression CRON personnalisée' }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-xl">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {mode === 'edit' ? 'Modifier le planning' : 'Créer un planning'}
              </DialogTitle>
              <DialogDescription>
                {mode === 'edit' 
                  ? 'Modifiez les paramètres de votre import planifié'
                  : 'Configurez un import automatique récurrent'
                }
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="basic" className="flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Général</span>
              </TabsTrigger>
              <TabsTrigger value="source" className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Source</span>
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Planning</span>
              </TabsTrigger>
              <TabsTrigger value="options" className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Options</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto pr-2 -mr-2">
              {/* Tab: Général */}
              <TabsContent value="basic" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du planning *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Import AliExpress quotidien"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optionnelle)</Label>
                  <Textarea
                    id="description"
                    placeholder="Décrivez l'objectif de ce planning..."
                    value={formData.description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <div>
                    <Label htmlFor="active" className="font-medium">Activer le planning</Label>
                    <p className="text-sm text-muted-foreground">Le planning s'exécutera automatiquement</p>
                  </div>
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                  />
                </div>
              </TabsContent>

              {/* Tab: Source */}
              <TabsContent value="source" className="space-y-4 mt-0">
                <div className="space-y-3">
                  <Label>Type de source *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {sourceTypeOptions.map((option) => (
                      <Card 
                        key={option.value}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-md",
                          formData.source_type === option.value 
                            ? "border-primary bg-primary/5 ring-1 ring-primary" 
                            : "hover:border-primary/50"
                        )}
                        onClick={() => setFormData(prev => ({ ...prev, source_type: option.value as any }))}
                      >
                        <CardContent className="p-3 flex items-start gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            formData.source_type === option.value 
                              ? "bg-primary/20 text-primary" 
                              : "bg-muted text-muted-foreground"
                          )}>
                            <option.icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{option.label}</p>
                            <p className="text-xs text-muted-foreground truncate">{option.description}</p>
                          </div>
                          {formData.source_type === option.value && (
                            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {formData.source_type !== 'csv' && (
                  <div className="space-y-2">
                    <Label htmlFor="source_url">
                      {formData.source_type === 'api' ? 'Endpoint API' : 
                       formData.source_type === 'ftp' ? 'Adresse FTP' : 
                       'URL source'}
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
                            "h-11 pr-10",
                            urlValid === true && "border-green-500",
                            urlValid === false && "border-red-500"
                          )}
                        />
                        {urlValid !== null && (
                          <div className={cn(
                            "absolute right-3 top-1/2 -translate-y-1/2",
                            urlValid ? "text-green-500" : "text-red-500"
                          )}>
                            {urlValid ? <CheckCircle2 className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                          </div>
                        )}
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={validateUrl}
                        disabled={!formData.source_url || isValidating}
                      >
                        {isValidating ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          'Valider'
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {(formData.source_type === 'api' || formData.source_type === 'ftp') && (
                  <div className="space-y-2">
                    <Label htmlFor="api_key" className="flex items-center gap-2">
                      <Key className="w-3.5 h-3.5" />
                      Clé API / Mot de passe
                    </Label>
                    <Input
                      id="api_key"
                      type="password"
                      placeholder="Entrez votre clé d'authentification"
                      value={formData.api_key || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
                      className="h-11"
                    />
                  </div>
                )}
              </TabsContent>

              {/* Tab: Planning */}
              <TabsContent value="schedule" className="space-y-4 mt-0">
                <div className="space-y-3">
                  <Label>Fréquence d'exécution *</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {frequencyOptions.map((option) => (
                      <div
                        key={option.value}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                          formData.frequency === option.value 
                            ? "border-primary bg-primary/5" 
                            : "hover:border-primary/50"
                        )}
                        onClick={() => setFormData(prev => ({ ...prev, frequency: option.value as any }))}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                          formData.frequency === option.value ? "border-primary" : "border-muted-foreground"
                        )}>
                          {formData.frequency === option.value && (
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{option.label}</p>
                          <p className="text-xs text-muted-foreground">{option.description}</p>
                        </div>
                        {formData.frequency === option.value && (
                          <Badge variant="secondary" className="text-xs">
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Sélectionné
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {formData.frequency === 'custom' && (
                  <div className="space-y-2">
                    <Label htmlFor="custom_cron">Expression CRON</Label>
                    <Input
                      id="custom_cron"
                      placeholder="0 9 * * 1-5 (Lun-Ven à 9h)"
                      value={formData.custom_cron || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, custom_cron: e.target.value }))}
                      className="h-11 font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                      Format: minute heure jour mois jour_semaine
                    </p>
                  </div>
                )}

                {formData.frequency !== 'hourly' && formData.frequency !== 'custom' && (
                  <div className="space-y-2">
                    <Label htmlFor="time_of_day">Heure d'exécution</Label>
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
                )}

                {formData.frequency === 'weekly' && (
                  <div className="space-y-2">
                    <Label htmlFor="day_of_week">Jour de la semaine</Label>
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
              </TabsContent>

              {/* Tab: Options */}
              <TabsContent value="options" className="space-y-4 mt-0">
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    Options d'import
                  </h4>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <Label className="font-medium">Auto-optimisation IA</Label>
                        <p className="text-xs text-muted-foreground">Optimiser les titres et descriptions</p>
                      </div>
                      <Switch
                        checked={formData.auto_optimize}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_optimize: checked }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <Label className="font-medium">Publication automatique</Label>
                        <p className="text-xs text-muted-foreground">Publier directement sur la boutique</p>
                      </div>
                      <Switch
                        checked={formData.auto_publish}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_publish: checked }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary" />
                    Notifications
                  </h4>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <Label className="font-medium">Notifier à la fin</Label>
                        <p className="text-xs text-muted-foreground">Recevoir une notification de succès</p>
                      </div>
                      <Switch
                        checked={formData.notify_on_complete}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notify_on_complete: checked }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <Label className="font-medium">Notifier les erreurs</Label>
                        <p className="text-xs text-muted-foreground">Être alerté en cas d'échec</p>
                      </div>
                      <Switch
                        checked={formData.notify_on_error}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notify_on_error: checked }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    Gestion des erreurs
                  </h4>
                  
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <Label className="font-medium">Réessayer en cas d'échec</Label>
                      <p className="text-xs text-muted-foreground">Jusqu'à {formData.max_retries} tentatives</p>
                    </div>
                    <Switch
                      checked={formData.retry_on_failure}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, retry_on_failure: checked }))}
                    />
                  </div>

                  {formData.retry_on_failure && (
                    <div className="space-y-2 pl-4">
                      <Label htmlFor="max_retries">Nombre de tentatives</Label>
                      <Select 
                        value={formData.max_retries.toString()} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, max_retries: parseInt(value) }))}
                      >
                        <SelectTrigger className="h-11 w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 tentative</SelectItem>
                          <SelectItem value="2">2 tentatives</SelectItem>
                          <SelectItem value="3">3 tentatives</SelectItem>
                          <SelectItem value="5">5 tentatives</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filters">Filtres de produits (optionnel)</Label>
                  <Textarea
                    id="filters"
                    placeholder="Ex: price > 10 AND category = 'electronics'"
                    value={formData.filters || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, filters: e.target.value }))}
                    rows={2}
                    className="font-mono text-sm"
                  />
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="pt-4 mt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-primary to-purple-600"
              disabled={!formData.name.trim()}
            >
              {mode === 'edit' ? 'Enregistrer' : 'Créer le planning'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
