import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { Sparkles, Save, RotateCcw, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

interface CategoryRule {
  id: string
  supplierCategory: string
  targetCategory: string
  confidence: number
  isAI: boolean
  keywords: string[]
}

interface CategoryMappingProps {
  onRulesUpdated: (rules: CategoryRule[]) => void
}

export function CategoryMapping({ onRulesUpdated }: CategoryMappingProps) {
  const [mappingRules, setMappingRules] = useState<CategoryRule[]>([])
  const [newRule, setNewRule] = useState({
    supplierCategory: '',
    targetCategory: '',
    keywords: ''
  })
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [availableCategories] = useState([
    'Électronique',
    'Mode & Vêtements',
    'Maison & Jardin',
    'Sports & Loisirs',
    'Beauté & Santé',
    'Enfants & Bébés',
    'Automobile',
    'Bijoux & Montres',
    'Livres & Médias',
    'Alimentation & Boissons'
  ])

  useEffect(() => {
    loadMappingRules()
  }, [])

  const loadMappingRules = async () => {
    // Demo data for development
    const demoRules: CategoryRule[] = [
      {
        id: 'demo_1',
        supplierCategory: 'Electronics > Smartphones',
        targetCategory: 'Électronique',
        confidence: 0.95,
        isAI: true,
        keywords: ['smartphone', 'mobile', 'phone']
      },
      {
        id: 'demo_2', 
        supplierCategory: 'Fashion > Women > Dresses',
        targetCategory: 'Mode & Vêtements',
        confidence: 0.88,
        isAI: false,
        keywords: ['dress', 'robe', 'fashion']
      }
    ]
    setMappingRules(demoRules)
  }

  const generateAIMappings = async () => {
    setIsGeneratingAI(true)
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-category-mappings', {
        body: {
          existingCategories: availableCategories,
          analyzeProducts: true,
          includeKeywords: true
        }
      })

      if (error) throw error

      const aiRules = data.suggestions.map((suggestion: any, index: number) => ({
        id: `ai_${Date.now()}_${index}`,
        supplierCategory: suggestion.supplierCategory,
        targetCategory: suggestion.targetCategory,
        confidence: suggestion.confidence,
        isAI: true,
        keywords: suggestion.keywords || []
      }))

      setMappingRules(prev => [...prev, ...aiRules])
      onRulesUpdated([...mappingRules, ...aiRules])

      toast({
        title: "Mappings IA générés",
        description: `${aiRules.length} nouvelles règles de catégories créées`
      })

    } catch (error) {
      toast({
        title: "Erreur IA",
        description: "Impossible de générer les mappings automatiques",
        variant: "destructive"
      })
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const addManualRule = async () => {
    if (!newRule.supplierCategory || !newRule.targetCategory) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir la catégorie source et cible",
        variant: "destructive"
      })
      return
    }

    const rule: CategoryRule = {
      id: `manual_${Date.now()}`,
      supplierCategory: newRule.supplierCategory,
      targetCategory: newRule.targetCategory,
      confidence: 1.0,
      isAI: false,
      keywords: newRule.keywords.split(',').map(k => k.trim()).filter(Boolean)
    }

    // Demo mode - just add to state
    setMappingRules(prev => [...prev, rule])
    onRulesUpdated([...mappingRules, rule])
    setNewRule({ supplierCategory: '', targetCategory: '', keywords: '' })

    toast({
      title: "Règle ajoutée",
      description: "Nouvelle règle de mapping créée"
    })
  }

  const deleteRule = async (ruleId: string) => {
    const updatedRules = mappingRules.filter(rule => rule.id !== ruleId)
    setMappingRules(updatedRules)
    onRulesUpdated(updatedRules)

    toast({
      title: "Règle supprimée",
      description: "La règle de mapping a été supprimée"
    })
  }

  const saveAllRules = async () => {
    try {
      const { error } = await supabase.functions.invoke('save-category-mappings', {
        body: { rules: mappingRules }
      })

      if (error) throw error

      toast({
        title: "Règles sauvegardées",
        description: "Toutes les règles de mapping ont été sauvegardées"
      })

    } catch (error) {
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible de sauvegarder les règles",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* AI Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Mapping automatique des catégories
          </CardTitle>
          <CardDescription>
            Laissez l'IA analyser vos produits et créer des règles de mapping intelligentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={generateAIMappings}
            disabled={isGeneratingAI}
            className="w-full"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isGeneratingAI ? 'Génération en cours...' : 'Générer des mappings IA'}
          </Button>
        </CardContent>
      </Card>

      {/* Manual Rule Creation */}
      <Card>
        <CardHeader>
          <CardTitle>Ajouter une règle manuelle</CardTitle>
          <CardDescription>
            Créez des règles personnalisées pour mapper vos catégories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier-category">Catégorie fournisseur</Label>
              <Input
                id="supplier-category"
                placeholder="ex: Electronics > Smartphones"
                value={newRule.supplierCategory}
                onChange={(e) => setNewRule(prev => ({ ...prev, supplierCategory: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-category">Catégorie cible</Label>
              <Select 
                value={newRule.targetCategory} 
                onValueChange={(value) => setNewRule(prev => ({ ...prev, targetCategory: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="keywords">Mots-clés (optionnel)</Label>
              <Input
                id="keywords"
                placeholder="smartphone, mobile, téléphone"
                value={newRule.keywords}
                onChange={(e) => setNewRule(prev => ({ ...prev, keywords: e.target.value }))}
              />
            </div>
          </div>
          <Button onClick={addManualRule} className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter la règle
          </Button>
        </CardContent>
      </Card>

      {/* Current Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Règles de mapping ({mappingRules.length})</span>
            <Button onClick={saveAllRules} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder tout
            </Button>
          </CardTitle>
          <CardDescription>
            Gérez vos règles de mapping de catégories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mappingRules.map((rule) => (
              <div key={rule.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={rule.isAI ? "default" : "secondary"}>
                      {rule.isAI ? "IA" : "Manuel"}
                    </Badge>
                    <Badge variant="outline">
                      {Math.round(rule.confidence * 100)}% confiance
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteRule(rule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Source</p>
                    <p className="font-medium">{rule.supplierCategory}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Cible</p>
                    <p className="font-medium">{rule.targetCategory}</p>
                  </div>
                </div>

                {rule.keywords.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Mots-clés</p>
                    <div className="flex flex-wrap gap-1">
                      {rule.keywords.map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {mappingRules.length === 0 && (
              <div className="text-center py-8">
                <RotateCcw className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Aucune règle de mapping</h3>
                <p className="text-muted-foreground">
                  Créez des règles pour mapper automatiquement les catégories de vos fournisseurs
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}