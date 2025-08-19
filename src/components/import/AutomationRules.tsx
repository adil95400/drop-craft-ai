import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Settings, 
  Plus, 
  Trash2, 
  Edit3,
  Zap,
  DollarSign,
  Globe,
  Tag,
  Bot,
  Filter,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Package
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AutomationRule {
  id: string
  name: string
  description: string
  isActive: boolean
  trigger: {
    type: 'import' | 'price_change' | 'stock_change' | 'schedule'
    conditions: any
  }
  actions: {
    type: 'price_adjustment' | 'translation' | 'seo_optimization' | 'categorization' | 'tagging'
    parameters: any
  }[]
  lastExecuted?: string
  executionCount: number
}

export const AutomationRules = () => {
  const [rules, setRules] = useState<AutomationRule[]>([
    {
      id: 'rule_1',
      name: 'Marge automatique +20%',
      description: 'Applique automatiquement une marge de 20% sur tous les produits importés',
      isActive: true,
      trigger: {
        type: 'import',
        conditions: { allProducts: true }
      },
      actions: [{
        type: 'price_adjustment',
        parameters: { marginPercentage: 20 }
      }],
      lastExecuted: '2024-01-15T10:30:00Z',
      executionCount: 47
    },
    {
      id: 'rule_2',
      name: 'Traduction automatique FR',
      description: 'Traduit automatiquement les titres et descriptions en français',
      isActive: true,
      trigger: {
        type: 'import',
        conditions: { languageNotFrench: true }
      },
      actions: [{
        type: 'translation',
        parameters: { targetLanguage: 'fr', fields: ['name', 'description'] }
      }],
      lastExecuted: '2024-01-15T09:15:00Z',
      executionCount: 23
    },
    {
      id: 'rule_3',
      name: 'SEO automatique',
      description: 'Génère automatiquement les meta-titres et descriptions SEO',
      isActive: false,
      trigger: {
        type: 'import',
        conditions: { missingMeta: true }
      },
      actions: [{
        type: 'seo_optimization',
        parameters: { generateMeta: true, includeKeywords: true }
      }],
      executionCount: 0
    }
  ])

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newRule, setNewRule] = useState<Partial<AutomationRule>>({
    name: '',
    description: '',
    isActive: true,
    trigger: { type: 'import', conditions: {} },
    actions: []
  })

  const { toast } = useToast()

  const triggerTypes = [
    { value: 'import', label: 'Lors de l\'import', icon: Zap },
    { value: 'price_change', label: 'Changement de prix', icon: DollarSign },
    { value: 'stock_change', label: 'Changement de stock', icon: Package },
    { value: 'schedule', label: 'Planifié', icon: Settings }
  ]

  const actionTypes = [
    { 
      value: 'price_adjustment', 
      label: 'Ajustement prix', 
      icon: DollarSign,
      description: 'Modifier automatiquement les prix selon des règles'
    },
    { 
      value: 'translation', 
      label: 'Traduction', 
      icon: Globe,
      description: 'Traduire automatiquement les contenus'
    },
    { 
      value: 'seo_optimization', 
      label: 'Optimisation SEO', 
      icon: Bot,
      description: 'Générer automatiquement les meta-données SEO'
    },
    { 
      value: 'categorization', 
      label: 'Catégorisation', 
      icon: Filter,
      description: 'Assigner automatiquement les catégories'
    },
    { 
      value: 'tagging', 
      label: 'Ajout de tags', 
      icon: Tag,
      description: 'Ajouter automatiquement des tags pertinents'
    }
  ]

  const handleToggleRule = (ruleId: string, isActive: boolean) => {
    setRules(rules.map(rule => 
      rule.id === ruleId ? { ...rule, isActive } : rule
    ))
    
    toast({
      title: isActive ? "Règle activée" : "Règle désactivée",
      description: "La modification a été enregistrée"
    })
  }

  const handleDeleteRule = (ruleId: string) => {
    setRules(rules.filter(rule => rule.id !== ruleId))
    toast({
      title: "Règle supprimée",
      description: "La règle d'automatisation a été supprimée"
    })
  }

  const handleCreateRule = () => {
    if (!newRule.name || !newRule.description) {
      toast({
        title: "Erreur",
        description: "Le nom et la description sont obligatoires",
        variant: "destructive"
      })
      return
    }

    const rule: AutomationRule = {
      id: `rule_${Date.now()}`,
      name: newRule.name!,
      description: newRule.description!,
      isActive: newRule.isActive!,
      trigger: newRule.trigger!,
      actions: newRule.actions!,
      executionCount: 0
    }

    setRules([...rules, rule])
    setNewRule({
      name: '',
      description: '',
      isActive: true,
      trigger: { type: 'import', conditions: {} },
      actions: []
    })
    setShowCreateForm(false)

    toast({
      title: "Règle créée",
      description: "La nouvelle règle d'automatisation a été créée"
    })
  }

  const getStatusColor = (rule: AutomationRule) => {
    if (!rule.isActive) return 'text-gray-500'
    if (rule.executionCount === 0) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getStatusIcon = (rule: AutomationRule) => {
    if (!rule.isActive) return AlertTriangle
    if (rule.executionCount === 0) return Settings
    return CheckCircle
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Règles d'Automatisation
            </CardTitle>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle règle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="rules" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="rules">Règles Actives</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="rules" className="mt-6">
              <div className="space-y-4">
                {/* Statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <Settings className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                    <p className="text-sm font-medium">{rules.length}</p>
                    <p className="text-xs text-muted-foreground">Règles totales</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 mx-auto mb-1 text-green-600" />
                    <p className="text-sm font-medium">{rules.filter(r => r.isActive).length}</p>
                    <p className="text-xs text-muted-foreground">Actives</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <Zap className="w-5 h-5 mx-auto mb-1 text-orange-600" />
                    <p className="text-sm font-medium">{rules.reduce((sum, r) => sum + r.executionCount, 0)}</p>
                    <p className="text-xs text-muted-foreground">Exécutions</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <Bot className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                    <p className="text-sm font-medium">{rules.filter(r => r.actions.some(a => a.type.includes('optimization'))).length}</p>
                    <p className="text-xs text-muted-foreground">IA Activée</p>
                  </div>
                </div>

                {/* Liste des règles */}
                <div className="space-y-3">
                  {rules.map((rule) => {
                    const StatusIcon = getStatusIcon(rule)
                    return (
                      <Card key={rule.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <StatusIcon className={`w-5 h-5 ${getStatusColor(rule)}`} />
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium">{rule.name}</h4>
                                  <Badge variant={rule.isActive ? "default" : "secondary"}>
                                    {rule.isActive ? 'Actif' : 'Inactif'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{rule.description}</p>
                                
                                <div className="flex items-center gap-4 mt-2">
                                  <div className="flex items-center gap-2">
                                    <Zap className="w-3 h-3" />
                                    <span className="text-xs">
                                      {triggerTypes.find(t => t.value === rule.trigger.type)?.label}
                                    </span>
                                  </div>
                                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                  <div className="flex items-center gap-1">
                                    {rule.actions.map((action, index) => {
                                      const ActionIcon = actionTypes.find(a => a.value === action.type)?.icon || Bot
                                      return (
                                        <ActionIcon key={index} className="w-3 h-3" />
                                      )
                                    })}
                                    <span className="text-xs ml-1">
                                      {rule.actions.length} action(s)
                                    </span>
                                  </div>
                                  {rule.executionCount > 0 && (
                                    <>
                                      <span className="text-xs text-muted-foreground">•</span>
                                      <span className="text-xs text-muted-foreground">
                                        {rule.executionCount} exécution(s)
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={rule.isActive}
                                onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                              />
                              <Button variant="outline" size="sm">
                                <Edit3 className="w-3 h-3" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteRule(rule.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="templates" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    name: "E-commerce Standard",
                    description: "Marge 30%, traduction FR, SEO automatique",
                    rules: ["Marge +30%", "Traduction FR/EN", "Meta SEO", "Catégorisation IA"]
                  },
                  {
                    name: "Dropshipping Optimisé", 
                    description: "Marge 50%, optimisation images, tags trending",
                    rules: ["Marge +50%", "Optimisation images", "Tags trending", "Prix dynamique"]
                  },
                  {
                    name: "B2B Wholesale",
                    description: "Tarifs dégressifs, TVA, catégories professionnelles",
                    rules: ["Tarifs B2B", "Calcul TVA", "Catégories Pro", "Stock minimum"]
                  },
                  {
                    name: "Marketplace Multi-canal",
                    description: "Adaptation Amazon, eBay, prix compétitifs",
                    rules: ["Format Amazon", "Optimisation eBay", "Prix concurrence", "Stock sync"]
                  }
                ].map((template, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">{template.name}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                      
                      <div className="space-y-2">
                        {template.rules.map((rule, ruleIndex) => (
                          <div key={ruleIndex} className="flex items-center gap-2 text-xs">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>{rule}</span>
                          </div>
                        ))}
                      </div>
                      
                      <Button size="sm" className="w-full mt-3">
                        Appliquer ce template
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Formulaire de création */}
          {showCreateForm && (
            <Card className="mt-6 border-dashed">
              <CardHeader>
                <CardTitle className="text-base">Créer une nouvelle règle</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rule-name">Nom de la règle</Label>
                    <Input
                      id="rule-name"
                      placeholder="Ex: Marge automatique +25%"
                      value={newRule.name}
                      onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rule-desc">Description</Label>
                    <Input
                      id="rule-desc"
                      placeholder="Description de la règle"
                      value={newRule.description}
                      onChange={(e) => setNewRule({...newRule, description: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <Label>Déclencheur</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    {triggerTypes.map((trigger) => {
                      const Icon = trigger.icon
                      return (
                        <button
                          key={trigger.value}
                          onClick={() => setNewRule({
                            ...newRule,
                            trigger: { type: trigger.value as any, conditions: {} }
                          })}
                          className={`p-3 border rounded-lg text-left transition-colors ${
                            newRule.trigger?.type === trigger.value 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:bg-muted/50'
                          }`}
                        >
                          <Icon className="w-4 h-4 mb-1" />
                          <p className="text-xs font-medium">{trigger.label}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <Label>Actions à exécuter</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {actionTypes.map((action) => {
                      const Icon = action.icon
                      const isSelected = newRule.actions?.some(a => a.type === action.value)
                      return (
                        <button
                          key={action.value}
                          onClick={() => {
                            const currentActions = newRule.actions || []
                            if (isSelected) {
                              setNewRule({
                                ...newRule,
                                actions: currentActions.filter(a => a.type !== action.value)
                              })
                            } else {
                              setNewRule({
                                ...newRule,
                                actions: [...currentActions, { type: action.value as any, parameters: {} }]
                              })
                            }
                          }}
                          className={`p-3 border rounded-lg text-left transition-colors ${
                            isSelected 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:bg-muted/50'
                          }`}
                        >
                          <Icon className="w-4 h-4 mb-1" />
                          <p className="text-sm font-medium">{action.label}</p>
                          <p className="text-xs text-muted-foreground">{action.description}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCreateRule} className="flex-1">
                    Créer la règle
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}