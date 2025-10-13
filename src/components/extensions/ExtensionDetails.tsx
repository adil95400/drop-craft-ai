/**
 * Composant de vue détaillée d'une extension
 * Affiche toutes les informations, screenshots, reviews
 */

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Star, Download, Shield, ExternalLink, 
  Clock, Users, Package, CheckCircle2
} from 'lucide-react'
import type { Extension } from '@/types/extensions'
import { ProductImporterConfig } from './ProductImporterConfig'
import { ReviewImporterConfig } from './ReviewImporterConfig'

interface ExtensionDetailsProps {
  extension: Extension
  onInstall?: (extensionId: string) => void
  onBack?: () => void
  isInstalled?: boolean
}

export const ExtensionDetails: React.FC<ExtensionDetailsProps> = ({
  extension,
  onInstall,
  onBack,
  isInstalled = false
}) => {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="space-y-6">
      {/* Header avec retour */}
      {onBack && (
        <Button variant="ghost" onClick={onBack}>
          ← Retour au marketplace
        </Button>
      )}

      {/* En-tête de l'extension */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
              <Package className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{extension.name}</h1>
                {extension.verified && (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Vérifié
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">{extension.description}</p>
              <div className="flex items-center gap-4 mt-3 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  <span className="font-medium">{extension.rating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Download className="w-4 h-4" />
                  <span>{extension.downloads} téléchargements</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Mis à jour le {extension.lastUpdated}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar d'installation */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <div className="text-3xl font-bold">{extension.price}</div>
              {extension.minPlan && extension.minPlan !== 'free' && (
                <Badge variant="outline">Requiert {extension.minPlan}</Badge>
              )}
            </div>

            {isInstalled ? (
              <Button className="w-full" variant="secondary" disabled>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Installé
              </Button>
            ) : (
              <Button 
                className="w-full" 
                onClick={() => onInstall?.(extension.id)}
              >
                <Download className="w-4 h-4 mr-2" />
                Installer
              </Button>
            )}

            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Développeur</span>
                <span className="font-medium">{extension.developer}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Version</span>
                <span className="font-medium">{extension.version}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Catégorie</span>
                <Badge variant="outline">{extension.category}</Badge>
              </div>
            </div>

            {extension.supportUrl && (
              <Button variant="outline" className="w-full" asChild>
                <a href={extension.supportUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Support
                </a>
              </Button>
            )}

            {extension.documentationUrl && (
              <Button variant="outline" className="w-full" asChild>
                <a href={extension.documentationUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Documentation
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Contenu à onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="features">Fonctionnalités</TabsTrigger>
          <TabsTrigger value="reviews">Avis</TabsTrigger>
          <TabsTrigger value="changelog">Changelog</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>{extension.description}</p>
            </CardContent>
          </Card>

          {/* Configuration pour les extensions spécifiques */}
          {extension.id === 'ext-product-importer' && <ProductImporterConfig />}
          {extension.id === 'ext-review-importer' && <ReviewImporterConfig />}

          {extension.screenshots && extension.screenshots.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Captures d'écran</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {extension.screenshots.map((screenshot, index) => (
                    <div key={index} className="rounded-lg overflow-hidden border">
                      <img 
                        src={screenshot} 
                        alt={`Screenshot ${index + 1}`}
                        className="w-full h-auto"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Fonctionnalités principales</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {[
                  'Synchronisation automatique bidirectionnelle',
                  'Gestion avancée des webhooks',
                  'Mapping personnalisable des champs',
                  'Support des variants et options produits',
                  'Logs détaillés et monitoring'
                ].map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {extension.permissions && extension.permissions.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Permissions requises
                </CardTitle>
                <CardDescription>
                  Cette extension nécessite les permissions suivantes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {extension.permissions.map((permission, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      {permission}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle>Avis des utilisateurs</CardTitle>
              <CardDescription>
                Note moyenne : {extension.rating}/5 basée sur 147 avis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  rating: 5,
                  author: "Marie D.",
                  date: "Il y a 2 jours",
                  comment: "Excellent outil, mes ventes ont augmenté de 30% !"
                },
                {
                  rating: 4,
                  author: "Jean M.",
                  date: "Il y a 5 jours",
                  comment: "Très utile mais interface perfectible"
                },
                {
                  rating: 5,
                  author: "Sophie L.",
                  date: "Il y a 1 semaine",
                  comment: "Indispensable pour gérer plusieurs boutiques"
                }
              ].map((review, index) => (
                <div key={index} className="border-b pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating 
                                ? 'fill-yellow-500 text-yellow-500' 
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-medium">{review.author}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{review.date}</span>
                  </div>
                  <p className="text-sm">{review.comment}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="changelog">
          <Card>
            <CardHeader>
              <CardTitle>Historique des versions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  version: extension.version,
                  date: extension.lastUpdated,
                  changes: [
                    'Amélioration des performances de synchronisation',
                    'Correction de bugs mineurs',
                    'Ajout du support pour les variants complexes'
                  ]
                },
                {
                  version: '2.1.3',
                  date: '2024-01-01',
                  changes: [
                    'Nouvelle interface de configuration',
                    'Support des webhooks Shopify v2'
                  ]
                }
              ].map((release, index) => (
                <div key={index} className="border-l-2 border-primary pl-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline">v{release.version}</Badge>
                    <span className="text-sm text-muted-foreground">{release.date}</span>
                  </div>
                  <ul className="space-y-1">
                    {release.changes.map((change, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
