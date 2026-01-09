import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Truck, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface CarriersManagerProps {
  carriers: any[]
  isLoading: boolean
  onCreate: (carrier: any) => void
}

export function CarriersManager({ carriers, isLoading, onCreate }: CarriersManagerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newCarrier, setNewCarrier] = useState({
    name: '',
    carrier_code: '',
    is_active: true,
    tracking_url_template: ''
  })

  const handleCreate = () => {
    if (!newCarrier.name || !newCarrier.carrier_code) return;
    onCreate(newCarrier)
    setIsAdding(false)
    setNewCarrier({
      name: '',
      carrier_code: '',
      is_active: true,
      tracking_url_template: ''
    })
  }

  if (isLoading) {
    return <div className="text-center py-8">Chargement...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Transporteurs configurés</h3>
          <p className="text-sm text-muted-foreground">
            {carriers.length} transporteur{carriers.length > 1 ? 's' : ''} disponible{carriers.length > 1 ? 's' : ''}
          </p>
        </div>
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau Transporteur</DialogTitle>
              <DialogDescription>Configurez un nouveau transporteur</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nom du transporteur</Label>
                <Input
                  value={newCarrier.name}
                  onChange={(e) => setNewCarrier({ ...newCarrier, name: e.target.value })}
                  placeholder="Colissimo, Chronopost, UPS..."
                />
              </div>
              <div className="space-y-2">
                <Label>Code transporteur</Label>
                <Select
                  value={newCarrier.carrier_code}
                  onValueChange={(value) => setNewCarrier({ ...newCarrier, carrier_code: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="colissimo">Colissimo</SelectItem>
                    <SelectItem value="chronopost">Chronopost</SelectItem>
                    <SelectItem value="ups">UPS</SelectItem>
                    <SelectItem value="dhl">DHL</SelectItem>
                    <SelectItem value="fedex">FedEx</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full">
                Créer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {carriers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Truck className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Aucun transporteur configuré</p>
            <p className="text-sm text-muted-foreground">Ajoutez votre premier transporteur</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {carriers.map((carrier) => (
            <Card key={carrier.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{carrier.name}</CardTitle>
                    <CardDescription className="uppercase">{carrier.carrier_code}</CardDescription>
                  </div>
                  <Badge variant={carrier.is_active ? 'default' : 'secondary'}>
                    {carrier.is_active ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Template suivi: {carrier.tracking_url_template || 'Non configuré'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
