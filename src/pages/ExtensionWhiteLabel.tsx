import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Building2, 
  Globe, 
  Palette, 
  CreditCard,
  Users,
  Settings,
  Crown,
  Zap,
  Shield,
  BarChart3,
  Eye,
  Edit,
  Copy,
  ExternalLink,
  Check,
  Plus,
  Upload,
  Download
} from 'lucide-react'
import { Helmet } from 'react-helmet-async'

const marketplaceTemplates = [
  {
    id: 'ecommerce-pro',
    name: 'E-commerce Pro',
    description: 'Marketplace complet pour extensions e-commerce',
    preview: '/previews/ecommerce-pro.jpg',
    features: ['Paiements intégrés', 'Analytics avancés', 'Multi-devises'],
    price: 299,
    popular: true
  },
  {
    id: 'minimal-clean',
    name: 'Minimal Clean',
    description: 'Design épuré et moderne pour professionnels',
    preview: '/previews/minimal-clean.jpg',
    features: ['Design responsive', 'Thème sombre/clair', 'SEO optimisé'],
    price: 199,
    popular: false
  },
  {
    id: 'enterprise-suite',
    name: 'Enterprise Suite',
    description: 'Solution complète pour grandes entreprises',
    preview: '/previews/enterprise-suite.jpg',
    features: ['SSO intégré', 'Multi-tenant', 'API avancées'],
    price: 599,
    popular: false
  }
]

const pricingPlans = [
  {
    name: 'Starter',
    price: 99,
    period: '/mois',
    description: 'Parfait pour débuter',
    features: [
      'Marketplace personnalisé',
      'Jusqu\'à 50 extensions',
      'Support standard',
      'Analytics de base',
      'SSL inclus'
    ],
    limitations: [
      'Pas de domaine personnalisé',
      'Branding Drop Craft visible'
    ]
  },
  {
    name: 'Professional',
    price: 299,
    period: '/mois',
    description: 'Pour entreprises en croissance',
    features: [
      'Tout du plan Starter',
      'Domaine personnalisé',
      'Jusqu\'à 500 extensions',
      'Support prioritaire',
      'Analytics avancés',
      'Branding personnalisé',
      'API complète'
    ],
    popular: true
  },
  {
    name: 'Enterprise',
    price: 799,
    period: '/mois',
    description: 'Solutions sur mesure',
    features: [
      'Tout du plan Professional',
      'Extensions illimitées',
      'Support dédié 24/7',
      'SSO & SAML',
      'Déploiement privé',
      'SLA garantie',
      'Développement custom'
    ]
  }
]

export default function ExtensionWhiteLabel() {
  const [selectedPlan, setSelectedPlan] = useState('professional')
  const [customDomain, setCustomDomain] = useState('')
  const [brandingEnabled, setBrandingEnabled] = useState(true)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/50 to-background">
      <Helmet>
        <title>Marketplace White Label - Drop Craft AI</title>
        <meta name="description" content="Créez votre propre marketplace d'extensions avec notre solution white label complète." />
      </Helmet>

      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full border">
            <Building2 className="w-5 h-5 text-purple-600" />
            <span className="text-purple-600 font-medium">White Label Solution</span>
          </div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Votre Marketplace d'Extensions
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Lancez votre propre marketplace d'extensions avec notre solution white label complète. 
            Personnalisez, monétisez et développez votre écosystème d'extensions.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600">
              <Crown className="w-5 h-5 mr-2" />
              Démarrer mon Marketplace
            </Button>
            <Button size="lg" variant="outline">
              <Eye className="w-5 h-5 mr-2" />
              Voir la Démo
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="pricing">Tarification</TabsTrigger>
            <TabsTrigger value="configure">Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Key Features */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="p-3 rounded-full bg-purple-100 w-fit mx-auto mb-4">
                    <Palette className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Personnalisation Complète</h3>
                  <p className="text-sm text-muted-foreground">
                    Personnalisez entièrement l'apparence avec votre branding, couleurs et logo
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="p-3 rounded-full bg-green-100 w-fit mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Monétisation Intégrée</h3>
                  <p className="text-sm text-muted-foreground">
                    Système de paiement complet avec gestion des commissions et revenus
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="p-3 rounded-full bg-blue-100 w-fit mx-auto mb-4">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Gestion Multi-utilisateurs</h3>
                  <p className="text-sm text-muted-foreground">
                    Outils complets pour gérer développeurs, utilisateurs et permissions
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="p-3 rounded-full bg-orange-100 w-fit mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Analytics Avancés</h3>
                  <p className="text-sm text-muted-foreground">
                    Tableau de bord complet avec métriques détaillées et insights
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="p-3 rounded-full bg-red-100 w-fit mx-auto mb-4">
                    <Shield className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Sécurité Enterprise</h3>
                  <p className="text-sm text-muted-foreground">
                    SSO, SAML, audit trails et conformité aux standards de sécurité
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="p-3 rounded-full bg-indigo-100 w-fit mx-auto mb-4">
                    <Globe className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Déploiement Global</h3>
                  <p className="text-sm text-muted-foreground">
                    CDN mondial, multi-régions avec performances optimales partout
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Success Stories */}
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-8">
                <div className="text-center space-y-4">
                  <h2 className="text-2xl font-bold text-green-800">Cas de Succès</h2>
                  <div className="grid md:grid-cols-3 gap-6 mt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">500K€</div>
                      <div className="text-sm text-green-700">Revenus générés par TechCorp</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">2M+</div>
                      <div className="text-sm text-green-700">Téléchargements sur MarketHub</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">95%</div>
                      <div className="text-sm text-green-700">Satisfaction client DevStore</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Choisissez votre Template</h2>
              <p className="text-muted-foreground">
                Commencez avec un template professionnel et personnalisez selon vos besoins
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {marketplaceTemplates.map(template => (
                <Card key={template.id} className="overflow-hidden hover:shadow-xl transition-shadow">
                  {template.popular && (
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2 text-sm font-medium">
                      ⭐ Plus Populaire
                    </div>
                  )}
                  
                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <Eye className="w-12 h-12 text-gray-400" />
                  </div>
                  
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold">{template.name}</h3>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Fonctionnalités incluses:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {template.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-green-600" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4">
                        <div className="text-lg font-bold">{template.price}€</div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600">
                            Utiliser
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Tarification Transparente</h2>
              <p className="text-muted-foreground">
                Choisissez le plan qui convient à la taille de votre marketplace
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {pricingPlans.map((plan, idx) => (
                <Card 
                  key={plan.name} 
                  className={`relative overflow-hidden hover:shadow-xl transition-shadow ${
                    plan.popular ? 'ring-2 ring-purple-600' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2 text-sm font-medium">
                      🎯 Recommandé
                    </div>
                  )}
                  
                  <CardContent className={`p-6 ${plan.popular ? 'pt-12' : ''}`}>
                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="text-xl font-bold">{plan.name}</h3>
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                        <div className="mt-4">
                          <span className="text-3xl font-bold">{plan.price}€</span>
                          <span className="text-muted-foreground">{plan.period}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="font-medium text-green-700">✓ Inclus:</h4>
                        <ul className="space-y-2">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <Check className="w-4 h-4 text-green-600 mt-0.5" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        
                        {plan.limitations && (
                          <div className="space-y-2 pt-2 border-t">
                            <h4 className="font-medium text-orange-700">⚠ Limitations:</h4>
                            <ul className="space-y-1">
                              {plan.limitations.map((limitation, idx) => (
                                <li key={idx} className="text-sm text-muted-foreground">
                                  • {limitation}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        className={`w-full ${
                          plan.popular 
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600' 
                            : ''
                        }`}
                        variant={plan.popular ? 'default' : 'outline'}
                      >
                        {idx === 2 ? 'Nous Contacter' : 'Commencer Maintenant'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* FAQ Pricing */}
            <Card className="bg-muted/30">
              <CardContent className="p-8">
                <h3 className="text-lg font-semibold mb-4">Questions Fréquentes</h3>
                <div className="grid md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <h4 className="font-medium mb-2">Puis-je changer de plan ?</h4>
                    <p className="text-muted-foreground">
                      Oui, vous pouvez upgrader ou downgrader à tout moment. Les changements prennent effet immédiatement.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Y a-t-il des frais cachés ?</h4>
                    <p className="text-muted-foreground">
                      Non, nos prix sont transparents. Seules les commissions sur les ventes d'extensions s'appliquent (5-15%).
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Support technique inclus ?</h4>
                    <p className="text-muted-foreground">
                      Oui, tous les plans incluent un support technique. Le niveau varie selon le plan choisi.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Période d'essai ?</h4>
                    <p className="text-muted-foreground">
                      14 jours d'essai gratuit sur tous les plans, sans engagement ni carte de crédit requise.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="configure" className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Configuration de votre Marketplace</h2>
              <p className="text-muted-foreground">
                Personnalisez votre marketplace selon vos besoins
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Configuration Form */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Configuration Générale
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Nom du Marketplace</label>
                      <Input placeholder="Mon Marketplace Extensions" />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Domaine Personnalisé</label>
                      <Input 
                        placeholder="marketplace.monsite.com"
                        value={customDomain}
                        onChange={(e) => setCustomDomain(e.target.value)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Branding Personnalisé</label>
                        <p className="text-xs text-muted-foreground">
                          Masquer les mentions Drop Craft AI
                        </p>
                      </div>
                      <Switch 
                        checked={brandingEnabled}
                        onCheckedChange={setBrandingEnabled}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      Personnalisation Visuelle
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Logo Principal</label>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                          <Upload className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <Button variant="outline" size="sm">
                          <Upload className="w-4 h-4 mr-2" />
                          Choisir un fichier
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Couleur Principale</label>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-purple-600"></div>
                          <Input value="#6b46c1" className="font-mono text-sm" />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Couleur Secondaire</label>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-pink-600"></div>
                          <Input value="#db2777" className="font-mono text-sm" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Monétisation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Taux de Commission (%)</label>
                      <Input type="number" placeholder="15" min="5" max="30" />
                      <p className="text-xs text-muted-foreground mt-1">
                        Pourcentage prélevé sur chaque vente (5-30%)
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Devise Principale</label>
                      <Input placeholder="EUR - Euro" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Preview */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Aperçu en Temps Réel
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg p-4 bg-white">
                      <div className="space-y-4">
                        {/* Header Preview */}
                        <div className="flex items-center justify-between pb-3 border-b">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded bg-purple-600 flex items-center justify-center">
                              <Building2 className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-semibold">
                              {customDomain || 'Mon Marketplace'}
                            </span>
                          </div>
                          <Badge className="bg-purple-100 text-purple-800">
                            Extensions
                          </Badge>
                        </div>
                        
                        {/* Content Preview */}
                        <div className="space-y-3">
                          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          
                          <div className="grid grid-cols-2 gap-2 mt-4">
                            <div className="p-3 border rounded">
                              <div className="h-2 bg-purple-200 rounded mb-2"></div>
                              <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                            </div>
                            <div className="p-3 border rounded">
                              <div className="h-2 bg-purple-200 rounded mb-2"></div>
                              <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Footer Preview */}
                        {!brandingEnabled && (
                          <div className="pt-3 border-t text-xs text-gray-500 text-center">
                            Powered by Drop Craft AI
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-3">
                  <Button className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600">
                    <Check className="w-4 h-4 mr-2" />
                    Créer le Marketplace
                  </Button>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Exporter Config
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}