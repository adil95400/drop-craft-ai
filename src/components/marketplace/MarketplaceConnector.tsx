import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { 
  Store, 
  Plus, 
  RefreshCw, 
  Settings, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  Package,
  ShoppingCart,
  TrendingUp,
  ExternalLink,
  Upload,
  Download,
  Zap,
  Globe
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { motion } from 'framer-motion'

// Platform logos/icons mapping
const PLATFORM_CONFIGS = {
  amazon: {
    name: 'Amazon',
    color: 'from-orange-500 to-yellow-500',
    description: 'Amazon Seller Central / SP-API',
    markets: ['US', 'UK', 'DE', 'FR', 'IT', 'ES', 'JP', 'CA', 'AU'],
    features: ['Products', 'Orders', 'Inventory', 'FBA'],
  },
  ebay: {
    name: 'eBay',
    color: 'from-blue-600 to-blue-400',
    description: 'eBay Browse & Sell API',
    markets: ['US', 'UK', 'DE', 'FR', 'IT', 'ES', 'AU'],
    features: ['Listings', 'Orders', 'Inventory', 'Auctions'],
  },
  temu: {
    name: 'Temu',
    color: 'from-orange-600 to-red-500',
    description: 'Temu Seller API',
    markets: ['US', 'EU', 'UK'],
    features: ['Products', 'Import', 'Fulfillment', 'Tracking'],
  },
  cdiscount: {
    name: 'Cdiscount',
    color: 'from-green-500 to-emerald-500',
    description: 'Cdiscount Marketplace API',
    markets: ['FR'],
    features: ['Offers', 'Orders', 'Stock', 'Shipping'],
  },
}

interface MarketplaceConnectorProps {
  platform: keyof typeof PLATFORM_CONFIGS
  onConnect: (credentials: any) => Promise<void>
  onDisconnect?: () => Promise<void>
  isConnected?: boolean
  connectionData?: any
}

export function MarketplaceConnector({ 
  platform, 
  onConnect, 
  onDisconnect, 
  isConnected = false,
  connectionData 
}: MarketplaceConnectorProps) {
  const { toast } = useToast()
  const [isConnecting, setIsConnecting] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const config = PLATFORM_CONFIGS[platform]

  const handleConnect = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsConnecting(true)
    
    try {
      const formData = new FormData(e.currentTarget)
      const credentials = Object.fromEntries(formData.entries())
      await onConnect(credentials)
      setShowDialog(false)
      toast({
        title: 'Connexion réussie',
        description: `${config.name} a été connecté avec succès`,
      })
    } catch (error: any) {
      toast({
        title: 'Erreur de connexion',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.color}`} />
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-r ${config.color}`}>
              <Store className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">{config.name}</CardTitle>
              <CardDescription className="text-xs">{config.description}</CardDescription>
            </div>
          </div>
          {isConnected ? (
            <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connecté
            </Badge>
          ) : (
            <Badge variant="outline">Non connecté</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Markets */}
        <div className="flex flex-wrap gap-1">
          {config.markets.map((market) => (
            <Badge key={market} variant="secondary" className="text-xs">
              {market}
            </Badge>
          ))}
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-2">
          {config.features.map((feature) => (
            <div key={feature} className="flex items-center gap-1 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3 text-green-500" />
              {feature}
            </div>
          ))}
        </div>

        {/* Connection stats if connected */}
        {isConnected && connectionData && (
          <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Produits</p>
              <p className="text-lg font-semibold">{connectionData.products || 0}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Commandes</p>
              <p className="text-lg font-semibold">{connectionData.orders || 0}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {isConnected ? (
            <>
              <Button size="sm" className="flex-1" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync
              </Button>
              <Button size="sm" variant="outline">
                <Settings className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-destructive"
                onClick={onDisconnect}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button className={`w-full bg-gradient-to-r ${config.color}`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Connecter {config.name}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Connecter {config.name}</DialogTitle>
                  <DialogDescription>
                    Entrez vos identifiants API pour connecter votre compte {config.name}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleConnect} className="space-y-4">
                  {platform === 'amazon' && <AmazonCredentialsForm />}
                  {platform === 'ebay' && <EbayCredentialsForm />}
                  {platform === 'temu' && <TemuCredentialsForm />}
                  {platform === 'cdiscount' && <CdiscountCredentialsForm />}
                  
                  <Button type="submit" className="w-full" disabled={isConnecting}>
                    {isConnecting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Connexion en cours...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Connecter
                      </>
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Platform-specific credential forms
function AmazonCredentialsForm() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="seller_id">Seller ID</Label>
        <Input id="seller_id" name="seller_id" placeholder="A1B2C3D4E5F6G7" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="marketplace_id">Marketplace ID</Label>
        <Select name="marketplace_id" required>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un marketplace" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="A1PA6795UKMFR9">Amazon.de</SelectItem>
            <SelectItem value="A13V1IB3VIYZZH">Amazon.fr</SelectItem>
            <SelectItem value="A1F83G8C2ARO7P">Amazon.co.uk</SelectItem>
            <SelectItem value="A1RKKUPIHCS9HS">Amazon.es</SelectItem>
            <SelectItem value="APJ6JRA9NG5V4">Amazon.it</SelectItem>
            <SelectItem value="ATVPDKIKX0DER">Amazon.com</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="client_id">Client ID (LWA)</Label>
        <Input id="client_id" name="client_id" placeholder="amzn1.application-oa2-client.xxx" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="client_secret">Client Secret</Label>
        <Input id="client_secret" name="client_secret" type="password" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="refresh_token">Refresh Token</Label>
        <Input id="refresh_token" name="refresh_token" type="password" required />
      </div>
    </div>
  )
}

function EbayCredentialsForm() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="client_id">Client ID (App ID)</Label>
        <Input id="client_id" name="client_id" placeholder="YourAppID-PRD-xxx" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="client_secret">Client Secret (Cert ID)</Label>
        <Input id="client_secret" name="client_secret" type="password" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="refresh_token">Refresh Token</Label>
        <Input id="refresh_token" name="refresh_token" type="password" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="environment">Environnement</Label>
        <Select name="environment" defaultValue="production">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="production">Production</SelectItem>
            <SelectItem value="sandbox">Sandbox (Test)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function TemuCredentialsForm() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="seller_id">Seller ID</Label>
        <Input id="seller_id" name="seller_id" placeholder="TEMU_SELLER_XXX" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="store_id">Store ID (optionnel)</Label>
        <Input id="store_id" name="store_id" placeholder="STORE_XXX" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="api_key">API Key</Label>
        <Input id="api_key" name="api_key" type="password" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="api_secret">API Secret</Label>
        <Input id="api_secret" name="api_secret" type="password" required />
      </div>
    </div>
  )
}

function CdiscountCredentialsForm() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="seller_id">Seller ID</Label>
        <Input id="seller_id" name="seller_id" placeholder="123456" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="username">Nom d'utilisateur API</Label>
        <Input id="username" name="username" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe API</Label>
        <Input id="password" name="password" type="password" required />
      </div>
    </div>
  )
}

export default MarketplaceConnector
