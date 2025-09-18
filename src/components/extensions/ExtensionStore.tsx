import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Store, Package, Code2, BarChart3, Palette, Bug, Rocket, Shield, BookOpen } from 'lucide-react'
import SimpleExtensionInstaller from './SimpleExtensionInstaller'
import AdvancedMarketplace from './AdvancedMarketplace'
import ExtensionTemplates from './ExtensionTemplates'
import DeveloperAnalytics from './DeveloperAnalytics'
import ExtensionEditor from './ExtensionEditor'
import ExtensionSandbox from './ExtensionSandbox'
import ExtensionDeployment from './ExtensionDeployment'
import ExtensionSecurity from './ExtensionSecurity'
import ExtensionDocumentation from './ExtensionDocumentation'

export const ExtensionStore: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
          <Store className="w-5 h-5 text-primary" />
          <span className="text-primary font-medium">Extension Store & Manager Complet</span>
        </div>
        <h1 className="text-3xl font-bold">Centre d'Extensions Professionnel</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Plateforme complète pour découvrir, créer, gérer et monétiser vos extensions e-commerce 
          avec des outils professionnels et des analytics avancées
        </p>
      </div>

      <Tabs defaultValue="marketplace" className="space-y-6">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="marketplace" className="flex items-center gap-2">
            <Store className="w-4 h-4" />
            Marketplace
          </TabsTrigger>
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <Code2 className="w-4 h-4" />
            Éditeur
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="sandbox" className="flex items-center gap-2">
            <Bug className="w-4 h-4" />
            Sandbox
          </TabsTrigger>
          <TabsTrigger value="deployment" className="flex items-center gap-2">
            <Rocket className="w-4 h-4" />
            Déploiement
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Sécurité
          </TabsTrigger>
          <TabsTrigger value="documentation" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Documentation
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="simple" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Simple
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="marketplace">
          <AdvancedMarketplace />
        </TabsContent>

        <TabsContent value="editor">
          <ExtensionEditor />
        </TabsContent>

        <TabsContent value="templates">
          <ExtensionTemplates />
        </TabsContent>

        <TabsContent value="sandbox">
          <ExtensionSandbox />
        </TabsContent>

        <TabsContent value="deployment">
          <ExtensionDeployment />
        </TabsContent>

        <TabsContent value="security">
          <ExtensionSecurity />
        </TabsContent>

        <TabsContent value="documentation">
          <ExtensionDocumentation />
        </TabsContent>

        <TabsContent value="analytics">
          <DeveloperAnalytics />
        </TabsContent>
        
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