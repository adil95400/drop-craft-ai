import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Store, 
  Package, 
  Users
} from 'lucide-react'
import ExtensionMarketplace from './ExtensionMarketplace'
import RealExtensionManager from './RealExtensionManager'

export const ExtensionStore: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
          <Store className="w-5 h-5 text-primary" />
          <span className="text-primary font-medium">Extension Store & Manager</span>
        </div>
        <h1 className="text-3xl font-bold">Centre d'Extensions Complet</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Gérez vos extensions installées et découvrez de nouvelles extensions 
          pour étendre les fonctionnalités de votre plateforme e-commerce
        </p>
      </div>

      <Tabs defaultValue="marketplace" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="marketplace" className="flex items-center gap-2">
            <Store className="w-4 h-4" />
            Marketplace
          </TabsTrigger>
          <TabsTrigger value="installed" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Extensions installées
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="marketplace">
          <ExtensionMarketplace />
        </TabsContent>
        
        <TabsContent value="installed">
          <RealExtensionManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ExtensionStore