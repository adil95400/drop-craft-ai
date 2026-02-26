import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Paintbrush, Globe, Image, Type, Palette, Eye, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface WhiteLabelConfig {
  brandName: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  customDomain: string;
  customCss: string;
  hideOriginalBranding: boolean;
  customFontUrl: string;
  fontFamily: string;
  emailFromName: string;
  emailReplyTo: string;
  loginPageTitle: string;
  loginPageSubtitle: string;
  footerText: string;
  supportUrl: string;
}

const DEFAULT_CONFIG: WhiteLabelConfig = {
  brandName: 'ShopOpti+',
  logoUrl: '',
  faviconUrl: '',
  primaryColor: '#3B82F6',
  secondaryColor: '#8B5CF6',
  accentColor: '#10B981',
  customDomain: '',
  customCss: '',
  hideOriginalBranding: false,
  customFontUrl: '',
  fontFamily: 'Inter',
  emailFromName: '',
  emailReplyTo: '',
  loginPageTitle: 'Bienvenue',
  loginPageSubtitle: 'Connectez-vous à votre espace',
  footerText: '',
  supportUrl: '',
};

export function WhiteLabelConfigurator() {
  const [config, setConfig] = useState<WhiteLabelConfig>(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);

  const updateConfig = (key: keyof WhiteLabelConfig, value: string | boolean) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      toast.success('Configuration White-Label sauvegardée');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Paintbrush className="h-6 w-6 text-primary" />
            White-Label
          </h2>
          <p className="text-muted-foreground">Personnalisez entièrement l'apparence de votre plateforme</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setConfig(DEFAULT_CONFIG)}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Réinitialiser
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="branding">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="branding"><Palette className="mr-1 h-4 w-4" />Marque</TabsTrigger>
          <TabsTrigger value="typography"><Type className="mr-1 h-4 w-4" />Typo</TabsTrigger>
          <TabsTrigger value="domain"><Globe className="mr-1 h-4 w-4" />Domaine</TabsTrigger>
          <TabsTrigger value="preview"><Eye className="mr-1 h-4 w-4" />Aperçu</TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Identité visuelle</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Nom de marque</Label>
                  <Input value={config.brandName} onChange={e => updateConfig('brandName', e.target.value)} />
                </div>
                <div>
                  <Label>URL du logo</Label>
                  <Input value={config.logoUrl} onChange={e => updateConfig('logoUrl', e.target.value)} placeholder="https://..." />
                </div>
                <div>
                  <Label>URL du favicon</Label>
                  <Input value={config.faviconUrl} onChange={e => updateConfig('faviconUrl', e.target.value)} placeholder="https://..." />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={config.hideOriginalBranding} onCheckedChange={v => updateConfig('hideOriginalBranding', v)} />
                  <Label>Masquer le branding original</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Couleurs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'primaryColor' as const, label: 'Couleur primaire' },
                  { key: 'secondaryColor' as const, label: 'Couleur secondaire' },
                  { key: 'accentColor' as const, label: 'Couleur d\'accent' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-3">
                    <input type="color" value={config[key]} onChange={e => updateConfig(key, e.target.value)} className="h-10 w-10 rounded border cursor-pointer" />
                    <div className="flex-1">
                      <Label>{label}</Label>
                      <Input value={config[key]} onChange={e => updateConfig(key, e.target.value)} className="mt-1" />
                    </div>
                  </div>
                ))}
                <div className="flex gap-2 mt-4">
                  {[config.primaryColor, config.secondaryColor, config.accentColor].map((c, i) => (
                    <div key={i} className="h-12 flex-1 rounded-lg shadow-sm" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Page de connexion</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Titre</Label>
                <Input value={config.loginPageTitle} onChange={e => updateConfig('loginPageTitle', e.target.value)} />
              </div>
              <div>
                <Label>Sous-titre</Label>
                <Input value={config.loginPageSubtitle} onChange={e => updateConfig('loginPageSubtitle', e.target.value)} />
              </div>
              <div>
                <Label>Texte du footer</Label>
                <Input value={config.footerText} onChange={e => updateConfig('footerText', e.target.value)} />
              </div>
              <div>
                <Label>URL du support</Label>
                <Input value={config.supportUrl} onChange={e => updateConfig('supportUrl', e.target.value)} placeholder="https://support.votredomaine.com" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="typography" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Typographie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Famille de police</Label>
                <Input value={config.fontFamily} onChange={e => updateConfig('fontFamily', e.target.value)} placeholder="Inter, sans-serif" />
              </div>
              <div>
                <Label>URL Google Fonts (optionnel)</Label>
                <Input value={config.customFontUrl} onChange={e => updateConfig('customFontUrl', e.target.value)} placeholder="https://fonts.googleapis.com/css2?family=..." />
              </div>
              <div>
                <Label>CSS personnalisé</Label>
                <textarea
                  className="w-full h-32 p-3 border rounded-md font-mono text-sm bg-muted/30"
                  value={config.customCss}
                  onChange={e => updateConfig('customCss', e.target.value)}
                  placeholder={`:root {\n  --custom-var: #000;\n}`}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domain" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Domaine personnalisé</CardTitle>
              <CardDescription>Utilisez votre propre domaine pour accéder à la plateforme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Domaine</Label>
                <Input value={config.customDomain} onChange={e => updateConfig('customDomain', e.target.value)} placeholder="app.votredomaine.com" />
              </div>
              <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                <p className="font-medium text-sm">Configuration DNS requise :</p>
                <div className="font-mono text-xs space-y-1">
                  <p>Type: CNAME</p>
                  <p>Nom: {config.customDomain || 'app.votredomaine.com'}</p>
                  <p>Valeur: proxy.shopopti.app</p>
                </div>
                <Badge variant="outline">En attente de vérification</Badge>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Nom d'expéditeur email</Label>
                  <Input value={config.emailFromName} onChange={e => updateConfig('emailFromName', e.target.value)} placeholder="Mon Entreprise" />
                </div>
                <div>
                  <Label>Email de réponse</Label>
                  <Input value={config.emailReplyTo} onChange={e => updateConfig('emailReplyTo', e.target.value)} placeholder="support@votredomaine.com" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Aperçu en direct</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <div className="p-4 flex items-center gap-3" style={{ backgroundColor: config.primaryColor }}>
                  {config.logoUrl ? (
                    <img src={config.logoUrl} alt="Logo" className="h-8" />
                  ) : (
                    <div className="h-8 w-8 rounded bg-white/20" />
                  )}
                  <span className="font-bold text-white" style={{ fontFamily: config.fontFamily }}>
                    {config.brandName}
                  </span>
                </div>
                <div className="p-8 text-center bg-background">
                  <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: config.fontFamily }}>
                    {config.loginPageTitle}
                  </h3>
                  <p className="text-muted-foreground mb-6">{config.loginPageSubtitle}</p>
                  <div className="max-w-sm mx-auto space-y-3">
                    <Input placeholder="Email" />
                    <Input type="password" placeholder="Mot de passe" />
                    <Button className="w-full" style={{ backgroundColor: config.primaryColor }}>
                      Se connecter
                    </Button>
                  </div>
                </div>
                {config.footerText && (
                  <div className="p-3 text-center text-xs text-muted-foreground border-t">
                    {config.footerText}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
