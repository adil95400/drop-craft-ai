import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Truck, 
  Plus, 
  Settings, 
  Power, 
  ExternalLink, 
  MoreVertical,
  MapPin,
  Clock,
  CheckCircle2,
  Package,
  Globe,
  Zap,
  Edit,
  Trash2,
  Star
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface CarriersManagerProps {
  carriers: any[]
  isLoading: boolean
  onCreate: (carrier: any) => void
}

const CARRIER_OPTIONS = [
  { code: 'colissimo', name: 'Colissimo', logo: '📦', color: 'bg-yellow-500/10 text-yellow-600', description: 'Service postal français' },
  { code: 'chronopost', name: 'Chronopost', logo: '⚡', color: 'bg-red-500/10 text-red-600', description: 'Livraison express' },
  { code: 'ups', name: 'UPS', logo: '🟤', color: 'bg-amber-600/10 text-amber-700', description: 'United Parcel Service' },
  { code: 'dhl', name: 'DHL', logo: '🟡', color: 'bg-yellow-400/10 text-yellow-600', description: 'DHL Express' },
  { code: 'fedex', name: 'FedEx', logo: '🟣', color: 'bg-purple-500/10 text-purple-600', description: 'Federal Express' },
  { code: 'mondialrelay', name: 'Mondial Relay', logo: '🔵', color: 'bg-blue-500/10 text-blue-600', description: 'Points relais' },
  { code: 'gls', name: 'GLS', logo: '🟢', color: 'bg-green-500/10 text-green-600', description: 'General Logistics' },
  { code: 'dpd', name: 'DPD', logo: '🔴', color: 'bg-rose-500/10 text-rose-600', description: 'Dynamic Parcel Distribution' },
]

export function CarriersManager({ carriers, isLoading, onCreate }: CarriersManagerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [selectedCarrierCode, setSelectedCarrierCode] = useState('')
  const [newCarrier, setNewCarrier] = useState({
    name: '',
    carrier_code: '',
    is_active: true,
    tracking_url_template: '',
    is_default: false
  })

  const handleSelectCarrier = (code: string) => {
    const option = CARRIER_OPTIONS.find(c => c.code === code)
    setSelectedCarrierCode(code)
    setNewCarrier(prev => ({
      ...prev,
      carrier_code: code,
      name: option?.name || ''
    }))
  }

  const handleCreate = () => {
    if (!newCarrier.name || !newCarrier.carrier_code) return
    onCreate(newCarrier)
    setIsAdding(false)
    setSelectedCarrierCode('')
    setNewCarrier({
      name: '',
      carrier_code: '',
      is_active: true,
      tracking_url_template: '',
      is_default: false
    })
  }

  const getCarrierOption = (code: string) => {
    return CARRIER_OPTIONS.find(c => c.code === code) || { 
      name: code, 
      logo: '📦', 
      color: 'bg-muted text-muted-foreground',
      description: 'Transporteur personnalisé'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Chargement des transporteurs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">Transporteurs configurés</h3>
          <p className="text-sm text-muted-foreground">
            {carriers.length} transporteur{carriers.length > 1 ? 's' : ''} • {carriers.filter(c => c.is_active).length} actif{carriers.filter(c => c.is_active).length > 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un transporteur
        </Button>
      </div>

      {/* Empty State */}
      {carriers.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              <Truck className="w-10 h-10 text-primary" />
            </div>
            <h4 className="text-lg font-semibold mb-2">Aucun transporteur configuré</h4>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
              Ajoutez vos transporteurs pour automatiser vos expéditions et le suivi des colis
            </p>
            <Button onClick={() => setIsAdding(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter votre premier transporteur
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {carriers.map((carrier) => {
            const option = getCarrierOption(carrier.carrier_code)
            return (
              <Card 
                key={carrier.id} 
                className={cn(
                  "group hover:shadow-lg transition-all duration-200 border-border/50",
                  !carrier.is_active && "opacity-60"
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2.5 rounded-xl text-xl", option.color)}>
                        {option.logo}
                      </div>
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {carrier.name || option.name}
                          {carrier.is_default && (
                            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                          )}
                        </CardTitle>
                        <CardDescription className="text-xs uppercase tracking-wide">
                          {carrier.carrier_code}
                        </CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Settings className="w-4 h-4 mr-2" />
                          Paramètres API
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Star className="w-4 h-4 mr-2" />
                          Définir par défaut
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant={carrier.is_active ? 'default' : 'secondary'}
                      className={cn(
                        "gap-1",
                        carrier.is_active && "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                      )}
                    >
                      {carrier.is_active ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          Actif
                        </>
                      ) : (
                        <>
                          <Power className="w-3 h-3" />
                          Inactif
                        </>
                      )}
                    </Badge>
                    <Switch checked={carrier.is_active} />
                  </div>
                  
                  <Separator />
                  
                  {/* Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5" />
                        Tracking URL
                      </span>
                      <span className="text-xs">
                        {carrier.tracking_url_template ? (
                          <Badge variant="outline" className="text-xs font-normal">
                            Configuré
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground/50">Non configuré</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5" />
                        Expéditions
                      </span>
                      <span className="font-medium text-foreground">0</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Ajouté
                      </span>
                      <span className="text-xs">
                        {new Date(carrier.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add Carrier Dialog */}
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle>Ajouter un Transporteur</DialogTitle>
                <DialogDescription>
                  Configurez un nouveau transporteur pour vos expéditions
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Carrier Selection Grid */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Sélectionner un transporteur</Label>
              <div className="grid grid-cols-4 gap-2">
                {CARRIER_OPTIONS.map((option) => (
                  <button
                    key={option.code}
                    type="button"
                    onClick={() => handleSelectCarrier(option.code)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all hover:bg-muted/50",
                      selectedCarrierCode === option.code 
                        ? "border-primary bg-primary/5" 
                        : "border-transparent bg-muted/30"
                    )}
                  >
                    <span className="text-2xl">{option.logo}</span>
                    <span className="text-[10px] font-medium text-center leading-tight">
                      {option.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Carrier Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="carrier_name">Nom personnalisé</Label>
                <Input
                  id="carrier_name"
                  value={newCarrier.name}
                  onChange={(e) => setNewCarrier({ ...newCarrier, name: e.target.value })}
                  placeholder="Ex: Colissimo Express"
                  className="h-11 bg-muted/30"
                />
                <p className="text-xs text-muted-foreground">
                  Vous pouvez personnaliser le nom pour différencier plusieurs configurations
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tracking_url">URL de suivi (optionnel)</Label>
                <Input
                  id="tracking_url"
                  value={newCarrier.tracking_url_template}
                  onChange={(e) => setNewCarrier({ ...newCarrier, tracking_url_template: e.target.value })}
                  placeholder="https://tracking.carrier.com/track/{tracking_number}"
                  className="h-11 bg-muted/30 font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Utilisez <code className="px-1 py-0.5 bg-muted rounded">{'{tracking_number}'}</code> comme placeholder
                </p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="space-y-0.5">
                  <Label htmlFor="is_default" className="text-sm font-medium cursor-pointer">
                    Transporteur par défaut
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Sera sélectionné automatiquement pour les nouvelles expéditions
                  </p>
                </div>
                <Switch
                  id="is_default"
                  checked={newCarrier.is_default}
                  onCheckedChange={(checked) => setNewCarrier({ ...newCarrier, is_default: checked })}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsAdding(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={!newCarrier.name || !newCarrier.carrier_code}
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
