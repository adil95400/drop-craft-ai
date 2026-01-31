import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useIntegrationsUnified } from '@/hooks/unified'
import { useToast } from '@/hooks/use-toast'

interface EditIntegrationModalProps {
  integration: any
}

export const EditIntegrationModal = ({ integration }: EditIntegrationModalProps) => {
  const [formData, setFormData] = useState({
    platform_name: integration.platform_name || '',
    platform_url: integration.platform_url || '',
    shop_domain: integration.shop_domain || '',
    seller_id: integration.seller_id || '',
    is_active: integration.is_active || false,
    sync_frequency: integration.sync_frequency || 'daily'
  })

  const { updateIntegration, isUpdating } = useIntegrationsUnified()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await updateIntegration({
        id: integration.id,
        updates: formData
      })
      
      toast({
        title: "Intégration mise à jour",
        description: "Les modifications ont été sauvegardées avec succès."
      })
    } catch (error) {
      toast({
        title: "Erreur de mise à jour",
        description: "Impossible de sauvegarder les modifications.",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Connecté</Badge>
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>
      case 'disconnected':
        return <Badge variant="outline">Déconnecté</Badge>
      default:
        return <Badge variant="secondary">Inconnu</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header avec informations */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div>
          <h3 className="font-semibold">{integration.platform_name}</h3>
          <p className="text-sm text-muted-foreground">Type: {integration.platform_type}</p>
          <p className="text-xs text-muted-foreground">
            Créé le: {new Date(integration.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {getStatusBadge(integration.connection_status)}
          {integration.last_sync_at && (
            <p className="text-xs text-muted-foreground">
              Dernière sync: {new Date(integration.last_sync_at).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Informations générales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="platform_name">Nom de la plateforme</Label>
            <Input
              id="platform_name"
              value={formData.platform_name}
              onChange={(e) => setFormData({ ...formData, platform_name: e.target.value })}
              placeholder="Nom d'affichage"
            />
          </div>
          
          <div>
            <Label htmlFor="platform_url">URL de la plateforme</Label>
            <Input
              id="platform_url"
              type="url"
              value={formData.platform_url}
              onChange={(e) => setFormData({ ...formData, platform_url: e.target.value })}
              placeholder="https://example.com"
            />
          </div>
        </div>

        {/* Configuration spécifique */}
        {integration.platform_type === 'shopify' && (
          <div>
            <Label htmlFor="shop_domain">Domaine de la boutique</Label>
            <Input
              id="shop_domain"
              value={formData.shop_domain}
              onChange={(e) => setFormData({ ...formData, shop_domain: e.target.value })}
              placeholder="ma-boutique.myshopify.com"
            />
          </div>
        )}

        {['aliexpress', 'amazon', 'ebay'].includes(integration.platform_type) && (
          <div>
            <Label htmlFor="seller_id">ID du vendeur</Label>
            <Input
              id="seller_id"
              value={formData.seller_id}
              onChange={(e) => setFormData({ ...formData, seller_id: e.target.value })}
              placeholder="Votre ID vendeur"
            />
          </div>
        )}

        {/* Paramètres de synchronisation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sync_frequency">Fréquence de synchronisation</Label>
            <Select 
              value={formData.sync_frequency} 
              onValueChange={(value) => setFormData({ ...formData, sync_frequency: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manuel</SelectItem>
                <SelectItem value="hourly">Toutes les heures</SelectItem>
                <SelectItem value="daily">Quotidienne</SelectItem>
                <SelectItem value="weekly">Hebdomadaire</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 pt-6">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Intégration active</Label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="submit"
            disabled={isUpdating}
            className="min-w-24"
          >
            {isUpdating ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </form>

      {/* Informations avancées */}
      <div className="space-y-4 pt-4 border-t">
        <h4 className="font-medium">Informations techniques</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">ID:</span>
            <p className="text-muted-foreground break-all">{integration.id}</p>
          </div>
          <div>
            <span className="font-medium">Type:</span>
            <p className="text-muted-foreground">{integration.platform_type}</p>
          </div>
          <div>
            <span className="font-medium">Statut de connexion:</span>
            <p className="text-muted-foreground">{integration.connection_status}</p>
          </div>
          <div>
            <span className="font-medium">Dernière modification:</span>
            <p className="text-muted-foreground">
              {new Date(integration.updated_at).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}