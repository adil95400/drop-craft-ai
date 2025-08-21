import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { 
  Filter, 
  Plus, 
  X, 
  Code, 
  Save, 
  Play,
  GitBranch,
  Settings,
  Eye,
  Calendar,
  Hash,
  Type,
  ToggleLeft,
  FileText,
  Database
} from "lucide-react"

const CONDITION_OPERATORS = {
  string: [
    { value: 'equals', label: 'Égal à' },
    { value: 'not_equals', label: 'Différent de' },
    { value: 'contains', label: 'Contient' },
    { value: 'not_contains', label: 'Ne contient pas' },
    { value: 'starts_with', label: 'Commence par' },
    { value: 'ends_with', label: 'Finit par' },
    { value: 'is_empty', label: 'Est vide' },
    { value: 'is_not_empty', label: 'N\'est pas vide' },
    { value: 'regex', label: 'Expression régulière' }
  ],
  number: [
    { value: 'equals', label: 'Égal à' },
    { value: 'not_equals', label: 'Différent de' },
    { value: 'greater_than', label: 'Supérieur à' },
    { value: 'greater_than_equal', label: 'Supérieur ou égal à' },
    { value: 'less_than', label: 'Inférieur à' },
    { value: 'less_than_equal', label: 'Inférieur ou égal à' },
    { value: 'between', label: 'Entre' },
    { value: 'is_null', label: 'Est vide' }
  ],
  boolean: [
    { value: 'is_true', label: 'Est vrai' },
    { value: 'is_false', label: 'Est faux' }
  ],
  date: [
    { value: 'equals', label: 'Égal à' },
    { value: 'not_equals', label: 'Différent de' },
    { value: 'after', label: 'Après' },
    { value: 'before', label: 'Avant' },
    { value: 'between', label: 'Entre' },
    { value: 'last_days', label: 'Derniers X jours' },
    { value: 'next_days', label: 'Prochains X jours' }
  ],
  array: [
    { value: 'contains', label: 'Contient' },
    { value: 'not_contains', label: 'Ne contient pas' },
    { value: 'is_empty', label: 'Est vide' },
    { value: 'length_equals', label: 'Longueur égale à' }
  ]
}

const FIELD_TYPES = [
  { value: 'string', label: 'Texte', icon: Type },
  { value: 'number', label: 'Nombre', icon: Hash },
  { value: 'boolean', label: 'Booléen', icon: ToggleLeft },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'array', label: 'Tableau', icon: Database }
]

const LOGICAL_OPERATORS = [
  { value: 'and', label: 'ET (tous doivent être vrais)' },
  { value: 'or', label: 'OU (au moins un doit être vrai)' }
]

const PRESET_CONDITIONS = [
  {
    name: 'Nouveau client',
    description: 'Client créé dans les 7 derniers jours',
    conditions: [
      { field: 'created_at', type: 'date', operator: 'last_days', value: '7' }
    ]
  },
  {
    name: 'Commande importante',
    description: 'Commande > 500€',
    conditions: [
      { field: 'total_amount', type: 'number', operator: 'greater_than', value: '500' }
    ]
  },
  {
    name: 'Email valide requis',
    description: 'Email présent et format valide',
    conditions: [
      { field: 'email', type: 'string', operator: 'is_not_empty', value: '' },
      { field: 'email', type: 'string', operator: 'regex', value: '^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$' }
    ],
    logicalOperator: 'and'
  }
]

export const AdvancedFiltering = ({ onFiltersChange }: { onFiltersChange?: (filters: any) => void }) => {
  const [conditions, setConditions] = useState<any[]>([])
  const [logicalOperator, setLogicalOperator] = useState('and')
  const [isTestMode, setIsTestMode] = useState(false)
  const [testData, setTestData] = useState('')
  const [testResults, setTestResults] = useState<any>(null)
  const [savedFilters, setSavedFilters] = useState<any[]>([])
  const [filterName, setFilterName] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange({
        conditions,
        logicalOperator,
        isValid: conditions.length > 0 && conditions.every(c => c.field && c.operator)
      })
    }
  }, [conditions, logicalOperator, onFiltersChange])

  const addCondition = () => {
    const newCondition = {
      id: Date.now(),
      field: '',
      type: 'string',
      operator: '',
      value: '',
      value2: '' // For "between" operations
    }
    setConditions([...conditions, newCondition])
  }

  const updateCondition = (id: number, updates: Partial<any>) => {
    setConditions(conditions.map(c => 
      c.id === id ? { ...c, ...updates } : c
    ))
  }

  const removeCondition = (id: number) => {
    setConditions(conditions.filter(c => c.id !== id))
  }

  const applyPreset = (preset: any) => {
    const newConditions = preset.conditions.map((condition: any, index: number) => ({
      id: Date.now() + index,
      ...condition
    }))
    setConditions(newConditions)
    if (preset.logicalOperator) {
      setLogicalOperator(preset.logicalOperator)
    }
    
    toast({
      title: "Preset appliqué",
      description: `Conditions "${preset.name}" appliquées`
    })
  }

  const testConditions = () => {
    if (!testData) {
      toast({
        title: "Données de test manquantes",
        description: "Veuillez saisir des données JSON de test",
        variant: "destructive"
      })
      return
    }

    try {
      const data = JSON.parse(testData)
      const results = evaluateConditions(data, conditions, logicalOperator)
      setTestResults({
        passed: results.passed,
        details: results.details,
        data
      })
      
      toast({
        title: results.passed ? "Test réussi" : "Test échoué",
        description: results.passed ? "Les conditions sont satisfaites" : "Les conditions ne sont pas satisfaites",
        variant: results.passed ? "default" : "destructive"
      })
    } catch (error) {
      toast({
        title: "Erreur dans les données de test",
        description: "Format JSON invalide",
        variant: "destructive"
      })
    }
  }

  const evaluateConditions = (data: any, conditions: any[], operator: string) => {
    const results = conditions.map(condition => {
      const fieldValue = getNestedValue(data, condition.field)
      const conditionResult = evaluateCondition(fieldValue, condition)
      
      return {
        condition,
        fieldValue,
        result: conditionResult,
        explanation: getConditionExplanation(condition, fieldValue, conditionResult)
      }
    })

    const passed = operator === 'and' 
      ? results.every(r => r.result)
      : results.some(r => r.result)

    return { passed, details: results }
  }

  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  const evaluateCondition = (value: any, condition: any) => {
    const { operator, value: conditionValue, value2 } = condition
    
    switch (operator) {
      case 'equals': return value === conditionValue
      case 'not_equals': return value !== conditionValue
      case 'contains': return String(value).includes(conditionValue)
      case 'not_contains': return !String(value).includes(conditionValue)
      case 'starts_with': return String(value).startsWith(conditionValue)
      case 'ends_with': return String(value).endsWith(conditionValue)
      case 'is_empty': return !value || value === ''
      case 'is_not_empty': return value && value !== ''
      case 'regex': 
        try {
          const regex = new RegExp(conditionValue)
          return regex.test(String(value))
        } catch {
          return false
        }
      case 'greater_than': return Number(value) > Number(conditionValue)
      case 'less_than': return Number(value) < Number(conditionValue)
      case 'greater_than_equal': return Number(value) >= Number(conditionValue)
      case 'less_than_equal': return Number(value) <= Number(conditionValue)
      case 'between': return Number(value) >= Number(conditionValue) && Number(value) <= Number(value2)
      case 'is_true': return Boolean(value) === true
      case 'is_false': return Boolean(value) === false
      case 'is_null': return value === null || value === undefined
      default: return false
    }
  }

  const getConditionExplanation = (condition: any, value: any, result: boolean) => {
    return `${condition.field} (${JSON.stringify(value)}) ${condition.operator} ${condition.value} = ${result ? '✓' : '✗'}`
  }

  const saveFilter = () => {
    if (!filterName) {
      toast({
        title: "Nom manquant",
        description: "Veuillez saisir un nom pour ce filtre",
        variant: "destructive"
      })
      return
    }

    const newFilter = {
      id: Date.now(),
      name: filterName,
      conditions: [...conditions],
      logicalOperator,
      createdAt: new Date().toISOString()
    }

    setSavedFilters([...savedFilters, newFilter])
    setFilterName('')
    
    toast({
      title: "Filtre sauvegardé",
      description: `Le filtre "${newFilter.name}" a été sauvegardé`
    })
  }

  const loadFilter = (filter: any) => {
    setConditions([...filter.conditions])
    setLogicalOperator(filter.logicalOperator)
    
    toast({
      title: "Filtre chargé",
      description: `Le filtre "${filter.name}" a été appliqué`
    })
  }

  const ConditionRow = ({ condition }: { condition: any }) => {
    const operators = CONDITION_OPERATORS[condition.type as keyof typeof CONDITION_OPERATORS] || []
    const needsSecondValue = ['between'].includes(condition.operator)

    return (
      <div className="flex items-center gap-2 p-4 border rounded-lg bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2 flex-1">
          {/* Field */}
          <Input
            placeholder="Champ (ex: user.email)"
            value={condition.field}
            onChange={(e) => updateCondition(condition.id, { field: e.target.value })}
            className="bg-white"
          />
          
          {/* Type */}
          <Select 
            value={condition.type} 
            onValueChange={(type) => updateCondition(condition.id, { type, operator: '', value: '' })}
          >
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map(type => {
                const Icon = type.icon
                return (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-3 h-3" />
                      {type.label}
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>

          {/* Operator */}
          <Select 
            value={condition.operator} 
            onValueChange={(operator) => updateCondition(condition.id, { operator })}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Opérateur" />
            </SelectTrigger>
            <SelectContent>
              {operators.map(op => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Value */}
          <Input
            placeholder="Valeur"
            value={condition.value}
            onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
            className="bg-white"
            disabled={['is_empty', 'is_not_empty', 'is_true', 'is_false', 'is_null'].includes(condition.operator)}
          />

          {/* Second Value (for between) */}
          {needsSecondValue && (
            <Input
              placeholder="Valeur 2"
              value={condition.value2}
              onChange={(e) => updateCondition(condition.id, { value2: e.target.value })}
              className="bg-white"
            />
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeCondition(condition.id)}
          className="text-red-600 hover:text-red-700"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtrage Avancé
          </h3>
          <p className="text-sm text-muted-foreground">
            Créez des conditions complexes pour filtrer vos données
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Presets
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Conditions Prédéfinies</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                {PRESET_CONDITIONS.map((preset, index) => (
                  <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => applyPreset(preset)}>
                    <CardContent className="p-4">
                      <h4 className="font-medium">{preset.name}</h4>
                      <p className="text-sm text-muted-foreground">{preset.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          
          <Button onClick={addCondition} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Condition
          </Button>
        </div>
      </div>

      {/* Conditions */}
      {conditions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Conditions</CardTitle>
              {conditions.length > 1 && (
                <Select value={logicalOperator} onValueChange={setLogicalOperator}>
                  <SelectTrigger className="w-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOGICAL_OPERATORS.map(op => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {conditions.map((condition, index) => (
              <div key={condition.id}>
                {index > 0 && (
                  <div className="text-center py-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      {logicalOperator.toUpperCase()}
                    </Badge>
                  </div>
                )}
                <ConditionRow condition={condition} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Test Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Code className="w-4 h-4" />
              Test des Conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">Données de test (JSON)</Label>
              <Textarea
                placeholder={`{
  "user": {
    "email": "test@example.com",
    "created_at": "2024-01-15",
    "is_premium": true
  },
  "order": {
    "total": 299.99,
    "items": ["item1", "item2"]
  }
}`}
                value={testData}
                onChange={(e) => setTestData(e.target.value)}
                className="mt-1 font-mono text-xs"
                rows={8}
              />
            </div>
            <Button onClick={testConditions} className="w-full" disabled={conditions.length === 0}>
              <Play className="w-4 h-4 mr-2" />
              Tester les Conditions
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Résultat du Test</CardTitle>
          </CardHeader>
          <CardContent>
            {testResults ? (
              <div className="space-y-3">
                <div className={`p-3 rounded-lg ${testResults.passed ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  <div className="font-medium">
                    {testResults.passed ? '✓ Conditions satisfaites' : '✗ Conditions non satisfaites'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h5 className="font-medium text-xs">Détails:</h5>
                  {testResults.details.map((detail: any, index: number) => (
                    <div key={index} className="text-xs p-2 bg-gray-50 rounded font-mono">
                      {detail.explanation}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Testez vos conditions pour voir les résultats</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Save Filter */}
      {conditions.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Input
                placeholder="Nom du filtre"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="flex-1"
              />
              <Button onClick={saveFilter} disabled={!filterName}>
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Filters */}
      {savedFilters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Filtres Sauvegardés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {savedFilters.map(filter => (
                <div key={filter.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{filter.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {filter.conditions.length} condition{filter.conditions.length > 1 ? 's' : ''}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => loadFilter(filter)}>
                    Charger
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}