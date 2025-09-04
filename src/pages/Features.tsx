import React from 'react'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'
import { Bot, TrendingUp, Zap, BarChart3, Shield, Globe, ArrowRight, Sparkles, CheckCircle } from 'lucide-react'

const Features = () => {
  const features = [
    {
      icon: <Bot className="w-8 h-8" />,
      title: "IA Avancée",
      description: "Intelligence artificielle pour optimiser automatiquement vos produits",
      details: ["Analyse prédictive", "SEO automatique", "Scoring de vente"],
      color: "bg-gradient-to-r from-purple-500 to-pink-600"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Produits Gagnants",
      description: "Découvrez les tendances avec notre algorithme exclusif",
      details: ["10M+ produits analysés", "Prédictions temps réel", "Score de performance"],
      color: "bg-gradient-to-r from-green-500 to-emerald-600"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Import Ultra-Rapide",
      description: "Importez depuis 50+ fournisseurs en 1 clic",
      details: ["API automatisées", "Sync temps réel", "Mapping intelligent"],
      color: "bg-gradient-to-r from-blue-500 to-cyan-600"
    }
  ]

  return (
    <>
      <Helmet>
        <title>Fonctionnalités - ShopOpti | Plateforme E-commerce IA</title>
        <meta name="description" content="Découvrez les fonctionnalités de ShopOpti : IA avancée, produits gagnants, import rapide, analytics temps réel." />
      </Helmet>

      <div className="min-h-screen bg-background py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-6">Fonctionnalités Avancées</h1>
            <p className="text-xl text-muted-foreground">Des outils puissants pour votre réussite</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-all">
                <CardHeader>
                  <div className={`w-16 h-16 rounded-xl ${feature.color} flex items-center justify-center text-white mb-4`}>
                    {feature.icon}
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.details.map((detail, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-16">
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600">
                Commencer Gratuitement
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default Features