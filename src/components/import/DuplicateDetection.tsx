import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from '@/hooks/use-toast'
import { Search, AlertTriangle, Merge, Trash2, Eye } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { logError } from '@/utils/consoleCleanup'

interface DuplicateGroup {
  id: string
  similarity: number
  products: Array<{
    id: string
    name: string
    sku: string
    price: number
    imageUrl: string
    source: string
    createdAt: string
  }>
  suggestedAction: 'merge' | 'keep_best' | 'manual_review'
}

interface DuplicateDetectionProps {
  onDuplicatesResolved: (resolvedCount: number) => void
}

export function DuplicateDetection({ onDuplicatesResolved }: DuplicateDetectionProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([])
  const [selectedAction, setSelectedAction] = useState<Record<string, string>>({})

  const scanForDuplicates = async () => {
    setIsScanning(true)
    setProgress(0)
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 300)

      const { data, error } = await supabase.functions.invoke('detect-duplicates', {
        body: {
          algorithms: ['name_similarity', 'image_hash', 'sku_pattern'],
          threshold: 0.8,
          includeVariants: true
        }
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (error) throw error

      setDuplicateGroups(data.duplicateGroups)
      
      toast({
        title: "Scan terminé",
        description: `${data.duplicateGroups.length} groupes de doublons détectés`
      })

    } catch (error) {
      logError(error as Error, 'Duplicate detection scan');
      toast({
        title: "Erreur de scan",
        description: "Impossible de détecter les doublons",
        variant: "destructive"
      })
    } finally {
      setIsScanning(false)
      setProgress(0)
    }
  }

  const resolveDuplicate = async (groupId: string, action: string) => {
    try {
      const { error } = await supabase.functions.invoke('resolve-duplicate', {
        body: { groupId, action }
      })

      if (error) throw error

      setDuplicateGroups(prev => prev.filter(group => group.id !== groupId))
      onDuplicatesResolved(1)

      toast({
        title: "Doublon résolu",
        description: "Action appliquée avec succès"
      })

    } catch (error) {
      toast({
        title: "Erreur de résolution",
        description: "Impossible de résoudre le doublon",
        variant: "destructive"
      })
    }
  }

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.95) return 'destructive'
    if (similarity >= 0.85) return 'default'
    return 'secondary'
  }

  return (
    <div className="space-y-6">
      {/* Scan Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Détection de doublons
          </CardTitle>
          <CardDescription>
            Identifiez et résolvez automatiquement les produits en double
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={scanForDuplicates}
              disabled={isScanning}
              className="w-full"
            >
              <Search className="h-4 w-4 mr-2" />
              {isScanning ? 'Scan en cours...' : 'Scanner les doublons'}
            </Button>

            {isScanning && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Analyse des produits...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Duplicate Groups */}
      {duplicateGroups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Doublons détectés ({duplicateGroups.length})
            </CardTitle>
            <CardDescription>
              Résolvez chaque groupe de doublons
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {duplicateGroups.map((group) => (
                <div key={group.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={getSimilarityColor(group.similarity)}>
                        {Math.round(group.similarity * 100)}% similaire
                      </Badge>
                      <Badge variant="outline">
                        {group.products.length} produits
                      </Badge>
                    </div>
                    <Badge variant="secondary">
                      {group.suggestedAction === 'merge' && 'Fusion recommandée'}
                      {group.suggestedAction === 'keep_best' && 'Garder le meilleur'}
                      {group.suggestedAction === 'manual_review' && 'Révision manuelle'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.products.map((product, index) => (
                      <div key={product.id} className="border rounded-lg p-3 space-y-2">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-24 object-cover rounded"
                        />
                        <div className="space-y-1">
                          <h4 className="font-medium text-sm line-clamp-2">{product.name}</h4>
                          <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                          <p className="text-sm font-bold">{product.price.toFixed(2)} €</p>
                          <Badge variant="outline" className="text-xs">
                            {product.source}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveDuplicate(group.id, 'merge')}
                    >
                      <Merge className="h-4 w-4 mr-2" />
                      Fusionner
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveDuplicate(group.id, 'keep_best')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Garder le meilleur
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => resolveDuplicate(group.id, 'delete_duplicates')}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer doublons
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Duplicates */}
      {!isScanning && duplicateGroups.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Aucun doublon détecté</h3>
            <p className="text-muted-foreground">
              Votre catalogue semble propre ! Lancez un nouveau scan si vous avez ajouté des produits.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}