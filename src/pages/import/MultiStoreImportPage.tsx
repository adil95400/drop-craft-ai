import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Store, ArrowLeft, Zap, CheckCircle2, Globe, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { MultiStoreUrlImport } from '@/components/import/MultiStoreUrlImport'
import { useUnifiedStores } from '@/hooks/useUnifiedStores'

const features = [
  {
    icon: Zap,
    title: 'Import simultané',
    description: 'Un seul clic pour importer vers toutes vos boutiques'
  },
  {
    icon: Globe,
    title: '25+ plateformes',
    description: 'AliExpress, Amazon, Temu, eBay, Shopify et plus'
  },
  {
    icon: CheckCircle2,
    title: 'Traçabilité complète',
    description: 'Suivez chaque import avec logs détaillés'
  },
  {
    icon: Package,
    title: 'Données enrichies',
    description: 'Images HD, variantes, descriptions optimisées'
  }
]

export default function MultiStoreImportPage() {
  const navigate = useNavigate()
  const { stores } = useUnifiedStores()
  const activeStores = stores.filter(s => s.is_active)

  return (
    <ChannablePageWrapper
      title="Import Multi-Boutiques"
      description="Importez un produit vers plusieurs boutiques simultanément"
      heroImage="import"
    >
      <div className="space-y-8">
        {/* Header Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-primary">{stores.length}</div>
              <div className="text-sm text-muted-foreground">Boutiques connectées</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-500">{activeStores.length}</div>
              <div className="text-sm text-muted-foreground">Boutiques actives</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-500">25+</div>
              <div className="text-sm text-muted-foreground">Plateformes sources</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-purple-500">∞</div>
              <div className="text-sm text-muted-foreground">Imports illimités</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Import Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <MultiStoreUrlImport 
            onImportComplete={(results) => {
              console.log('Import complete:', results)
            }}
          />
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold mb-4">Fonctionnalités AutoDS-like</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <Card key={index} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <feature.icon className="h-8 w-8 text-primary mb-3" />
                  <h4 className="font-medium">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Connected Stores Overview */}
        {stores.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Store className="h-5 w-5" />
                  Vos boutiques connectées
                </CardTitle>
                <CardDescription>
                  Sélectionnez les boutiques cibles lors de l'import
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {stores.map((store) => (
                    <Badge
                      key={store.id}
                      variant={store.is_active ? 'default' : 'outline'}
                      className="px-3 py-1.5"
                    >
                      {store.name}
                      {!store.is_active && (
                        <span className="ml-1 text-xs opacity-60">(inactif)</span>
                      )}
                    </Badge>
                  ))}
                </div>
                <Button
                  variant="link"
                  className="mt-4 px-0"
                  onClick={() => navigate('/stores-channels/connect')}
                >
                  + Connecter une nouvelle boutique
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* No stores warning */}
        {stores.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-amber-500/50 bg-amber-500/5">
              <CardContent className="p-6 text-center">
                <Store className="h-12 w-12 mx-auto mb-4 text-amber-500" />
                <h3 className="text-lg font-semibold mb-2">Aucune boutique connectée</h3>
                <p className="text-muted-foreground mb-4">
                  Connectez au moins une boutique pour utiliser l'import multi-boutiques
                </p>
                <Button onClick={() => navigate('/stores-channels/connect')}>
                  Connecter une boutique
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </ChannablePageWrapper>
  )
}
