/**
 * PlatformOnboardingPage — Multi-platform wizard (Shopify, WooCommerce, Prestashop)
 */
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Helmet } from 'react-helmet-async'
import {
  Store, ArrowRight, ArrowLeft, CheckCircle2, Globe,
  Settings, Zap, Shield, Loader2, ExternalLink
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const PLATFORMS = [
  { id: 'shopify', name: 'Shopify', icon: '🟢', color: 'border-emerald-500', desc: 'La plateforme e-commerce leader', fields: ['shop_domain', 'api_key'] },
  { id: 'woocommerce', name: 'WooCommerce', icon: '🟣', color: 'border-purple-500', desc: 'WordPress + WooCommerce', fields: ['site_url', 'consumer_key', 'consumer_secret'] },
  { id: 'prestashop', name: 'PrestaShop', icon: '🔵', color: 'border-blue-500', desc: 'Solution open-source française', fields: ['site_url', 'api_key'] },
]

const STEPS = [
  { title: 'Plateforme', desc: 'Choisissez votre boutique' },
  { title: 'Connexion', desc: 'Configurez les accès' },
  { title: 'Synchronisation', desc: 'Importez vos données' },
  { title: 'Terminé', desc: 'Prêt à optimiser' },
]

const FIELD_LABELS: Record<string, string> = {
  shop_domain: 'Domaine Shopify (ex: ma-boutique.myshopify.com)',
  api_key: 'Clé API',
  site_url: 'URL du site (ex: https://ma-boutique.com)',
  consumer_key: 'Consumer Key',
  consumer_secret: 'Consumer Secret',
}

export default function PlatformOnboardingPage() {
  const [step, setStep] = useState(0)
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [connecting, setConnecting] = useState(false)
  const { toast } = useToast()

  const platform = PLATFORMS.find(p => p.id === selectedPlatform)

  const handleConnect = async () => {
    if (!platform) return
    setConnecting(true)
    // Simulate connection
    await new Promise(r => setTimeout(r, 2000))
    setConnecting(false)
    setStep(2)
    toast({ title: `${platform.name} connecté !`, description: 'Synchronisation des données en cours...' })
    // Simulate sync
    await new Promise(r => setTimeout(r, 1500))
    setStep(3)
  }

  return (
    <>
      <Helmet>
        <title>Connexion Boutique — Onboarding | ShopOpti</title>
        <meta name="description" content="Connectez votre Shopify, WooCommerce ou PrestaShop en quelques clics." />
      </Helmet>

      <ChannablePageWrapper
        title="Connecter votre Boutique"
        description="Wizard de configuration multi-plateformes"
        heroImage="integrations"
        badge={{ label: 'Onboarding', icon: Store }}
      >
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
                i < step ? 'bg-primary text-primary-foreground border-primary' :
                i === step ? 'border-primary text-primary' : 'border-muted text-muted-foreground'
              )}>
                {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <div className="hidden sm:block">
                <p className={cn('text-xs font-medium', i === step ? 'text-primary' : 'text-muted-foreground')}>{s.title}</p>
              </div>
              {i < STEPS.length - 1 && <div className={cn('w-8 h-0.5', i < step ? 'bg-primary' : 'bg-muted')} />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        {step === 0 && (
          <div className="grid gap-4 md:grid-cols-3 max-w-3xl mx-auto">
            {PLATFORMS.map(p => (
              <Card
                key={p.id}
                className={cn(
                  'cursor-pointer hover:shadow-lg transition-all border-2',
                  selectedPlatform === p.id ? p.color : 'border-transparent hover:border-muted-foreground/20'
                )}
                onClick={() => setSelectedPlatform(p.id)}
              >
                <CardContent className="p-6 text-center">
                  <span className="text-4xl block mb-3">{p.icon}</span>
                  <h3 className="font-bold text-lg mb-1">{p.name}</h3>
                  <p className="text-sm text-muted-foreground">{p.desc}</p>
                  {selectedPlatform === p.id && (
                    <Badge className="mt-3">Sélectionné</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
            <div className="md:col-span-3 flex justify-center mt-4">
              <Button size="lg" disabled={!selectedPlatform} onClick={() => setStep(1)}>
                Continuer <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 1 && platform && (
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">{platform.icon}</span>
                Connexion {platform.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {platform.fields.map(field => (
                <div key={field} className="space-y-2">
                  <Label htmlFor={field}>{FIELD_LABELS[field] || field}</Label>
                  <Input
                    id={field}
                    type={field.includes('secret') || field.includes('key') ? 'password' : 'text'}
                    value={formData[field] || ''}
                    onChange={e => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
                    placeholder={FIELD_LABELS[field]}
                  />
                </div>
              ))}

              <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
                <p className="font-medium flex items-center gap-1"><Shield className="h-3 w-3" /> Sécurité</p>
                <p className="text-muted-foreground">Vos identifiants sont chiffrés et stockés de manière sécurisée. Nous ne stockons jamais vos mots de passe en clair.</p>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(0)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />Retour
                </Button>
                <Button onClick={handleConnect} disabled={connecting || platform.fields.some(f => !formData[f])}>
                  {connecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                  {connecting ? 'Connexion...' : 'Connecter'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="max-w-lg mx-auto">
            <CardContent className="py-16 text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
              <h3 className="font-bold text-lg mb-2">Synchronisation en cours...</h3>
              <p className="text-sm text-muted-foreground">Import de vos produits, commandes et clients</p>
            </CardContent>
          </Card>
        )}

        {step === 3 && platform && (
          <Card className="max-w-lg mx-auto border-emerald-200">
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="h-16 w-16 mx-auto text-emerald-500 mb-4" />
              <h3 className="font-bold text-xl mb-2">🎉 {platform.name} connecté !</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Votre boutique est synchronisée. Vos produits sont prêts à être optimisés.
              </p>
              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={() => { setStep(0); setSelectedPlatform(null); setFormData({}); }}>
                  Ajouter une autre boutique
                </Button>
                <Button onClick={() => window.location.href = '/products'}>
                  Voir mes produits <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </ChannablePageWrapper>
    </>
  )
}
