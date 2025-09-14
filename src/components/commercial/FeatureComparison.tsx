import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, X, Crown, Zap, Star } from 'lucide-react'

const features = [
  {
    category: 'Gestion des produits',
    items: [
      { name: 'Produits', standard: '1 000', pro: '10 000', ultra: 'Illimité' },
      { name: 'Import automatique', standard: false, pro: true, ultra: true },
      { name: 'IA d\'optimisation', standard: false, pro: true, ultra: true },
      { name: 'Analyses prédictives', standard: false, pro: false, ultra: true }
    ]
  },
  {
    category: 'Fournisseurs & Intégrations',
    items: [
      { name: 'Fournisseurs connectés', standard: '5', pro: '25', ultra: 'Illimité' },
      { name: 'Intégrations premium', standard: false, pro: true, ultra: true },
      { name: 'API personnalisée', standard: false, pro: false, ultra: true },
      { name: 'Webhook avancés', standard: false, pro: false, ultra: true }
    ]
  },
  {
    category: 'Automatisation & IA',
    items: [
      { name: 'Analyses IA par mois', standard: '5', pro: '50', ultra: 'Illimité' },
      { name: 'Workflows d\'automatisation', standard: '0', pro: '10', ultra: 'Illimité' },
      { name: 'Marketing automation', standard: false, pro: false, ultra: true },
      { name: 'Optimisation prix IA', standard: false, pro: false, ultra: true }
    ]
  },
  {
    category: 'Support & Services',
    items: [
      { name: 'Support email', standard: true, pro: true, ultra: true },
      { name: 'Support prioritaire', standard: false, pro: true, ultra: true },
      { name: 'Account manager dédié', standard: false, pro: false, ultra: true },
      { name: 'Formation personnalisée', standard: false, pro: false, ultra: true }
    ]
  }
]

const planColors = {
  standard: 'border-muted-foreground/20',
  pro: 'border-primary',
  ultra: 'border-gradient-to-r from-purple-500 to-blue-500'
}

const planIcons = {
  standard: <Zap className="w-5 h-5" />,
  pro: <Crown className="w-5 h-5" />,
  ultra: <Star className="w-5 h-5" />
}

const renderFeatureValue = (value: string | boolean, planType: 'standard' | 'pro' | 'ultra') => {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="w-4 h-4 text-success mx-auto" />
    ) : (
      <X className="w-4 h-4 text-muted-foreground mx-auto" />
    )
  }
  
  if (value === 'Illimité') {
    return (
      <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
        ∞
      </Badge>
    )
  }
  
  return (
    <span className={`text-sm font-medium ${
      planType === 'ultra' ? 'text-primary' : 
      planType === 'pro' ? 'text-foreground' : 
      'text-muted-foreground'
    }`}>
      {value}
    </span>
  )
}

export function FeatureComparison() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Comparaison des fonctionnalités</h2>
        <p className="text-muted-foreground">
          Découvrez quel plan correspond le mieux à vos besoins
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Feature categories column */}
        <div className="space-y-4">
          <div className="h-24"></div> {/* Spacer for plan headers */}
          {features.map((category) => (
            <Card key={category.category} className="border-0 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">
                  {category.category}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {category.items.map((item) => (
                  <div key={item.name} className="text-sm font-medium py-2">
                    {item.name}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Standard Plan */}
        <div className="space-y-4">
          <Card className={`${planColors.standard} text-center`}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                {planIcons.standard}
                <CardTitle className="text-lg">Standard</CardTitle>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold">29€</div>
                <div className="text-sm text-muted-foreground">/mois</div>
              </div>
            </CardHeader>
          </Card>
          
          {features.map((category) => (
            <Card key={category.category} className="border-0 shadow-none">
              <CardHeader className="pb-2 opacity-0">
                <CardTitle className="text-base">{category.category}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {category.items.map((item) => (
                  <div key={item.name} className="text-center py-2">
                    {renderFeatureValue(item.standard, 'standard')}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pro Plan */}
        <div className="space-y-4">
          <Card className={`${planColors.pro} text-center relative`}>
            <Badge 
              className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground"
            >
              Populaire
            </Badge>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-center gap-2 text-primary">
                {planIcons.pro}
                <CardTitle className="text-lg">Pro</CardTitle>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold">99€</div>
                <div className="text-sm text-muted-foreground">/mois</div>
              </div>
            </CardHeader>
          </Card>
          
          {features.map((category) => (
            <Card key={category.category} className="border-0 shadow-none">
              <CardHeader className="pb-2 opacity-0">
                <CardTitle className="text-base">{category.category}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {category.items.map((item) => (
                  <div key={item.name} className="text-center py-2">
                    {renderFeatureValue(item.pro, 'pro')}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Ultra Pro Plan */}
        <div className="space-y-4">
          <Card className="border-2 border-gradient-to-r from-purple-500 to-blue-500 text-center relative">
            <Badge 
              className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-blue-600 text-white"
            >
              Entreprise
            </Badge>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-center gap-2 text-primary">
                {planIcons.ultra}
                <CardTitle className="text-lg">Ultra Pro</CardTitle>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold">299€</div>
                <div className="text-sm text-muted-foreground">/mois</div>
              </div>
            </CardHeader>
          </Card>
          
          {features.map((category) => (
            <Card key={category.category} className="border-0 shadow-none">
              <CardHeader className="pb-2 opacity-0">
                <CardTitle className="text-base">{category.category}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {category.items.map((item) => (
                  <div key={item.name} className="text-center py-2">
                    {renderFeatureValue(item.ultra, 'ultra')}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}