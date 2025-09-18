import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Store, Package } from 'lucide-react'
import SimpleExtensionInstaller from './SimpleExtensionInstaller'

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

      <Tabs defaultValue="simple" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="simple" className="flex items-center gap-2">
            <Store className="w-4 h-4" />
            Extensions Simplifiées
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="simple">
          <SimpleExtensionInstaller
            extension={{
              id: 'test-ext-1',
              name: 'Extension Test',
              description: 'Une extension de test',
              version: '1.0.0',
              price: 0,
              downloads_count: 0
            }}
            onClose={() => {}}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ExtensionStore