/**
 * PHASE 4: Extension Card Component
 * Carte d'extension réutilisable pour le marketplace
 */

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, Download, Shield, ExternalLink } from 'lucide-react'

interface ExtensionCardProps {
  extension: {
    id: string
    name: string
    description: string
    category: string
    downloads: string
    rating: number
    price: string
    verified: boolean
    developer: string
    version: string
    lastUpdated: string
  }
  onInstall?: (extensionId: string) => void
  onViewDetails?: (extensionId: string) => void
}

export const ExtensionCard: React.FC<ExtensionCardProps> = ({
  extension,
  onInstall,
  onViewDetails
}) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            {extension.verified && (
              <Shield className="h-4 w-4 text-green-500" />
            )}
          </div>
          <Badge variant="outline">{extension.category}</Badge>
        </div>
        <CardTitle className="text-lg">{extension.name}</CardTitle>
        <CardDescription>{extension.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Par {extension.developer}</span>
            <span>v{extension.version}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-current text-yellow-500" />
              <span>{extension.rating}</span>
            </div>
            <div className="flex items-center gap-1">
              <Download className="h-4 w-4 text-muted-foreground" />
              <span>{extension.downloads}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold text-primary">
              {extension.price}
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onViewDetails?.(extension.id)}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Détails
              </Button>
              <Button 
                size="sm"
                onClick={() => onInstall?.(extension.id)}
              >
                <Download className="h-4 w-4 mr-2" />
                Installer
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}