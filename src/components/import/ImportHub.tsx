import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useNewPlan } from '@/hooks/useNewPlan'
import { useQuotas } from '@/hooks/useQuotas'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { NewPlanGuard } from '@/components/plan/NewPlanGuard'
import { QuotaIndicator } from '@/components/plan/QuotaIndicator'
import { 
  Globe, 
  FileText, 
  Server, 
  ShoppingCart, 
  Zap,
  Settings,
  Plus,
  Eye
} from 'lucide-react'

interface ImportConnector {
  id: string
  category: 'feeds' | 'ecommerce' | 'ftp'
  name: string
  provider: string
  description: string
  icon: any
  requiredPlan: 'free' | 'pro' | 'ultra_pro'
  quotaKey?: string
  available: boolean
}

const connectors: ImportConnector[] = [
  // Feeds - Disponibles pour tous
  {
    id: 'csv',
    category: 'feeds',
    name: 'CSV/Excel',
    provider: 'csv',
    description: 'Import depuis fichiers CSV ou Excel',
    icon: FileText,
    requiredPlan: 'free',
    quotaKey: 'import_feeds_per_day',
    available: true
  },
  {
    id: 'json',
    category: 'feeds',
    name: 'JSON (URL)',
    provider: 'json',
    description: 'Import depuis URL JSON avec JSONPath',
    icon: Globe,
    requiredPlan: 'free',
    quotaKey: 'import_feeds_per_day',
    available: true
  },
  {
    id: 'xml',
    category: 'feeds',
    name: 'XML',
    provider: 'xml',
    description: 'Import depuis flux XML avec XPath',
    icon: FileText,
    requiredPlan: 'free',
    quotaKey: 'import_feeds_per_day',
    available: true
  },
  {
    id: 'google-sheets',
    category: 'feeds',
    name: 'Google Sheets',
    provider: 'google_sheets',
    description: 'Import depuis feuilles Google Sheets',
    icon: Globe,
    requiredPlan: 'free',
    quotaKey: 'import_feeds_per_day',
    available: true
  },

  // FTP - Disponible Standard (manuel), Pro (planifié), Ultra (avancé)
  {
    id: 'ftp',
    category: 'ftp',
    name: 'FTP/SFTP/FTPS',
    provider: 'ftp',
    description: 'Import depuis serveurs FTP/SFTP/FTPS',
    icon: Server,
    requiredPlan: 'free',
    quotaKey: 'import_ftp_per_day',
    available: true
  },

  // E-commerce - Pro et Ultra Pro seulement
  {
    id: 'woocommerce',
    category: 'ecommerce',
    name: 'WooCommerce',
    provider: 'woocommerce',
    description: 'Import depuis WooCommerce via API REST',
    icon: ShoppingCart,
    requiredPlan: 'pro',
    available: true
  },
  {
    id: 'prestashop',
    category: 'ecommerce',
    name: 'PrestaShop',
    provider: 'prestashop',
    description: 'Import via plugin PrestaShop dédié',
    icon: ShoppingCart,
    requiredPlan: 'pro',
    available: true
  },
  {
    id: 'shopify',
    category: 'ecommerce',
    name: 'Shopify',
    provider: 'shopify',
    description: 'Import via OAuth Shopify + Bulk Operations',
    icon: ShoppingCart,
    requiredPlan: 'ultra_pro',
    available: true
  },
  {
    id: 'bigcommerce',
    category: 'ecommerce',
    name: 'BigCommerce',
    provider: 'bigcommerce',
    description: 'Import via API BigCommerce',
    icon: ShoppingCart,
    requiredPlan: 'ultra_pro',
    available: true
  },
  {
    id: 'magento',
    category: 'ecommerce',
    name: 'Magento',
    provider: 'magento',
    description: 'Import via API Magento 2',
    icon: ShoppingCart,
    requiredPlan: 'ultra_pro',
    available: true
  }
]

export const ImportHub = () => {
  const { user } = useAuth()
  const { plan, hasPlan } = useNewPlan(user)
  const { quotas } = useQuotas(user)
  const [activeTab, setActiveTab] = useState('feeds')

  const getAvailableConnectors = (category: string) => {
    return connectors.filter(connector => 
      connector.category === category && 
      hasPlan(connector.requiredPlan)
    )
  }

  const getLockedConnectors = (category: string) => {
    return connectors.filter(connector => 
      connector.category === category && 
      !hasPlan(connector.requiredPlan)
    )
  }

  const ConnectorCard = ({ connector, locked = false }: { connector: ImportConnector, locked?: boolean }) => {
    const IconComponent = connector.icon
    const quota = connector.quotaKey ? quotas[connector.quotaKey] : null
    
    return (
      <Card className={`relative ${locked ? 'opacity-60' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${locked ? 'bg-muted' : 'bg-primary/10'}`}>
                <IconComponent className={`h-5 w-5 ${locked ? 'text-muted-foreground' : 'text-primary'}`} />
              </div>
              <div>
                <CardTitle className="text-base">{connector.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {connector.description}
                </p>
              </div>
            </div>
            {locked && (
              <Badge variant="outline" className="text-xs">
                {connector.requiredPlan === 'pro' ? 'Pro' : 'Ultra Pro'}
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {quota && !locked && (
            <div className="mb-3">
              <QuotaIndicator
                quotaKey={connector.quotaKey!}
                current={quota.currentCount}
                limit={quota.limit}
                label="Imports aujourd'hui"
                compact
              />
            </div>
          )}
          
          <div className="flex gap-2">
            {locked ? (
              <NewPlanGuard 
                requiredPlan={connector.requiredPlan}
                showUpgradeCard={false}
              >
                <Button size="sm" disabled>
                  <Settings className="h-4 w-4 mr-2" />
                  Configurer
                </Button>
              </NewPlanGuard>
            ) : (
              <>
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Tester
                </Button>
                <Button size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurer
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec quotas globaux */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <QuotaIndicator
              quotaKey="import_feeds_per_day"
              current={quotas['import_feeds_per_day']?.currentCount || 0}
              limit={quotas['import_feeds_per_day']?.limit || 10}
              label="Imports Feeds/Jour"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <QuotaIndicator
              quotaKey="import_ftp_per_day"
              current={quotas['import_ftp_per_day']?.currentCount || 0}
              limit={quotas['import_ftp_per_day']?.limit || 5}
              label="Imports FTP/Jour"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Badge className="text-lg px-4 py-2">
              Plan {plan === 'free' ? 'Gratuit' : plan === 'pro' ? 'Pro' : 'Ultra Pro'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Hub des connecteurs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="feeds" className="gap-2">
            <Globe className="h-4 w-4" />
            Feeds & Fichiers
          </TabsTrigger>
          <TabsTrigger value="ecommerce" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            E-commerce
          </TabsTrigger>
          <TabsTrigger value="ftp" className="gap-2">
            <Server className="h-4 w-4" />
            FTP/SFTP
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feeds" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getAvailableConnectors('feeds').map(connector => (
              <ConnectorCard key={connector.id} connector={connector} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ecommerce" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getAvailableConnectors('ecommerce').map(connector => (
              <ConnectorCard key={connector.id} connector={connector} />
            ))}
            
            {getLockedConnectors('ecommerce').map(connector => (
              <ConnectorCard key={connector.id} connector={connector} locked />
            ))}
          </div>
          
          {getAvailableConnectors('ecommerce').length === 0 && (
            <NewPlanGuard requiredPlan="pro" showUpgradeCard>
              <div className="text-center p-8">
                <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Connecteurs E-commerce</h3>
                <p className="text-muted-foreground">
                  Connectez-vous à vos plateformes e-commerce préférées
                </p>
              </div>
            </NewPlanGuard>
          )}
        </TabsContent>

        <TabsContent value="ftp" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {getAvailableConnectors('ftp').map(connector => (
              <ConnectorCard key={connector.id} connector={connector} />
            ))}
          </div>
          
          {/* Indicateurs des fonctionnalités FTP par plan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fonctionnalités FTP par Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Badge>Standard</Badge>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Import manuel</li>
                    <li>• Formats: CSV, XML, JSON, TXT</li>
                    <li>• 5 imports/jour</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <Badge className="bg-blue-100 text-blue-600">Pro</Badge>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• + Planification cron</li>
                    <li>• + Détection delta</li>
                    <li>• + Multi-serveurs</li>
                    <li>• 50 imports/jour</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <Badge className="bg-purple-100 text-purple-600">Ultra Pro</Badge>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• + Décompression ZIP/GZ</li>
                    <li>• + Déchiffrement PGP</li>
                    <li>• + Reprise sur gros fichiers</li>
                    <li>• Illimité</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}