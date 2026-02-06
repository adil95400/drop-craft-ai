/**
 * WhiteLabelPage - Personnalisation marque blanche
 */
import { useState } from 'react'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide'
import { Palette, Upload, Globe, Mail, Eye, Crown, Image, Type } from 'lucide-react'
import { toast } from 'sonner'

export default function WhiteLabelPage() {
  const [settings, setSettings] = useState({
    brandName: '',
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    logoUrl: '',
    faviconUrl: '',
    customDomain: '',
    emailBranding: true,
    hideShopOptiBadge: false
  })

  const handleSave = () => {
    toast.success('Paramètres White-Label sauvegardés')
  }

  return (
    <ChannablePageWrapper
      title="White-Label"
      subtitle="Personnalisation"
      description="Transformez ShopOpti en votre propre plateforme avec votre marque"
      heroImage="settings"
      badge={{ label: 'Ultra Pro', variant: 'default' }}
      actions={
        <Button onClick={handleSave}>
          <Eye className="h-4 w-4 mr-2" />
          Sauvegarder
        </Button>
      }
    >
      <div className="space-y-6">
        <AdvancedFeatureGuide {...ADVANCED_GUIDES.whiteLabel} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Identité Visuelle
            </CardTitle>
            <CardDescription>Définissez les couleurs et l'identité de votre marque</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brandName">Nom de la marque</Label>
                <Input id="brandName" value={settings.brandName} onChange={(e) => setSettings(s => ({ ...s, brandName: e.target.value }))} placeholder="Votre marque" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customDomain">Domaine personnalisé</Label>
                <Input id="customDomain" value={settings.customDomain} onChange={(e) => setSettings(s => ({ ...s, customDomain: e.target.value }))} placeholder="app.votremarque.com" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Couleur primaire</Label>
                <div className="flex gap-2">
                  <input type="color" value={settings.primaryColor} onChange={(e) => setSettings(s => ({ ...s, primaryColor: e.target.value }))} className="h-10 w-14 rounded border cursor-pointer" />
                  <Input value={settings.primaryColor} readOnly className="flex-1" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Couleur secondaire</Label>
                <div className="flex gap-2">
                  <input type="color" value={settings.secondaryColor} onChange={(e) => setSettings(s => ({ ...s, secondaryColor: e.target.value }))} className="h-10 w-14 rounded border cursor-pointer" />
                  <Input value={settings.secondaryColor} readOnly className="flex-1" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5 text-primary" />
              Logo & Favicon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-2 border-dashed rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">Logo principal</p>
                <p className="text-sm text-muted-foreground">PNG ou SVG, 400x100px recommandé</p>
                <Button variant="outline" size="sm" className="mt-3">Uploader</Button>
              </div>
              <div className="border-2 border-dashed rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">Favicon</p>
                <p className="text-sm text-muted-foreground">ICO ou PNG, 32x32px</p>
                <Button variant="outline" size="sm" className="mt-3">Uploader</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Emails brandés</p>
                  <p className="text-xs text-muted-foreground">Appliquer votre marque aux emails transactionnels</p>
                </div>
              </div>
              <Switch checked={settings.emailBranding} onCheckedChange={(v) => setSettings(s => ({ ...s, emailBranding: v }))} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Masquer le badge ShopOpti</p>
                  <p className="text-xs text-muted-foreground">Retirer toute mention de ShopOpti dans l'interface</p>
                </div>
              </div>
              <Switch checked={settings.hideShopOptiBadge} onCheckedChange={(v) => setSettings(s => ({ ...s, hideShopOptiBadge: v }))} />
            </div>
          </CardContent>
        </Card>
      </div>
    </ChannablePageWrapper>
  )
}