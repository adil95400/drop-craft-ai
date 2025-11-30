import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFulfillmentCarriers } from '@/hooks/useFulfillmentCarriers'
import { useFulfillmentShipments } from '@/hooks/useFulfillmentShipments'
import { Package } from 'lucide-react'

interface ShipmentCreationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string
}

export function ShipmentCreationDialog({
  open,
  onOpenChange,
  orderId,
}: ShipmentCreationDialogProps) {
  const { carriers } = useFulfillmentCarriers()
  const { createShipment, isCreating } = useFulfillmentShipments()
  
  const [selectedCarrier, setSelectedCarrier] = useState<string>('')
  const [weight, setWeight] = useState<string>('')
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    street: '',
    city: '',
    postal_code: '',
    country: '',
    phone: '',
    email: '',
  })

  const handleSubmit = () => {
    if (!selectedCarrier || !weight) return

    createShipment({
      orderId,
      carrierId: selectedCarrier,
      shippingAddress,
      weight: parseFloat(weight),
      autoGenerateLabel: true,
    })

    onOpenChange(false)
  }

  const activeCarriers = carriers?.filter(c => c.is_active)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Créer une expédition
          </DialogTitle>
          <DialogDescription>
            Sélectionnez un transporteur et renseignez les détails d'expédition
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Transporteur</Label>
            <Select value={selectedCarrier} onValueChange={setSelectedCarrier}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un transporteur" />
              </SelectTrigger>
              <SelectContent>
                {activeCarriers?.map((carrier) => (
                  <SelectItem key={carrier.id} value={carrier.id}>
                    {carrier.carrier_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Poids (kg)</Label>
            <Input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="1.5"
            />
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">Adresse de livraison</h3>
            
            <div>
              <Label>Nom complet</Label>
              <Input
                value={shippingAddress.name}
                onChange={(e) =>
                  setShippingAddress({ ...shippingAddress, name: e.target.value })
                }
                placeholder="Jean Dupont"
              />
            </div>

            <div>
              <Label>Adresse</Label>
              <Input
                value={shippingAddress.street}
                onChange={(e) =>
                  setShippingAddress({ ...shippingAddress, street: e.target.value })
                }
                placeholder="123 Rue de la Paix"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Ville</Label>
                <Input
                  value={shippingAddress.city}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, city: e.target.value })
                  }
                  placeholder="Paris"
                />
              </div>
              <div>
                <Label>Code postal</Label>
                <Input
                  value={shippingAddress.postal_code}
                  onChange={(e) =>
                    setShippingAddress({
                      ...shippingAddress,
                      postal_code: e.target.value,
                    })
                  }
                  placeholder="75001"
                />
              </div>
            </div>

            <div>
              <Label>Pays</Label>
              <Input
                value={shippingAddress.country}
                onChange={(e) =>
                  setShippingAddress({ ...shippingAddress, country: e.target.value })
                }
                placeholder="France"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Téléphone</Label>
                <Input
                  value={shippingAddress.phone}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, phone: e.target.value })
                  }
                  placeholder="+33 6 12 34 56 78"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={shippingAddress.email}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, email: e.target.value })
                  }
                  placeholder="client@example.com"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isCreating || !selectedCarrier || !weight}
            >
              {isCreating ? 'Création...' : 'Créer l\'expédition'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
