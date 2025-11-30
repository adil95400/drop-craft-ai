import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Truck, Package } from 'lucide-react';
import { useFulfillmentCarriers } from '@/hooks/useFulfillmentCarriers';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CARRIERS = [
  { code: 'colissimo', name: 'Colissimo', icon: '🇫🇷', region: 'FR' },
  { code: 'chronopost', name: 'Chronopost', icon: '⚡', region: 'FR' },
  { code: 'mondial_relay', name: 'Mondial Relay', icon: '📍', region: 'FR' },
  { code: 'ups', name: 'UPS', icon: '🌍', region: 'INT' },
  { code: 'dhl', name: 'DHL', icon: '✈️', region: 'INT' },
  { code: 'fedex', name: 'FedEx', icon: '🚚', region: 'INT' },
];

export function CarrierConnectionModal({ open, onOpenChange }: Props) {
  const { connectCarrier, isConnecting } = useFulfillmentCarriers();
  const [selectedCarrier, setSelectedCarrier] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [credentials, setCredentials] = useState<Record<string, string>>({});

  const handleConnect = () => {
    if (!selectedCarrier) return;

    connectCarrier({
      carrierCode: selectedCarrier,
      credentials,
      isDefault,
    });

    onOpenChange(false);
    setSelectedCarrier('');
    setCredentials({});
    setIsDefault(false);
  };

  const getCredentialFields = (code: string) => {
    switch (code) {
      case 'colissimo':
      case 'chronopost':
        return [
          { key: 'accountNumber', label: 'Numéro de compte', type: 'text' },
          { key: 'password', label: 'Mot de passe', type: 'password' }
        ];
      case 'ups':
        return [
          { key: 'accessKey', label: 'Access Key', type: 'text' },
          { key: 'username', label: 'Username', type: 'text' },
          { key: 'password', label: 'Password', type: 'password' }
        ];
      case 'dhl':
      case 'fedex':
        return [
          { key: 'apiKey', label: 'API Key', type: 'text' },
          { key: 'apiSecret', label: 'API Secret', type: 'password' }
        ];
      case 'mondial_relay':
        return [
          { key: 'apiKey', label: 'API Key', type: 'text' }
        ];
      default:
        return [];
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Connecter un transporteur
          </DialogTitle>
          <DialogDescription>
            Sélectionnez et configurez un transporteur pour vos expéditions
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="FR" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="FR">France 🇫🇷</TabsTrigger>
            <TabsTrigger value="INT">International 🌍</TabsTrigger>
          </TabsList>

          <TabsContent value="FR" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {CARRIERS.filter(c => c.region === 'FR').map(carrier => (
                <button
                  key={carrier.code}
                  onClick={() => setSelectedCarrier(carrier.code)}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    selectedCarrier === carrier.code
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="text-3xl mb-2">{carrier.icon}</div>
                  <div className="font-medium">{carrier.name}</div>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="INT" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {CARRIERS.filter(c => c.region === 'INT').map(carrier => (
                <button
                  key={carrier.code}
                  onClick={() => setSelectedCarrier(carrier.code)}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    selectedCarrier === carrier.code
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="text-3xl mb-2">{carrier.icon}</div>
                  <div className="font-medium">{carrier.name}</div>
                </button>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {selectedCarrier && (
          <div className="space-y-4 mt-4 p-4 border rounded-lg">
            <h4 className="font-semibold">Configuration {CARRIERS.find(c => c.code === selectedCarrier)?.name}</h4>
            
            {getCredentialFields(selectedCarrier).map(field => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  type={field.type}
                  value={credentials[field.key] || ''}
                  onChange={(e) => setCredentials({ ...credentials, [field.key]: e.target.value })}
                  placeholder={`Entrez votre ${field.label.toLowerCase()}`}
                />
              </div>
            ))}

            <div className="flex items-center justify-between pt-4 border-t">
              <Label htmlFor="default" className="cursor-pointer">
                Définir comme transporteur par défaut
              </Label>
              <Switch
                id="default"
                checked={isDefault}
                onCheckedChange={setIsDefault}
              />
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleConnect} 
            disabled={!selectedCarrier || isConnecting}
          >
            {isConnecting ? 'Connexion...' : 'Connecter'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}