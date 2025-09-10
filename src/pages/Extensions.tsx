import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EnhancedIntegrationsHub } from '@/components/integrations/EnhancedIntegrationsHub'
import { ExtensionStore } from '@/components/extensions/ExtensionStore'
import { ExtensionNavigator } from '@/components/extensions/ExtensionNavigator'
import { Puzzle, Zap, Grid } from 'lucide-react'

export default function Extensions() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-background">
      <div className="container mx-auto p-6">
        <Tabs defaultValue="navigator" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="navigator" className="flex items-center gap-2">
              <Grid className="w-4 h-4" />
              Centre d'Extensions
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Intégrations
            </TabsTrigger>
            <TabsTrigger value="store" className="flex items-center gap-2">
              <Puzzle className="w-4 h-4" />
              Extension Store
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="navigator">
            <ExtensionNavigator />
          </TabsContent>
          
          <TabsContent value="integrations">
            <EnhancedIntegrationsHub />
          </TabsContent>
          
          <TabsContent value="store">
            <ExtensionStore />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}