import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EnhancedIntegrationsHub } from '@/components/integrations/EnhancedIntegrationsHub'
import { ExtensionStore } from '@/components/extensions/ExtensionStore'
import { Puzzle, Zap } from 'lucide-react'

export default function Extensions() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-background">
      <div className="container mx-auto p-6">
        <Tabs defaultValue="integrations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Intégrations
            </TabsTrigger>
            <TabsTrigger value="extensions" className="flex items-center gap-2">
              <Puzzle className="w-4 h-4" />
              Extensions Store
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="integrations">
            <EnhancedIntegrationsHub />
          </TabsContent>
          
          <TabsContent value="extensions">
            <ExtensionStore />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}