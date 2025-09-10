import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Star, Check, X, Zap, Shield, Clock, Download } from 'lucide-react'

export default function ComparePage() {
  const [selectedExtensions, setSelectedExtensions] = useState(['ext1', 'ext2'])

  const extensions = [
    {
      id: 'ext1',
      name: 'Data Scraper Pro',
      price: '€19/mois',
      rating: 4.8,
      downloads: 12500,
      features: {
        'Scraping automatique': true,
        'API intégration': true,
        'Export CSV': true,
        'Scheduling': true,
        'Multi-sites': true,
        'Support 24/7': true,
        'Analytics avancées': true,
        'White label': false
      },
      pros: ['Interface intuitive', 'Excellent support', 'Très performant'],
      cons: ['Prix élevé', 'Courbe d\'apprentissage']
    },
    {
      id: 'ext2',
      name: 'Review Importer',
      price: '€12/mois',
      rating: 4.6,
      downloads: 8900,
      features: {
        'Scraping automatique': true,
        'API intégration': true,
        'Export CSV': true,
        'Scheduling': false,
        'Multi-sites': true,
        'Support 24/7': false,
        'Analytics avancées': false,
        'White label': false
      },
      pros: ['Bon rapport qualité-prix', 'Simple à utiliser'],
      cons: ['Fonctionnalités limitées', 'Pas de support prioritaire']
    },
    {
      id: 'ext3',
      name: 'Price Monitor',
      price: 'Gratuit',
      rating: 4.3,
      downloads: 15600,
      features: {
        'Scraping automatique': false,
        'API intégration': false,
        'Export CSV': true,
        'Scheduling': false,
        'Multi-sites': false,
        'Support 24/7': false,
        'Analytics avancées': false,
        'White label': false
      },
      pros: ['Gratuit', 'Léger', 'Open source'],
      cons: ['Fonctionnalités basiques', 'Pas de support']
    }
  ]

  const comparisonData = {
    performance: [
      { metric: 'Vitesse de scraping', ext1: 95, ext2: 78, ext3: 65 },
      { metric: 'Utilisation mémoire', ext1: 85, ext2: 72, ext3: 90 },
      { metric: 'Fiabilité', ext1: 92, ext2: 88, ext3: 75 }
    ],
    security: [
      { feature: 'Chiffrement des données', ext1: true, ext2: true, ext3: false },
      { feature: 'Conformité GDPR', ext1: true, ext2: true, ext3: false },
      { feature: 'Authentification 2FA', ext1: true, ext2: false, ext3: false }
    ]
  }

  const renderFeatureValue = (value: boolean | string | number) => {
    if (typeof value === 'boolean') {
      return value ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-500" />
    }
    return value
  }

  const renderStars = (rating: number) => (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
      ))}
      <span className="ml-1 text-sm">{rating}</span>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Comparateur d'Extensions
        </h1>
        <p className="text-muted-foreground mt-2">
          Comparez les fonctionnalités et performances des extensions
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="features">Fonctionnalités</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="pricing">Tarifs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {extensions.map((ext) => (
              <Card key={ext.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{ext.name}</CardTitle>
                    <Badge variant="outline">{ext.price}</Badge>
                  </div>
                  <div className="space-y-2">
                    {renderStars(ext.rating)}
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Download className="w-4 h-4" />
                      <span>{ext.downloads.toLocaleString()} téléchargements</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2 text-green-600">Points forts</h4>
                    <ul className="space-y-1">
                      {ext.pros.map((pro, index) => (
                        <li key={index} className="text-sm flex items-start">
                          <Check className="w-3 h-3 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-2 text-orange-600">Limitations</h4>
                    <ul className="space-y-1">
                      {ext.cons.map((con, index) => (
                        <li key={index} className="text-sm flex items-start">
                          <X className="w-3 h-3 text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button className="w-full">Choisir cette extension</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comparaison des Fonctionnalités</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Fonctionnalité</th>
                      {extensions.map((ext) => (
                        <th key={ext.id} className="text-center p-2 min-w-32">{ext.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(extensions[0].features).map((feature) => (
                      <tr key={feature} className="border-b">
                        <td className="p-2 font-medium">{feature}</td>
                        {extensions.map((ext) => (
                          <td key={ext.id} className="text-center p-2">
                            {renderFeatureValue(ext.features[feature as keyof typeof ext.features])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Métriques de Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {comparisonData.performance.map((perf, index) => (
                  <div key={index}>
                    <h4 className="font-semibold mb-3">{perf.metric}</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{perf.ext1}%</div>
                        <p className="text-sm text-muted-foreground">Data Scraper Pro</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{perf.ext2}%</div>
                        <p className="text-sm text-muted-foreground">Review Importer</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{perf.ext3}%</div>
                        <p className="text-sm text-muted-foreground">Price Monitor</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {extensions.map((ext) => (
              <Card key={ext.id} className="text-center">
                <CardHeader>
                  <CardTitle>{ext.name}</CardTitle>
                  <div className="text-3xl font-bold">{ext.price}</div>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    {ext.price === 'Gratuit' ? 'Télécharger' : 'S\'abonner'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}