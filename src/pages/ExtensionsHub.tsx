import React from 'react'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'
import { useLegacyPlan } from '@/lib/migration-helper'
import { 
  Zap, 
  Code, 
  Store, 
  Shield, 
  Palette, 
  Terminal,
  Users,
  ArrowRight,
  Sparkles,
  Building,
  Crown,
  Lock
} from 'lucide-react'

export default function ExtensionsHub() {
  const navigate = useNavigate()
  const { plan, isPro, isUltraPro } = useLegacyPlan();

  const extensionFeatures = [
    {
      icon: <Store className="h-6 w-6" />,
      title: 'Marketplace Public',
      description: 'Découvrez et installez des extensions créées par la communauté',
      route: '/extensions/marketplace',
      badge: 'Gratuit',
      color: 'bg-blue-500/10 text-blue-600 border-blue-200',
      planRequired: null
    },
    {
      icon: <Code className="h-6 w-6" />,
      title: 'Developer Dashboard',
      description: 'Créez, publiez et gérez vos propres extensions',
      route: '/extensions/developer',
      badge: 'Dev',
      color: 'bg-green-500/10 text-green-600 border-green-200',
      planRequired: null
    },
    {
      icon: <Terminal className="h-6 w-6" />,
      title: 'CLI Developer Tools',
      description: 'Outils de développement en ligne de commande pour les extensions',
      route: '/extensions/cli',
      badge: 'Pro',
      color: 'bg-purple-500/10 text-purple-600 border-purple-200',
      planRequired: 'pro'
    },
    {
      icon: <Palette className="h-6 w-6" />,
      title: 'White-Label Marketplace',
      description: 'Créez votre propre marketplace d\'extensions avec votre marque',
      route: '/extensions/white-label',
      badge: 'Ultra Pro',
      color: 'bg-orange-500/10 text-orange-600 border-orange-200',
      planRequired: 'ultra_pro'
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Enterprise SSO',
      description: 'Authentification centralisée pour les équipes entreprise',
      route: '/extensions/sso',
      badge: 'Ultra Pro',
      color: 'bg-red-500/10 text-red-600 border-red-200',
      planRequired: 'ultra_pro'
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Extensions IA',
      description: 'Extensions intégrées dans le processus d\'import',
      route: '/import',
      badge: 'IA',
      color: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
      planRequired: null
    }
  ]

  const canAccess = (planRequired?: string | null) => {
    if (!planRequired) return true
    if (planRequired === 'pro') return isPro
    if (planRequired === 'ultra_pro') return isUltraPro
    return true
  }

  const getPlanIcon = (planRequired?: string | null) => {
    if (planRequired === 'ultra_pro') return <Crown className="h-4 w-4 text-yellow-500 ml-1" />
    if (planRequired === 'pro') return <Zap className="h-4 w-4 text-blue-500 ml-1" />
    return null
  }

  const stats = [
    { label: 'Extensions Disponibles', value: '247+', icon: <Store className="h-5 w-5" /> },
    { label: 'Développeurs Actifs', value: '1,250+', icon: <Users className="h-5 w-5" /> },
    { label: 'Installations', value: '25,000+', icon: <Zap className="h-5 w-5" /> },
    { label: 'Marketplace Privés', value: '180+', icon: <Building className="h-5 w-5" /> }
  ]

  return (
    <>
      <Helmet>
        <title>Extensions Hub - Plateforme d'Extensions E-commerce</title>
        <meta name="description" content="Hub central pour découvrir, développer et gérer des extensions e-commerce. Marketplace public, outils de développement, et solutions entreprise." />
        <meta name="keywords" content="extensions, marketplace, développement, e-commerce, plugins, intégrations" />
      </Helmet>

      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Extensions Hub
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Découvrez, développez et déployez des extensions puissantes pour votre plateforme e-commerce
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center mb-2 text-primary">
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {extensionFeatures.map((feature, index) => {
            const hasAccess = canAccess(feature.planRequired)
            
            return (
              <Card 
                key={index} 
                className={`group transition-all duration-300 border-border/50 ${
                  hasAccess ? 'cursor-pointer hover:shadow-lg hover:border-primary/20' : 'opacity-75'
                }`}
                onClick={() => hasAccess && navigate(feature.route)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-lg ${feature.color} transition-transform ${hasAccess ? 'group-hover:scale-110' : ''}`}>
                      {feature.icon}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={feature.planRequired ? 'secondary' : 'default'}
                        className={
                          feature.badge === 'Ultra Pro' ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' :
                          feature.badge === 'Pro' ? 'bg-blue-500 text-white' :
                          'text-xs'
                        }
                      >
                        {feature.badge}
                      </Badge>
                      {!hasAccess && <Lock className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                  <CardTitle className={`text-xl transition-colors flex items-center ${hasAccess ? 'group-hover:text-primary' : ''}`}>
                    {feature.title}
                    {getPlanIcon(feature.planRequired)}
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {hasAccess ? (
                    <Button 
                      variant="ghost" 
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                    >
                      Accéder
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Button disabled className="w-full">
                        Accès restreint
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate('/subscription')
                        }}
                      >
                        Voir les plans {feature.planRequired === 'ultra_pro' ? 'Ultra Pro' : 'Pro'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Quick Actions */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-semibold">Prêt à commencer ?</h3>
              <p className="text-muted-foreground">
                Explorez notre marketplace ou créez votre première extension dès maintenant
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => navigate('/extensions/marketplace')} className="flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  Explorer le Marketplace
                </Button>
                <Button variant="outline" onClick={() => navigate('/extensions/developer')} className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Devenir Développeur
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}