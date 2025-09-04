import React from 'react'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'
import { CheckCircle, ArrowRight, Crown } from 'lucide-react'

const Pricing = () => {
  const plans = [
    {
      name: "Starter",
      price: "29€",
      description: "Parfait pour débuter",
      features: ["100 produits/mois", "Support email", "Intégrations de base"],
      buttonText: "Commencer"
    },
    {
      name: "Pro", 
      price: "79€",
      description: "Pour les pros",
      features: ["Produits illimités", "IA avancée", "Support prioritaire", "Toutes intégrations"],
      buttonText: "Choisir Pro",
      featured: true
    },
    {
      name: "Ultra Pro",
      price: "199€", 
      description: "Solution enterprise",
      features: ["Tout Pro +", "IA personnalisée", "Account manager", "API complète"],
      buttonText: "Contactez-nous"
    }
  ]

  return (
    <>
      <Helmet>
        <title>Tarifs - ShopOpti | Plans et Pricing</title>
        <meta name="description" content="Plans tarifaires ShopOpti : Starter 29€, Pro 79€, Ultra Pro 199€. 14 jours d'essai gratuit." />
      </Helmet>

      <div className="min-h-screen bg-background py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-6">Choisissez votre plan</h1>
            <p className="text-xl text-muted-foreground">14 jours d'essai gratuit inclus</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.featured ? 'border-primary shadow-lg scale-105' : ''}`}>
                {plan.featured && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary">
                      <Crown className="w-4 h-4 mr-1" />
                      RECOMMANDÉ
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <p className="text-muted-foreground">{plan.description}</p>
                  <div className="text-4xl font-bold mt-4">{plan.price}<span className="text-lg">/mois</span></div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
                  
                  <Link to="/auth">
                    <Button 
                      className={`w-full mt-8 ${plan.featured ? 'bg-gradient-to-r from-blue-600 to-purple-600' : ''}`}
                      variant={plan.featured ? 'default' : 'outline'}
                    >
                      {plan.buttonText}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default Pricing