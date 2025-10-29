import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EnhancedIntegrationsHub } from '@/components/integrations/EnhancedIntegrationsHub'
import { ExtensionStore } from '@/components/extensions/ExtensionStore'
import { ExtensionNavigator } from '@/components/extensions/ExtensionNavigator'
import { ExtensionAuthManager } from '@/components/extensions/ExtensionAuthManager'
import { ExtensionInstallGuide } from '@/components/extensions/ExtensionInstallGuide'
import { Puzzle, Zap, Grid, Chrome, BookOpen } from 'lucide-react'

export default function Extensions() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-background">
      <div className="container mx-auto p-6">
        <Tabs defaultValue="navigator" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="navigator" className="flex items-center gap-2">
              <Grid className="w-4 h-4" />
              Centre
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Intégrations
            </TabsTrigger>
            <TabsTrigger value="store" className="flex items-center gap-2">
              <Puzzle className="w-4 h-4" />
              Store
            </TabsTrigger>
            <TabsTrigger value="chrome" className="flex items-center gap-2">
              <Chrome className="w-4 h-4" />
              Chrome
            </TabsTrigger>
            <TabsTrigger value="guide" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Guide
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
          
          <TabsContent value="chrome">
            <ExtensionAuthManager />
          </TabsContent>
          
          <TabsContent value="guide">
            <ExtensionInstallGuide />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}