import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { DollarSign, TrendingUp, Users, Download, CreditCard, Target } from 'lucide-react'

export default function MonetizationPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d')

  const revenueStats = [
    { title: 'Revenus Total', value: '€12,847', change: '+23%', icon: DollarSign },
    { title: 'Revenus Mensuels', value: '€4,234', change: '+15%', icon: TrendingUp },
    { title: 'Utilisateurs Payants', value: '1,247', change: '+8%', icon: Users },
    { title: 'Taux de Conversion', value: '3.2%', change: '+0.5%', icon: Target }
  ]

  const revenueData = [
    { date: '2024-01-01', revenue: 2800, users: 890 },
    { date: '2024-01-08', revenue: 3200, users: 920 },
    { date: '2024-01-15', revenue: 4234, users: 1247 }
  ]

  const pricingPlans = [
    {
      name: 'Freemium',
      price: 'Gratuit',
      users: 8940,
      conversionRate: 12.5,
      features: ['Fonctionnalités de base', 'Support communautaire', 'Limites d\'usage']
    },
    {
      name: 'Pro',
      price: '€19/mois',
      users: 1247,
      conversionRate: 85.3,
      features: ['Toutes les fonctionnalités', 'Support prioritaire', 'API illimitée']
    },
    {
      name: 'Enterprise',
      price: '€49/mois',
      users: 156,
      conversionRate: 95.8,
      features: ['White label', 'Support dédié', 'SLA garantis']
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Monétisation
        </h1>
        <p className="text-muted-foreground mt-2">
          Analysez vos revenus et optimisez votre stratégie de monétisation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {revenueStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                  <Badge variant="default">{stat.change}</Badge>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
          <TabsTrigger value="pricing">Plans Tarifaires</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Évolution des Revenus</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingPlans.map((plan, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="text-2xl font-bold">{plan.price}</div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold">{plan.users.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">Utilisateurs</p>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{plan.conversionRate}%</div>
                      <p className="text-xs text-muted-foreground">Conversion</p>
                    </div>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex}>• {feature}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Métriques Clés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">€34.2</div>
                  <p className="text-sm text-muted-foreground">ARPU moyen</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">89%</div>
                  <p className="text-sm text-muted-foreground">Rétention</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">€156</div>
                  <p className="text-sm text-muted-foreground">LTV moyenne</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">€23</div>
                  <p className="text-sm text-muted-foreground">CAC</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}