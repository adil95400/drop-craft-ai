import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { 
  Plus, X, Users, Filter, Zap, Save, Eye,
  Calendar, Mail, ShoppingCart, TrendingUp
} from 'lucide-react'
import { useRealTimeMarketing } from '@/hooks/useRealTimeMarketing'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface SegmentCondition {
  id: string
  field: string
  operator: string
  value: string | number
  type: 'and' | 'or'
}

interface SegmentPreview {
  estimatedSize: number
  demographics: {
    avgAge: number
    topCountry: string
    avgSpent: number
  }
}

const fieldOptions = [
  { value: 'email', label: 'Email', type: 'string', icon: Mail },
  { value: 'name', label: 'Nom', type: 'string', icon: Users },
  { value: 'company', label: 'Entreprise', type: 'string', icon: Users },
  { value: 'lifecycle_stage', label: 'Étape du cycle', type: 'select', icon: TrendingUp },
  { value: 'lead_score', label: 'Score de lead', type: 'number', icon: Zap },
  { value: 'created_at', label: 'Date de création', type: 'date', icon: Calendar },
  { value: 'last_activity_at', label: 'Dernière activité', type: 'date', icon: Calendar },
  { value: 'tags', label: 'Tags', type: 'array', icon: Filter }
]

const operatorOptions = {
  string: [
    { value: 'equals', label: 'Égal à' },
    { value: 'not_equals', label: 'Différent de' },
    { value: 'contains', label: 'Contient' },
    { value: 'starts_with', label: 'Commence par' },
    { value: 'ends_with', label: 'Finit par' }
  ],
  number: [
    { value: 'equals', label: 'Égal à' },
    { value: 'greater_than', label: 'Supérieur à' },
    { value: 'less_than', label: 'Inférieur à' },
    { value: 'between', label: 'Entre' }
  ],
  date: [
    { value: 'after', label: 'Après' },
    { value: 'before', label: 'Avant' },
    { value: 'on', label: 'Le' },
    { value: 'last_days', label: 'Derniers X jours' }
  ],
  select: [
    { value: 'equals', label: 'Égal à' },
    { value: 'not_equals', label: 'Différent de' }
  ],
  array: [
    { value: 'includes', label: 'Inclut' },
    { value: 'not_includes', label: 'N\'inclut pas' }
  ]
}

const lifecycleStages = [
  'subscriber', 'lead', 'mql', 'sql', 'opportunity', 'customer', 'evangelist'
]

export function AdvancedSegmentBuilder() {
  const { contacts } = useRealTimeMarketing()
  const [segmentName, setSegmentName] = useState('')
  const [segmentDescription, setSegmentDescription] = useState('')
  const [conditions, setConditions] = useState<SegmentCondition[]>([
    {
      id: '1',
      field: 'lifecycle_stage',
      operator: 'equals',
      value: 'lead',
      type: 'and'
    }
  ])
  const [isAutoUpdate, setIsAutoUpdate] = useState(true)
  const [segmentPreview, setSegmentPreview] = useState<SegmentPreview>({
    estimatedSize: 0,
    demographics: {
      avgAge: 0,
      topCountry: 'France',
      avgSpent: 0
    }
  })
  const { toast } = useToast()

  const addCondition = () => {
    const newCondition: SegmentCondition = {
      id: Date.now().toString(),
      field: 'lifecycle_stage',
      operator: 'equals',
      value: '',
      type: 'and'
    }
    setConditions([...conditions, newCondition])
  }

  const removeCondition = (id: string) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter(c => c.id !== id))
    }
  }

  const updateCondition = (id: string, updates: Partial<SegmentCondition>) => {
    setConditions(conditions.map(c => 
      c.id === id ? { ...c, ...updates } : c
    ))
  }

  const calculatePreview = () => {
    // Simulate segment calculation based on conditions
    let estimatedSize = contacts.length

    conditions.forEach(condition => {
      switch (condition.field) {
        case 'lifecycle_stage':
          estimatedSize = Math.floor(estimatedSize * 0.3) // Simulate filtering
          break
        case 'lead_score':
          estimatedSize = Math.floor(estimatedSize * 0.4)
          break
        case 'tags':
          estimatedSize = Math.floor(estimatedSize * 0.2)
          break
        default:
          estimatedSize = Math.floor(estimatedSize * 0.5)
      }
    })

    setSegmentPreview({
      estimatedSize: Math.max(estimatedSize, 0),
      demographics: {
        avgAge: 32 + Math.floor(Math.random() * 20),
        topCountry: 'France',
        avgSpent: 150 + Math.floor(Math.random() * 500)
      }
    })
  }

  const handleSaveSegment = async () => {
    if (!segmentName.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un nom pour le segment",
        variant: "destructive"
      })
      return
    }

    try {
      const { error } = await supabase
        .from('marketing_segments')
        .insert({
          name: segmentName,
          description: segmentDescription,
          criteria: JSON.stringify({
            conditions: conditions,
            auto_update: isAutoUpdate
          }) as any,
          contact_count: segmentPreview.estimatedSize,
          last_updated: new Date().toISOString(),
          user_id: (await supabase.auth.getUser()).data.user?.id as string
        })

      if (error) throw error

      toast({
        title: "Segment créé",
        description: "Le segment a été sauvegardé avec succès"
      })

      // Reset form
      setSegmentName('')
      setSegmentDescription('')
      setConditions([{
        id: '1',
        field: 'lifecycle_stage',
        operator: 'equals',
        value: 'lead',
        type: 'and'
      }])

    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le segment",
        variant: "destructive"
      })
    }
  }

  const getFieldType = (fieldName: string) => {
    return fieldOptions.find(f => f.value === fieldName)?.type || 'string'
  }

  const getFieldIcon = (fieldName: string) => {
    const field = fieldOptions.find(f => f.value === fieldName)
    return field?.icon || Filter
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Générateur de Segments Avancé</h2>
          <p className="text-muted-foreground">
            Créez des segments dynamiques avec des conditions complexes
          </p>
        </div>
        <Button onClick={calculatePreview} variant="outline" className="gap-2">
          <Eye className="h-4 w-4" />
          Prévisualiser
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Segment Builder */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informations du Segment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="segment-name">Nom du Segment</Label>
                <Input
                  id="segment-name"
                  placeholder="Ex: Prospects B2B qualifiés"
                  value={segmentName}
                  onChange={(e) => setSegmentName(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="segment-description">Description</Label>
                <Textarea
                  id="segment-description"
                  placeholder="Description optionnelle du segment..."
                  value={segmentDescription}
                  onChange={(e) => setSegmentDescription(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Mise à jour automatique</Label>
                  <p className="text-sm text-muted-foreground">
                    Le segment se met à jour automatiquement quand de nouveaux contacts correspondent aux critères
                  </p>
                </div>
                <Switch 
                  checked={isAutoUpdate} 
                  onCheckedChange={setIsAutoUpdate}
                />
              </div>
            </CardContent>
          </Card>

          {/* Conditions Builder */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Conditions de Filtrage</CardTitle>
                <Button onClick={addCondition} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Ajouter Condition
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conditions.map((condition, index) => {
                  const fieldType = getFieldType(condition.field)
                  const FieldIcon = getFieldIcon(condition.field)
                  
                  return (
                    <div key={condition.id} className="border rounded-lg p-4 space-y-4">
                      {index > 0 && (
                        <div className="flex items-center gap-2">
                          <Select 
                            value={condition.type} 
                            onValueChange={(value: 'and' | 'or') => 
                              updateCondition(condition.id, { type: value })
                            }
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="and">ET</SelectItem>
                              <SelectItem value="or">OU</SelectItem>
                            </SelectContent>
                          </Select>
                          <span className="text-sm text-muted-foreground">
                            {condition.type === 'and' ? 'Doit aussi respecter' : 'Ou peut respecter'}
                          </span>
                        </div>
                      )}
                      
                      <div className="grid gap-4 md:grid-cols-4">
                        {/* Field */}
                        <div>
                          <Label>Champ</Label>
                          <Select 
                            value={condition.field}
                            onValueChange={(value) => 
                              updateCondition(condition.id, { field: value, value: '' })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {fieldOptions.map((field) => (
                                <SelectItem key={field.value} value={field.value}>
                                  <div className="flex items-center gap-2">
                                    <field.icon className="h-4 w-4" />
                                    {field.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Operator */}
                        <div>
                          <Label>Opérateur</Label>
                          <Select 
                            value={condition.operator}
                            onValueChange={(value) => 
                              updateCondition(condition.id, { operator: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {operatorOptions[fieldType as keyof typeof operatorOptions]?.map((op) => (
                                <SelectItem key={op.value} value={op.value}>
                                  {op.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Value */}
                        <div>
                          <Label>Valeur</Label>
                          {fieldType === 'select' && condition.field === 'lifecycle_stage' ? (
                            <Select 
                              value={condition.value as string}
                              onValueChange={(value) => 
                                updateCondition(condition.id, { value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {lifecycleStages.map((stage) => (
                                  <SelectItem key={stage} value={stage}>
                                    {stage}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              type={fieldType === 'number' ? 'number' : fieldType === 'date' ? 'date' : 'text'}
                              value={condition.value}
                              onChange={(e) => 
                                updateCondition(condition.id, { 
                                  value: fieldType === 'number' ? Number(e.target.value) : e.target.value 
                                })
                              }
                              placeholder="Saisir la valeur..."
                            />
                          )}
                        </div>

                        {/* Remove */}
                        <div className="flex items-end">
                          <Button 
                            onClick={() => removeCondition(condition.id)}
                            variant="outline"
                            size="sm"
                            disabled={conditions.length === 1}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Aperçu du Segment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {segmentPreview.estimatedSize.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  contacts correspondants
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Âge moyen</span>
                  <span className="font-medium">{segmentPreview.demographics.avgAge} ans</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Pays principal</span>
                  <span className="font-medium">{segmentPreview.demographics.topCountry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Dépense moyenne</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat('fr-FR', { 
                      style: 'currency', 
                      currency: 'EUR' 
                    }).format(segmentPreview.demographics.avgSpent)}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Badge variant="secondary" className="w-full justify-center">
                  {((segmentPreview.estimatedSize / Math.max(contacts.length, 1)) * 100).toFixed(1)}% 
                  du total des contacts
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={handleSaveSegment} className="w-full gap-2">
                <Save className="h-4 w-4" />
                Sauvegarder le Segment
              </Button>
              
              <Button variant="outline" className="w-full gap-2">
                <Mail className="h-4 w-4" />
                Créer Campagne Email
              </Button>
              
              <Button variant="outline" className="w-full gap-2">
                <Filter className="h-4 w-4" />
                Exporter Contacts
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}