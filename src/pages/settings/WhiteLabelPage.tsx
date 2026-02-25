/**
 * WhiteLabelPage - White-Label Enterprise avec persistence Supabase
 */
import { useRef } from 'react'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide'
import { Palette, Upload, Globe, Mail, Eye, Crown, Image, Type, Save, Loader2, Monitor } from 'lucide-react'
import { useWhiteLabelSettings } from '@/hooks/useWhiteLabelSettings'
import { Skeleton } from '@/components/ui/skeleton'

const FONT_OPTIONS = [
  'Inter', 'Poppins', 'Roboto', 'Montserrat', 'Lato', 'Open Sans',
  'Playfair Display', 'Raleway', 'Nunito', 'DM Sans',
]

export default function WhiteLabelPage() {
  const { settings, setSettings, loading, saving, save, uploadAsset } = useWhiteLabelSettings()
  const logoRef = useRef<HTMLInputElement>(null)
  const faviconRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (file: File, type: 'logo' | 'favicon' | 'login-bg') => {
    const url = await uploadAsset(file, type)
    if (url) {
      const key = type === 'logo' ? 'logo_url' : type === 'favicon' ? 'favicon_url' : 'custom_login_bg'
      setSettings(s => ({ ...s, [key]: url }))
    }
  }

  const handleSave = () => save(settings)

  if (loading) {
    return (
      <ChannablePageWrapper title="White-Label" subtitle="Personnalisation" description="Chargement...">
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </ChannablePageWrapper>
    )
  }

  return (
    <ChannablePageWrapper
      title="White-Label Enterprise"
      subtitle="Personnalisation"
      description="Transformez ShopOpti en votre propre plateforme avec votre marque"
      heroImage="settings"
      badge={{ label: 'Enterprise', variant: 'default' }}
      actions={
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Sauvegarder
        </Button>
      }
    >
      <div className="space-y-6">
        <AdvancedFeatureGuide {...ADVANCED_GUIDES.whiteLabel} />

        <Tabs defaultValue="branding" className="w-full">
          <TabsList className="grid grid-cols-4 w-full max-w-lg">
            <TabsTrigger value="branding"><Palette className="h-4 w-4 mr-1" /> Marque</TabsTrigger>
            <TabsTrigger value="assets"><Image className="h-4 w-4 mr-1" /> Assets</TabsTrigger>
            <TabsTrigger value="domain"><Globe className="h-4 w-4 mr-1" /> Domaine</TabsTrigger>
            <TabsTrigger value="preview"><Monitor className="h-4 w-4 mr-1" /> Aperçu</TabsTrigger>
          </TabsList>

          {/* BRANDING TAB */}
          <TabsContent value="branding" className="space-y-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  Identité Visuelle
                </CardTitle>
                <CardDescription>Couleurs, typographie et nom de marque</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brandName">Nom de la marque</Label>
                    <Input id="brandName" value={settings.brand_name} onChange={(e) => setSettings(s => ({ ...s, brand_name: e.target.value }))} placeholder="Votre marque" />
                  </div>
                  <div className="space-y-2">
                    <Label>Police de caractères</Label>
                    <Select value={settings.font_family} onValueChange={(v) => setSettings(s => ({ ...s, font_family: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map(f => <SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Couleur primaire', key: 'primary_color' as const },
                    { label: 'Couleur secondaire', key: 'secondary_color' as const },
                    { label: 'Couleur accent', key: 'accent_color' as const },
                  ].map(c => (
                    <div key={c.key} className="space-y-2">
                      <Label>{c.label}</Label>
                      <div className="flex gap-2">
                        <input type="color" value={settings[c.key]} onChange={(e) => setSettings(s => ({ ...s, [c.key]: e.target.value }))} className="h-10 w-14 rounded border cursor-pointer" />
                        <Input value={settings[c.key]} onChange={(e) => setSettings(s => ({ ...s, [c.key]: e.target.value }))} className="flex-1 font-mono text-sm" />
                      </div>
                    </div>
                  ))}
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
                  <Switch checked={settings.email_branding} onCheckedChange={(v) => setSettings(s => ({ ...s, email_branding: v }))} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Eye className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Masquer le badge ShopOpti</p>
                      <p className="text-xs text-muted-foreground">Retirer toute mention de ShopOpti dans l'interface</p>
                    </div>
                  </div>
                  <Switch checked={settings.hide_platform_badge} onCheckedChange={(v) => setSettings(s => ({ ...s, hide_platform_badge: v }))} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="h-5 w-5 text-primary" />
                  CSS personnalisé
                </CardTitle>
                <CardDescription>Ajoutez du CSS custom pour aller plus loin</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={settings.custom_css}
                  onChange={(e) => setSettings(s => ({ ...s, custom_css: e.target.value }))}
                  placeholder={`:root {\n  --primary: 240 5% 26%;\n  --radius: 0.75rem;\n}`}
                  className="font-mono text-sm min-h-[120px]"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ASSETS TAB */}
          <TabsContent value="assets" className="space-y-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5 text-primary" />
                  Logo & Favicon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Logo */}
                  <div
                    className="border-2 border-dashed rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => logoRef.current?.click()}
                  >
                    {settings.logo_url ? (
                      <img src={settings.logo_url} alt="Logo" className="max-h-20 mx-auto mb-3 object-contain" />
                    ) : (
                      <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    )}
                    <p className="font-medium">Logo principal</p>
                    <p className="text-sm text-muted-foreground">PNG ou SVG, 400×100px recommandé</p>
                    <Button variant="outline" size="sm" className="mt-3">
                      {settings.logo_url ? 'Remplacer' : 'Uploader'}
                    </Button>
                    <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'logo') }} />
                  </div>

                  {/* Favicon */}
                  <div
                    className="border-2 border-dashed rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => faviconRef.current?.click()}
                  >
                    {settings.favicon_url ? (
                      <img src={settings.favicon_url} alt="Favicon" className="h-10 w-10 mx-auto mb-3 object-contain" />
                    ) : (
                      <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    )}
                    <p className="font-medium">Favicon</p>
                    <p className="text-sm text-muted-foreground">ICO ou PNG, 32×32px</p>
                    <Button variant="outline" size="sm" className="mt-3">
                      {settings.favicon_url ? 'Remplacer' : 'Uploader'}
                    </Button>
                    <input ref={faviconRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'favicon') }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DOMAIN TAB */}
          <TabsContent value="domain" className="space-y-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Domaine personnalisé
                </CardTitle>
                <CardDescription>Accédez à votre plateforme via votre propre nom de domaine</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Domaine custom</Label>
                  <Input
                    value={settings.custom_domain}
                    onChange={(e) => setSettings(s => ({ ...s, custom_domain: e.target.value }))}
                    placeholder="app.votremarque.com"
                  />
                </div>
                <div className="p-4 rounded-lg bg-muted/50 space-y-2 text-sm">
                  <p className="font-medium">Configuration DNS requise :</p>
                  <div className="font-mono text-xs space-y-1 text-muted-foreground">
                    <p>Type: CNAME</p>
                    <p>Nom: app (ou votre sous-domaine)</p>
                    <p>Valeur: custom.shopopti.io</p>
                    <p>TTL: 3600</p>
                  </div>
                  <Badge variant="outline" className="mt-2">SSL automatique après propagation DNS</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PREVIEW TAB */}
          <TabsContent value="preview" className="space-y-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-primary" />
                  Aperçu en temps réel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="rounded-xl border-2 overflow-hidden"
                  style={{ fontFamily: settings.font_family }}
                >
                  {/* Mock header */}
                  <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ backgroundColor: settings.primary_color }}>
                    {settings.logo_url ? (
                      <img src={settings.logo_url} alt="Logo" className="h-8 object-contain" />
                    ) : (
                      <div className="text-white font-bold text-lg">
                        {settings.brand_name || 'Votre Marque'}
                      </div>
                    )}
                    <div className="ml-auto flex gap-2">
                      {['Dashboard', 'Produits', 'Commandes'].map(item => (
                        <span key={item} className="text-white/80 text-sm px-3 py-1 rounded hover:text-white cursor-default">{item}</span>
                      ))}
                    </div>
                  </div>
                  {/* Mock content */}
                  <div className="p-6 bg-background min-h-[200px]">
                    <h2 className="text-xl font-bold mb-2" style={{ color: settings.primary_color }}>
                      Bienvenue sur {settings.brand_name || 'votre plateforme'}
                    </h2>
                    <p className="text-muted-foreground text-sm mb-4">Voici un aperçu de votre interface personnalisée.</p>
                    <div className="flex gap-3">
                      <button className="px-4 py-2 rounded-md text-white text-sm font-medium" style={{ backgroundColor: settings.primary_color }}>
                        Action principale
                      </button>
                      <button className="px-4 py-2 rounded-md text-white text-sm font-medium" style={{ backgroundColor: settings.secondary_color }}>
                        Action secondaire
                      </button>
                      <button className="px-4 py-2 rounded-md text-white text-sm font-medium" style={{ backgroundColor: settings.accent_color }}>
                        Accent
                      </button>
                    </div>
                  </div>
                  {/* Mock footer */}
                  {!settings.hide_platform_badge && (
                    <div className="px-6 py-3 border-t bg-muted/30 text-xs text-muted-foreground text-center">
                      Propulsé par ShopOpti
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ChannablePageWrapper>
  )
}
