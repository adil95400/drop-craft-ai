import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Globe, CheckCircle, AlertCircle, TrendingUp, Package } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface AnalysisResult {
  name: string
  categories: string[]
  estimated_products: number
  reliability_score: number
  has_api: boolean
}

export const SupplierAnalyzer: React.FC = () => {
  const { toast } = useToast()
  const [url, setUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)

  const handleAnalyze = async () => {
    if (!url) {
      toast({
        title: "URL requise",
        description: "Veuillez entrer l'URL du fournisseur",
        variant: "destructive"
      })
      return
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      toast({
        title: "URL invalide",
        description: "Veuillez entrer une URL valide (ex: https://example.com)",
        variant: "destructive"
      })
      return
    }

    setIsAnalyzing(true)
    setResult(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Non authentifié')
      }

      const { data, error } = await supabase.functions.invoke('analyze-supplier', {
        body: { url, userId: user.id }
      })

      if (error) throw error

      if (!data.success) {
        throw new Error(data.error || 'Échec de l\'analyse')
      }

      setResult(data.analysis)
      
      toast({
        title: "✅ Fournisseur analysé",
        description: `${data.analysis.name} a été ajouté avec succès`,
      })

      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 2000)

    } catch (error: any) {
      console.error('Analysis error:', error)
      
      let errorMessage = "Impossible d'analyser le fournisseur"
      if (error.message?.includes('Rate limit')) {
        errorMessage = "Limite de taux atteinte. Réessayez dans quelques instants."
      } else if (error.message?.includes('Payment required')) {
        errorMessage = "Crédits insuffisants. Ajoutez des crédits à votre espace de travail Lovable AI."
      }
      
      toast({
        title: "Erreur d'analyse",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getReliabilityColor = (score: number) => {
    if (score >= 4) return 'text-emerald-600 bg-emerald-50'
    if (score >= 3) return 'text-orange-600 bg-orange-50'
    return 'text-red-600 bg-red-50'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Ajouter un fournisseur intelligent
        </CardTitle>
        <CardDescription>
          Entrez l'URL d'un fournisseur et l'IA analysera automatiquement ses informations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="supplier-url">URL du fournisseur</Label>
          <div className="flex gap-2">
            <Input
              id="supplier-url"
              placeholder="https://exemple-fournisseur.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              disabled={isAnalyzing}
            />
            <Button 
              onClick={handleAnalyze} 
              disabled={isAnalyzing || !url}
              className="min-w-[120px]"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyse...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Analyser
                </>
              )}
            </Button>
          </div>
        </div>

        {result && (
          <div className="mt-6 p-4 border rounded-lg bg-muted/30 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">{result.name}</h3>
                <p className="text-sm text-muted-foreground">Fournisseur détecté</p>
              </div>
              <CheckCircle className="h-6 w-6 text-emerald-500" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Produits estimés</p>
                  <p className="font-semibold">{result.estimated_products.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Fiabilité</p>
                  <Badge className={getReliabilityColor(result.reliability_score)}>
                    {result.reliability_score.toFixed(1)}/5
                  </Badge>
                </div>
              </div>
            </div>

            {result.categories && result.categories.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Catégories</p>
                <div className="flex flex-wrap gap-2">
                  {result.categories.map((cat, idx) => (
                    <Badge key={idx} variant="outline">{cat}</Badge>
                  ))}
                </div>
              </div>
            )}

            {result.has_api && (
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <CheckCircle className="h-4 w-4" />
                <span>API disponible détectée</span>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground pt-2">
          <AlertCircle className="h-3 w-3 inline mr-1" />
          L'analyse utilise l'IA pour extraire automatiquement les informations du site web du fournisseur
        </div>
      </CardContent>
    </Card>
  )
}
