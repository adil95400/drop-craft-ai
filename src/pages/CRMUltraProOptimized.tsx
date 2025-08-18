import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UpgradeButton } from '@/components/common/UpgradeButton'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProductionCRMInterface } from '@/components/crm/ProductionCRMInterface'
import { Bot, Sparkles, Crown, Zap, Target, TrendingUp, BarChart3, Users, Mail, Phone } from 'lucide-react'

const CRMUltraProOptimized = () => {
  const ultraProFeatures = [
    {
      icon: Bot,
      title: "IA Comportementale",
      description: "Analyse comportementale avancée des clients avec IA"
    },
    {
      icon: Zap,
      title: "Automation Marketing",
      description: "Campagnes automatisées basées sur le comportement client"
    },
    {
      icon: Target,
      title: "Scoring Prédictif",
      description: "Score de conversion et de fidélité basé sur l'IA"
    },
    {
      icon: TrendingUp,
      title: "Analytics 360°",
      description: "Vue complète du parcours client avec métriques avancées"
    },
    {
      icon: Mail,
      title: "Engagement Intelligent",
      description: "Communication personnalisée et optimisée par IA"
    },
    {
      icon: Phone,
      title: "Support Prédictif",
      description: "Anticipation des besoins et support proactif"
    }
  ]

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header avec Upgrade */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Crown className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            CRM Ultra Pro
          </h1>
          <Sparkles className="w-8 h-8 text-blue-600" />
        </div>
        <p className="text-muted-foreground mb-6">
          CRM intelligent avec IA comportementale et automation marketing avancée
        </p>
        <UpgradeButton feature="crm-ultra-pro" size="lg" />
      </div>

      {/* Fonctionnalités Ultra Pro */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-purple-600" />
            Fonctionnalités Ultra Pro
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">Exclusives</Badge>
          </CardTitle>
          <CardDescription>
            Transformez vos relations clients avec l'intelligence artificielle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ultraProFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-white/50 border border-purple-100">
                <feature.icon className="w-6 h-6 text-purple-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Interface d'aperçu avec message d'upgrade */}
      <Tabs defaultValue="crm" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="crm">CRM IA</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="predictions">Prédictions</TabsTrigger>
        </TabsList>

        <TabsContent value="crm">
          <Card>
            <CardHeader>
              <CardTitle>Interface CRM Ultra Pro</CardTitle>
              <CardDescription>
                CRM intelligent avec IA comportementale et insights prédictifs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="blur-sm pointer-events-none">
                  <ProductionCRMInterface />
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                  <div className="text-center space-y-4">
                    <Crown className="w-12 h-12 text-purple-600 mx-auto" />
                    <h3 className="text-xl font-semibold">CRM IA Avancé</h3>
                    <p className="text-muted-foreground max-w-md">
                      Interface intelligente avec analyse comportementale et prédictions
                    </p>
                    <UpgradeButton feature="crm-ia" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics CRM</CardTitle>
              <CardDescription>
                Analytics 360° du parcours client avec insights IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="p-6 rounded-lg border border-purple-200 bg-purple-50">
                    <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Parcours Client</h3>
                    <p className="text-sm text-muted-foreground">
                      Analyse complète du comportement client
                    </p>
                  </div>
                  <div className="p-6 rounded-lg border border-blue-200 bg-blue-50">
                    <Target className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Scoring Prédictif</h3>
                    <p className="text-sm text-muted-foreground">
                      Score de conversion et fidélité IA
                    </p>
                  </div>
                  <div className="p-6 rounded-lg border border-green-200 bg-green-50">
                    <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">LTV Prédictive</h3>
                    <p className="text-sm text-muted-foreground">
                      Valeur vie client prédite par IA
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <BarChart3 className="w-12 h-12 text-purple-600 mx-auto" />
                  <h3 className="text-xl font-semibold">Analytics Ultra Pro</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Insights clients les plus avancés du marché
                  </p>
                  <UpgradeButton feature="crm-analytics" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation">
          <Card>
            <CardHeader>
              <CardTitle>Automation Marketing</CardTitle>
              <CardDescription>
                Campagnes automatisées intelligentes basées sur le comportement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="p-6 rounded-lg border border-purple-200 bg-purple-50">
                    <Zap className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Campagnes IA</h3>
                    <p className="text-sm text-muted-foreground">
                      Automation marketing basée sur le comportement
                    </p>
                  </div>
                  <div className="p-6 rounded-lg border border-blue-200 bg-blue-50">
                    <Mail className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Personnalisation</h3>
                    <p className="text-sm text-muted-foreground">
                      Messages personnalisés et timing optimal
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Zap className="w-12 h-12 text-purple-600 mx-auto" />
                  <h3 className="text-xl font-semibold">Automation Ultra Pro</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Automatisez votre marketing avec l'IA comportementale
                  </p>
                  <UpgradeButton feature="crm-automation" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions">
          <Card>
            <CardHeader>
              <CardTitle>Prédictions Client</CardTitle>
              <CardDescription>
                Intelligence prédictive pour anticiper les besoins clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="p-6 rounded-lg border border-purple-200 bg-purple-50">
                    <Bot className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Prédiction Churn</h3>
                    <p className="text-sm text-muted-foreground">
                      Anticipation du risque de perte client
                    </p>
                  </div>
                  <div className="p-6 rounded-lg border border-green-200 bg-green-50">
                    <Target className="w-8 h-8 text-green-600 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Opportunités</h3>
                    <p className="text-sm text-muted-foreground">
                      Identification d'opportunités de vente
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Bot className="w-12 h-12 text-purple-600 mx-auto" />
                  <h3 className="text-xl font-semibold">Prédictions Ultra Pro</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Anticipez les besoins clients avec notre IA prédictive
                  </p>
                  <UpgradeButton feature="crm-predictions" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default CRMUltraProOptimized