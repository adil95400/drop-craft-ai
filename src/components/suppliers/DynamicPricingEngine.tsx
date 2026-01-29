import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { toast } from 'sonner'
import { 
  TrendingUp, 
  DollarSign, 
  Percent, 
  Target,
  Save,
  RefreshCw,
  AlertCircle
} from 'lucide-react'

interface PricingRule {
  id: string
  supplier_id: string
  supplier_name: string
  pricing_strategy: 'fixed_markup' | 'target_margin' | 'competitive'
  fixed_markup_percentage?: number
  target_margin_percentage?: number
  minimum_price?: number
  maximum_price?: number
  auto_update: boolean
  last_updated: string
  products_count: number
}

// Mock data for pricing rules
const generateMockPricingRules = (): PricingRule[] => {
  return [
    {
      id: 'pr-1',
      supplier_id: 'sup-1',
      supplier_name: 'Fournisseur Principal',
      pricing_strategy: 'fixed_markup',
      fixed_markup_percentage: 25,
      minimum_price: 5,
      maximum_price: 500,
      auto_update: true,
      last_updated: new Date().toISOString(),
      products_count: 150
    },
    {
      id: 'pr-2',
      supplier_id: 'sup-2',
      supplier_name: 'Grossiste Europe',
      pricing_strategy: 'target_margin',
      target_margin_percentage: 30,
      minimum_price: 10,
      maximum_price: 1000,
      auto_update: false,
      last_updated: new Date(Date.now() - 86400000).toISOString(),
      products_count: 85
    },
    {
      id: 'pr-3',
      supplier_id: 'sup-3',
      supplier_name: 'BTSWholesaler',
      pricing_strategy: 'competitive',
      fixed_markup_percentage: 20,
      minimum_price: 1,
      auto_update: true,
      last_updated: new Date(Date.now() - 172800000).toISOString(),
      products_count: 320
    }
  ]
}

export function DynamicPricingEngine() {
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingRule, setEditingRule] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<PricingRule>>({})

  useEffect(() => {
    loadPricingRules()
  }, [])

  const loadPricingRules = async () => {
    try {
      // Load from localStorage or use mock data
      const stored = localStorage.getItem('supplier_pricing_rules')
      if (stored) {
        setPricingRules(JSON.parse(stored))
      } else {
        const mockRules = generateMockPricingRules()
        setPricingRules(mockRules)
        localStorage.setItem('supplier_pricing_rules', JSON.stringify(mockRules))
      }
    } catch (error) {
      console.error('Error loading pricing rules:', error)
      toast.error('Erreur lors du chargement des règles de prix')
    } finally {
      setIsLoading(false)
    }
  }

  const startEdit = (rule: PricingRule) => {
    setEditingRule(rule.id)
    setEditValues({
      pricing_strategy: rule.pricing_strategy,
      fixed_markup_percentage: rule.fixed_markup_percentage,
      target_margin_percentage: rule.target_margin_percentage,
      minimum_price: rule.minimum_price,
      maximum_price: rule.maximum_price,
      auto_update: rule.auto_update
    })
  }

  const cancelEdit = () => {
    setEditingRule(null)
    setEditValues({})
  }

  const saveRule = async (ruleId: string) => {
    try {
      const updatedRules = pricingRules.map(r => 
        r.id === ruleId 
          ? { ...r, ...editValues, last_updated: new Date().toISOString() }
          : r
      )
      setPricingRules(updatedRules)
      localStorage.setItem('supplier_pricing_rules', JSON.stringify(updatedRules))
      
      toast.success('Règle de prix mise à jour')
      setEditingRule(null)
      setEditValues({})
    } catch (error) {
      console.error('Error saving pricing rule:', error)
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const toggleAutoUpdate = async (ruleId: string, currentValue: boolean) => {
    try {
      const updatedRules = pricingRules.map(r => 
        r.id === ruleId 
          ? { ...r, auto_update: !currentValue, last_updated: new Date().toISOString() }
          : r
      )
      setPricingRules(updatedRules)
      localStorage.setItem('supplier_pricing_rules', JSON.stringify(updatedRules))
      
      toast.success('Mise à jour automatique ' + (!currentValue ? 'activée' : 'désactivée'))
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const getStrategyBadge = (strategy: string) => {
    switch (strategy) {
      case 'fixed_markup':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            <Percent className="h-3 w-3 mr-1" />
            Marge fixe
          </Badge>
        )
      case 'target_margin':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <Target className="h-3 w-3 mr-1" />
            Marge cible
          </Badge>
        )
      case 'competitive':
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700">
            <TrendingUp className="h-3 w-3 mr-1" />
            Compétitif
          </Badge>
        )
      default:
        return <Badge variant="outline">{strategy}</Badge>
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Moteur de Prix Dynamique
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadPricingRules}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border bg-blue-50 dark:bg-blue-950/20">
            <p className="text-sm text-muted-foreground">Règles actives</p>
            <p className="text-2xl font-bold text-blue-600">
              {pricingRules.filter(r => r.auto_update).length}
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950/20">
            <p className="text-sm text-muted-foreground">Marge moyenne</p>
            <p className="text-2xl font-bold text-green-600">
              {pricingRules.length > 0
                ? (pricingRules.reduce((sum, r) => 
                    sum + (r.fixed_markup_percentage || r.target_margin_percentage || 0), 0
                  ) / pricingRules.length).toFixed(1)
                : 0}%
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-purple-50 dark:bg-purple-950/20">
            <p className="text-sm text-muted-foreground">Fournisseurs</p>
            <p className="text-2xl font-bold text-purple-600">
              {pricingRules.length}
            </p>
          </div>
        </div>

        {/* Info banner */}
        <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Prix recalculés automatiquement
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              Les règles avec mise à jour automatique activée mettent à jour les prix dès que les coûts changent
            </p>
          </div>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fournisseur</TableHead>
              <TableHead>Stratégie</TableHead>
              <TableHead>Marge</TableHead>
              <TableHead>Prix Min/Max</TableHead>
              <TableHead>Auto-Update</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pricingRules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Aucune règle de prix configurée
                </TableCell>
              </TableRow>
            ) : (
              pricingRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.supplier_name}</TableCell>
                  <TableCell>
                    {editingRule === rule.id ? (
                      <Select 
                        value={editValues.pricing_strategy} 
                        onValueChange={(v) => setEditValues({ ...editValues, pricing_strategy: v as any })}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed_markup">Marge fixe</SelectItem>
                          <SelectItem value="target_margin">Marge cible</SelectItem>
                          <SelectItem value="competitive">Compétitif</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      getStrategyBadge(rule.pricing_strategy)
                    )}
                  </TableCell>
                  <TableCell>
                    {editingRule === rule.id ? (
                      <div className="flex gap-2 items-center">
                        <Input
                          type="number"
                          className="w-20"
                          value={editValues.fixed_markup_percentage || editValues.target_margin_percentage || ''}
                          onChange={(e) => setEditValues({ 
                            ...editValues, 
                            [editValues.pricing_strategy === 'target_margin' 
                              ? 'target_margin_percentage' 
                              : 'fixed_markup_percentage'
                            ]: parseFloat(e.target.value)
                          })}
                        />
                        <span>%</span>
                      </div>
                    ) : (
                      <span className="font-bold">
                        {rule.fixed_markup_percentage || rule.target_margin_percentage || 0}%
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingRule === rule.id ? (
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          className="w-20"
                          placeholder="Min"
                          value={editValues.minimum_price || ''}
                          onChange={(e) => setEditValues({ 
                            ...editValues, 
                            minimum_price: parseFloat(e.target.value)
                          })}
                        />
                        <Input
                          type="number"
                          className="w-20"
                          placeholder="Max"
                          value={editValues.maximum_price || ''}
                          onChange={(e) => setEditValues({ 
                            ...editValues, 
                            maximum_price: parseFloat(e.target.value)
                          })}
                        />
                      </div>
                    ) : (
                      <span className="text-sm">
                        {rule.minimum_price ? `${rule.minimum_price}€` : '-'} / {rule.maximum_price ? `${rule.maximum_price}€` : '-'}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingRule === rule.id ? (
                      <Switch
                        checked={editValues.auto_update}
                        onCheckedChange={(checked) => setEditValues({ ...editValues, auto_update: checked })}
                      />
                    ) : (
                      <Switch
                        checked={rule.auto_update}
                        onCheckedChange={() => toggleAutoUpdate(rule.id, rule.auto_update)}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {editingRule === rule.id ? (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveRule(rule.id)}>
                          <Save className="h-4 w-4 mr-1" />
                          Sauver
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}>
                          Annuler
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => startEdit(rule)}>
                        Modifier
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}