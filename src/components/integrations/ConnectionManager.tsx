import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useRealIntegrations } from "@/hooks/useRealIntegrations"
import { useToast } from "@/hooks/use-toast"
import { 
  Plus, 
  Settings, 
  Trash2, 
  TestTube,
  RefreshCw,
  Link,
  Unlink,
  Key,
  Lock
} from "lucide-react"

const INTEGRATION_TEMPLATES = [
  {
    id: 'shopify',
    name: 'Shopify',
    type: 'ecommerce',
    fields: [
      { name: 'shop_domain', label: 'Domaine de la boutique', type: 'text', placeholder: 'monshop.myshopify.com' },
      { name: 'access_token', label: 'Token d\'accès', type: 'password', placeholder: 'shpat_...' },
      { name: 'api_version', label: 'Version API', type: 'select', options: ['2023-10', '2023-07', '2023-04'] }
    ]
  },
  {
    id: 'aliexpress',
    name: 'AliExpress',
    type: 'supplier',
    fields: [
      { name: 'app_key', label: 'App Key', type: 'text' },
      { name: 'app_secret', label: 'App Secret', type: 'password' },
      { name: 'session_key', label: 'Session Key', type: 'password' },
      { name: 'seller_id', label: 'Seller ID', type: 'text' }
    ]
  },
  {
    id: 'bigbuy',
    name: 'BigBuy',
    type: 'supplier',
    fields: [
      { name: 'api_key', label: 'Clé API', type: 'password' },
      { name: 'language', label: 'Langue', type: 'select', options: ['fr', 'en', 'es', 'de'] },
      { name: 'currency', label: 'Devise', type: 'select', options: ['EUR', 'USD', 'GBP'] }
    ]
  },
  {
    id: 'amazon',
    name: 'Amazon',
    type: 'marketplace',
    fields: [
      { name: 'access_key', label: 'Access Key', type: 'text' },
      { name: 'secret_key', label: 'Secret Key', type: 'password' },
      { name: 'marketplace_id', label: 'Marketplace ID', type: 'text' },
      { name: 'seller_id', label: 'Seller ID', type: 'text' }
    ]
  }
]

export const ConnectionManager = () => {
  const { 
    integrations, 
    addIntegration, 
    updateIntegration, 
    deleteIntegration,
    testConnection,
    isAdding, 
    isUpdating, 
    isDeleting 
  } = useRealIntegrations()
  const { toast } = useToast()
  
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingIntegration, setEditingIntegration] = useState<any>(null)
  const [testResults, setTestResults] = useState<Record<string, any>>({})

  const handleTemplateSelect = (templateId: string) => {
    const template = INTEGRATION_TEMPLATES.find(t => t.id === templateId)
    setSelectedTemplate(template)
    setFormData({})
  }

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }))
  }

  const handleCreateConnection = async () => {
    if (!selectedTemplate) return

    try {
      const connectionData = {
        platform_name: selectedTemplate.name,
        platform_type: selectedTemplate.type,
        connection_status: 'disconnected' as const,
        is_active: false,
        sync_frequency: 'daily' as const,
        ...formData
      }

      // Separate credentials from main data
      const credentials = selectedTemplate.fields
        .filter((field: any) => field.type === 'password')
        .reduce((acc: any, field: any) => {
          acc[field.name] = formData[field.name]
          return acc
        }, {})

      const integrationData = Object.keys(connectionData).reduce((acc: any, key) => {
        if (!selectedTemplate.fields.find((f: any) => f.name === key && f.type === 'password')) {
          acc[key] = connectionData[key as keyof typeof connectionData]
        }
        return acc
      }, {})

      await addIntegration({ ...integrationData, credentials })
      
      toast({
        title: "Connexion créée",
        description: `La connexion ${selectedTemplate.name} a été créée avec succès.`
      })
      
      setIsDialogOpen(false)
      setSelectedTemplate(null)
      setFormData({})
    } catch (error) {
      toast({
        title: "Erreur de création",
        description: "Impossible de créer la connexion.",
        variant: "destructive"
      })
    }
  }

  const handleTestConnection = async (integration: any) => {
    try {
      await testConnection(integration.id)
      setTestResults(prev => ({ ...prev, [integration.id]: { success: true, timestamp: Date.now() } }))
      toast({
        title: "Test réussi",
        description: "La connexion fonctionne correctement."
      })
    } catch (error) {
      setTestResults(prev => ({ ...prev, [integration.id]: { success: false, timestamp: Date.now() } }))
      toast({
        title: "Test échoué",
        description: "La connexion ne fonctionne pas correctement.",
        variant: "destructive"
      })
    }
  }

  const handleToggleConnection = async (integration: any) => {
    try {
      const newStatus = integration.connection_status === 'connected' ? 'disconnected' : 'connected'
      await updateIntegration({
        id: integration.id,
        updates: { 
          connection_status: newStatus,
          is_active: newStatus === 'connected'
        }
      })
      
      toast({
        title: newStatus === 'connected' ? "Connexion activée" : "Connexion désactivée",
        description: `L'intégration ${integration.platform_name} a été ${newStatus === 'connected' ? 'activée' : 'désactivée'}.`
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut de la connexion.",
        variant: "destructive"
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <Link className="w-4 h-4 text-green-600" />
      case 'disconnected':
        return <Unlink className="w-4 h-4 text-gray-400" />
      default:
        return <RefreshCw className="w-4 h-4 text-yellow-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Connecté</Badge>
      case 'disconnected':
        return <Badge variant="outline">Déconnecté</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">En cours</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Gestionnaire de Connexions</h3>
          <p className="text-sm text-muted-foreground">
            Gérez vos connexions aux plateformes externes
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Connexion
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer une Nouvelle Connexion</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {!selectedTemplate ? (
                <div>
                  <Label className="text-base font-medium">Choisissez une plateforme</Label>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {INTEGRATION_TEMPLATES.map(template => (
                      <Card 
                        key={template.id}
                        className="cursor-pointer hover:shadow-md transition-shadow border-border/50"
                        onClick={() => handleTemplateSelect(template.id)}
                      >
                        <CardContent className="p-4">
                          <div className="text-center">
                            <div className="font-medium">{template.name}</div>
                            <div className="text-xs text-muted-foreground">{template.type}</div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedTemplate(null)}
                    >
                      ← Retour
                    </Button>
                    <h4 className="font-medium">Configuration {selectedTemplate.name}</h4>
                  </div>
                  
                  {selectedTemplate.fields.map((field: any) => (
                    <div key={field.name} className="space-y-2">
                      <Label htmlFor={field.name}>{field.label}</Label>
                      {field.type === 'select' ? (
                        <Select 
                          value={formData[field.name] || ''} 
                          onValueChange={(value) => handleFieldChange(field.name, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Choisir ${field.label.toLowerCase()}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options.map((option: string) => (
                              <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="relative">
                          <Input
                            id={field.name}
                            type={field.type}
                            placeholder={field.placeholder}
                            value={formData[field.name] || ''}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                          />
                          {field.type === 'password' && (
                            <Lock className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={handleCreateConnection}
                      disabled={isAdding}
                      className="flex-1"
                    >
                      {isAdding ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Création...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Créer Connexion
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Existing Connections */}
      <div className="space-y-4">
        {integrations.map((integration) => (
          <Card key={integration.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getStatusIcon(integration.connection_status)}
                  <div>
                    <div className="font-medium">{integration.platform_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {integration.platform_type} • {integration.shop_domain || 'Configuration personnalisée'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    {getStatusBadge(integration.connection_status)}
                    {testResults[integration.id] && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Dernière test: {testResults[integration.id].success ? 'Réussi' : 'Échoué'}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleTestConnection(integration)}
                    >
                      <TestTube className="w-4 h-4" />
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleToggleConnection(integration)}
                    >
                      {integration.connection_status === 'connected' ? (
                        <Unlink className="w-4 h-4" />
                      ) : (
                        <Link className="w-4 h-4" />
                      )}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditingIntegration(integration)}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteIntegration(integration.id)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {integrations.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Key className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h4 className="font-medium mb-2">Aucune connexion configurée</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Commencez par créer votre première connexion à une plateforme externe.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Créer une Connexion
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
