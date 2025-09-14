import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { AsyncButton } from '@/components/ui/async-button'
import { Settings, Save, ShoppingCart, DollarSign, Package, Eye, Globe, Zap } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ProductSettingsData {
  general: {
    defaultCurrency: string
    lowStockAlert: number
    autoGenerateSKU: boolean
    enableInventoryTracking: boolean
  }
  pricing: {
    includeTax: boolean
    taxRate: number
    showPriceComparison: boolean
    dynamicPricing: boolean
  }
  seo: {
    autoGenerateMetaTitles: boolean
    autoGenerateMetaDescriptions: boolean
    includeSchemaMarkup: boolean
    socialMediaOptimization: boolean
  }
  display: {
    showStockQuantity: boolean
    showProfitMargins: boolean
    enableQuickActions: boolean
    defaultViewMode: string
  }
  automation: {
    autoPublishProducts: boolean
    syncWithExternalSources: boolean
    enableAIOptimization: boolean
    autoBackup: boolean
  }
}

export function ProductSettings() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<ProductSettingsData>({
    general: {
      defaultCurrency: 'EUR',
      lowStockAlert: 10,
      autoGenerateSKU: true,
      enableInventoryTracking: true
    },
    pricing: {
      includeTax: true,
      taxRate: 20,
      showPriceComparison: true,
      dynamicPricing: false
    },
    seo: {
      autoGenerateMetaTitles: true,
      autoGenerateMetaDescriptions: true,
      includeSchemaMarkup: true,
      socialMediaOptimization: true
    },
    display: {
      showStockQuantity: true,
      showProfitMargins: false,
      enableQuickActions: true,
      defaultViewMode: 'grid'
    },
    automation: {
      autoPublishProducts: false,
      syncWithExternalSources: true,
      enableAIOptimization: true,
      autoBackup: true
    }
  })

  const handleSaveSettings = async () => {
    // Simuler la sauvegarde des paramètres
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    toast({
      title: "Paramètres sauvegardés",
      description: "Tous les paramètres produits ont été mis à jour avec succès",
    })
  }

  const handleResetDefaults = async () => {
    // Simuler la réinitialisation
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setSettings({
      general: {
        defaultCurrency: 'EUR',
        lowStockAlert: 10,
        autoGenerateSKU: true,
        enableInventoryTracking: true
      },
      pricing: {
        includeTax: false,
        taxRate: 0,
        showPriceComparison: false,
        dynamicPricing: false
      },
      seo: {
        autoGenerateMetaTitles: false,
        autoGenerateMetaDescriptions: false,
        includeSchemaMarkup: false,
        socialMediaOptimization: false
      },
      display: {
        showStockQuantity: true,
        showProfitMargins: false,
        enableQuickActions: false,
        defaultViewMode: 'list'
      },
      automation: {
        autoPublishProducts: false,
        syncWithExternalSources: false,
        enableAIOptimization: false,
        autoBackup: false
      }
    })

    toast({
      title: "Paramètres réinitialisés",
      description: "Les paramètres par défaut ont été restaurés",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Configuration des Paramètres Produits
          </h2>
          <p className="text-muted-foreground">
            Personnalisez le comportement et l'affichage de votre catalogue produits
          </p>
        </div>
        <div className="flex gap-2">
          <AsyncButton
            variant="outline"
            onClick={handleResetDefaults}
            loadingText="Réinitialisation..."
          >
            Réinitialiser
          </AsyncButton>
          <AsyncButton
            onClick={handleSaveSettings}
            loadingText="Sauvegarde..."
            successMessage="Sauvegardé !"
            showSuccessState
            icon={<Save className="h-4 w-4" />}
          >
            Sauvegarder
          </AsyncButton>
        </div>
      </div>

      {/* Paramètres Généraux */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Paramètres Généraux
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Devise par défaut</Label>
              <Select 
                value={settings.general.defaultCurrency}
                onValueChange={(value) => setSettings(prev => ({
                  ...prev,
                  general: { ...prev.general, defaultCurrency: value }
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                  <SelectItem value="USD">Dollar US ($)</SelectItem>
                  <SelectItem value="GBP">Livre Sterling (£)</SelectItem>
                  <SelectItem value="CHF">Franc Suisse (CHF)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lowStock">Seuil stock faible</Label>
              <Input
                id="lowStock"
                type="number"
                value={settings.general.lowStockAlert}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  general: { ...prev.general, lowStockAlert: parseInt(e.target.value) || 0 }
                }))}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoSKU">Génération automatique des SKU</Label>
                <p className="text-sm text-muted-foreground">Générer automatiquement les codes SKU pour les nouveaux produits</p>
              </div>
              <Switch
                id="autoSKU"
                checked={settings.general.autoGenerateSKU}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  general: { ...prev.general, autoGenerateSKU: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="inventoryTracking">Suivi des stocks</Label>
                <p className="text-sm text-muted-foreground">Activer le suivi automatique des niveaux de stock</p>
              </div>
              <Switch
                id="inventoryTracking"
                checked={settings.general.enableInventoryTracking}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  general: { ...prev.general, enableInventoryTracking: checked }
                }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Paramètres Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Paramètres de Prix
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taxRate">Taux de TVA (%)</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.1"
                value={settings.pricing.taxRate}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  pricing: { ...prev.pricing, taxRate: parseFloat(e.target.value) || 0 }
                }))}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="includeTax">Inclure la TVA dans les prix</Label>
                <p className="text-sm text-muted-foreground">Afficher les prix TTC par défaut</p>
              </div>
              <Switch
                id="includeTax"
                checked={settings.pricing.includeTax}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  pricing: { ...prev.pricing, includeTax: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="priceComparison">Comparaison de prix</Label>
                <p className="text-sm text-muted-foreground">Afficher les comparaisons avec la concurrence</p>
              </div>
              <Switch
                id="priceComparison"
                checked={settings.pricing.showPriceComparison}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  pricing: { ...prev.pricing, showPriceComparison: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="dynamicPricing">Prix dynamiques IA</Label>
                <p className="text-sm text-muted-foreground">Ajustement automatique des prix par IA</p>
                <Badge variant="secondary" className="mt-1">Premium</Badge>
              </div>
              <Switch
                id="dynamicPricing"
                checked={settings.pricing.dynamicPricing}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  pricing: { ...prev.pricing, dynamicPricing: checked }
                }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Paramètres SEO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Paramètres SEO
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoMetaTitles">Génération automatique des titres meta</Label>
                <p className="text-sm text-muted-foreground">Créer automatiquement des titres SEO optimisés</p>
              </div>
              <Switch
                id="autoMetaTitles"
                checked={settings.seo.autoGenerateMetaTitles}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  seo: { ...prev.seo, autoGenerateMetaTitles: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoMetaDesc">Génération automatique des descriptions meta</Label>
                <p className="text-sm text-muted-foreground">Créer automatiquement des descriptions SEO</p>
              </div>
              <Switch
                id="autoMetaDesc"
                checked={settings.seo.autoGenerateMetaDescriptions}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  seo: { ...prev.seo, autoGenerateMetaDescriptions: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="schemaMarkup">Schema Markup structuré</Label>
                <p className="text-sm text-muted-foreground">Ajouter des données structurées pour les moteurs de recherche</p>
              </div>
              <Switch
                id="schemaMarkup"
                checked={settings.seo.includeSchemaMarkup}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  seo: { ...prev.seo, includeSchemaMarkup: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="socialMedia">Optimisation réseaux sociaux</Label>
                <p className="text-sm text-muted-foreground">Meta tags Open Graph et Twitter Cards</p>
              </div>
              <Switch
                id="socialMedia"
                checked={settings.seo.socialMediaOptimization}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  seo: { ...prev.seo, socialMediaOptimization: checked }
                }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Paramètres d'Affichage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Paramètres d'Affichage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="viewMode">Mode d'affichage par défaut</Label>
            <Select 
              value={settings.display.defaultViewMode}
              onValueChange={(value) => setSettings(prev => ({
                ...prev,
                display: { ...prev.display, defaultViewMode: value }
              }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">Grille</SelectItem>
                <SelectItem value="list">Liste</SelectItem>
                <SelectItem value="cards">Cartes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="showStock">Afficher les quantités en stock</Label>
                <p className="text-sm text-muted-foreground">Montrer le stock disponible aux clients</p>
              </div>
              <Switch
                id="showStock"
                checked={settings.display.showStockQuantity}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  display: { ...prev.display, showStockQuantity: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="showMargins">Afficher les marges (admin)</Label>
                <p className="text-sm text-muted-foreground">Voir les marges bénéficiaires dans l'interface admin</p>
              </div>
              <Switch
                id="showMargins"
                checked={settings.display.showProfitMargins}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  display: { ...prev.display, showProfitMargins: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="quickActions">Actions rapides</Label>
                <p className="text-sm text-muted-foreground">Boutons d'action rapide sur les produits</p>
              </div>
              <Switch
                id="quickActions"
                checked={settings.display.enableQuickActions}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  display: { ...prev.display, enableQuickActions: checked }
                }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Paramètres d'Automatisation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Automatisation IA
            <Badge variant="outline">Pro</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoPublish">Publication automatique</Label>
                <p className="text-sm text-muted-foreground">Publier automatiquement les produits importés</p>
              </div>
              <Switch
                id="autoPublish"
                checked={settings.automation.autoPublishProducts}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  automation: { ...prev.automation, autoPublishProducts: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="syncExternal">Synchronisation externe</Label>
                <p className="text-sm text-muted-foreground">Synchroniser avec les sources externes (AliExpress, etc.)</p>
              </div>
              <Switch
                id="syncExternal"
                checked={settings.automation.syncWithExternalSources}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  automation: { ...prev.automation, syncWithExternalSources: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="aiOptimization">Optimisation IA</Label>
                <p className="text-sm text-muted-foreground">Optimisation automatique des descriptions et prix par IA</p>
                <Badge variant="secondary" className="mt-1">Premium</Badge>
              </div>
              <Switch
                id="aiOptimization"
                checked={settings.automation.enableAIOptimization}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  automation: { ...prev.automation, enableAIOptimization: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoBackup">Sauvegarde automatique</Label>
                <p className="text-sm text-muted-foreground">Sauvegardes quotidiennes du catalogue</p>
              </div>
              <Switch
                id="autoBackup"
                checked={settings.automation.autoBackup}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  automation: { ...prev.automation, autoBackup: checked }
                }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}