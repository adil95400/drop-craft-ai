/**
 * ImportRulesEngine — Règles pré-import (marges, stock, catégorisation auto)
 */
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Settings2, Plus, Trash2, GripVertical, Zap, DollarSign,
  PackageX, Tag, TrendingUp, Shield, AlertTriangle, Check,
  Copy, Play, Pause
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type RuleCondition = 'price_above' | 'price_below' | 'stock_below' | 'category_is' | 'brand_is' | 'margin_below' | 'no_image' | 'no_description'
type RuleAction = 'set_margin' | 'set_category' | 'skip_product' | 'add_tag' | 'set_status' | 'auto_price' | 'flag_review'

interface ImportRule {
  id: string
  name: string
  enabled: boolean
  condition: RuleCondition
  conditionValue: string
  action: RuleAction
  actionValue: string
  priority: number
}

const conditionOptions: { value: RuleCondition; label: string; icon: any }[] = [
  { value: 'price_above', label: 'Prix supérieur à', icon: DollarSign },
  { value: 'price_below', label: 'Prix inférieur à', icon: DollarSign },
  { value: 'stock_below', label: 'Stock inférieur à', icon: PackageX },
  { value: 'category_is', label: 'Catégorie est', icon: Tag },
  { value: 'brand_is', label: 'Marque est', icon: Tag },
  { value: 'margin_below', label: 'Marge inférieure à (%)', icon: TrendingUp },
  { value: 'no_image', label: 'Sans image', icon: AlertTriangle },
  { value: 'no_description', label: 'Sans description', icon: AlertTriangle },
]

const actionOptions: { value: RuleAction; label: string; icon: any }[] = [
  { value: 'set_margin', label: 'Appliquer marge (%)', icon: TrendingUp },
  { value: 'set_category', label: 'Assigner catégorie', icon: Tag },
  { value: 'skip_product', label: 'Exclure du catalogue', icon: PackageX },
  { value: 'add_tag', label: 'Ajouter tag', icon: Tag },
  { value: 'set_status', label: 'Définir statut', icon: Shield },
  { value: 'auto_price', label: 'Auto-pricing IA', icon: Zap },
  { value: 'flag_review', label: 'Marquer pour révision', icon: AlertTriangle },
]

const defaultRules: ImportRule[] = [
  { id: '1', name: 'Marge minimum 30%', enabled: true, condition: 'margin_below', conditionValue: '30', action: 'set_margin', actionValue: '35', priority: 1 },
  { id: '2', name: 'Exclure stock 0', enabled: true, condition: 'stock_below', conditionValue: '1', action: 'skip_product', actionValue: '', priority: 2 },
  { id: '3', name: 'Réviser sans image', enabled: true, condition: 'no_image', conditionValue: '', action: 'flag_review', actionValue: '', priority: 3 },
  { id: '4', name: 'Auto-pricing premium', enabled: false, condition: 'price_above', conditionValue: '100', action: 'auto_price', actionValue: 'premium', priority: 4 },
]

interface ImportRulesEngineProps {
  className?: string
}

export function ImportRulesEngine({ className }: ImportRulesEngineProps) {
  const [rules, setRules] = useState<ImportRule[]>(defaultRules)
  const [isRunning, setIsRunning] = useState(false)

  const addRule = () => {
    const newRule: ImportRule = {
      id: crypto.randomUUID(),
      name: 'Nouvelle règle',
      enabled: true,
      condition: 'price_below',
      conditionValue: '',
      action: 'add_tag',
      actionValue: '',
      priority: rules.length + 1,
    }
    setRules(prev => [...prev, newRule])
  }

  const updateRule = (id: string, updates: Partial<ImportRule>) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))
  }

  const deleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id))
  }

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))
  }

  const activeCount = rules.filter(r => r.enabled).length

  const handleRun = () => {
    setIsRunning(true)
    toast.success(`${activeCount} règles appliquées au prochain import`)
    setTimeout(() => setIsRunning(false), 1500)
  }

  const needsValue = (condition: RuleCondition) => !['no_image', 'no_description'].includes(condition)
  const needsActionValue = (action: RuleAction) => !['skip_product', 'flag_review'].includes(action)

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings2 className="w-5 h-5 text-primary" />
              Moteur de règles pré-import
              <Badge variant="secondary" className="text-[10px]">
                {activeCount}/{rules.length} actives
              </Badge>
            </CardTitle>
            <CardDescription>
              Appliquez automatiquement des règles à chaque produit importé
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={addRule}>
              <Plus className="w-4 h-4 mr-1" /> Ajouter
            </Button>
            <Button size="sm" onClick={handleRun} disabled={activeCount === 0 || isRunning}>
              {isRunning ? <Pause className="w-4 h-4 mr-1 animate-pulse" /> : <Play className="w-4 h-4 mr-1" />}
              Appliquer
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="max-h-[500px]">
          <div className="space-y-3">
            {rules.map((rule) => {
              const condConfig = conditionOptions.find(c => c.value === rule.condition)
              const actConfig = actionOptions.find(a => a.value === rule.action)
              const CondIcon = condConfig?.icon || Zap
              const ActIcon = actConfig?.icon || Zap

              return (
                <div
                  key={rule.id}
                  className={cn(
                    'border rounded-xl p-4 transition-all',
                    rule.enabled ? 'bg-card' : 'bg-muted/30 opacity-60'
                  )}
                >
                  {/* Rule header */}
                  <div className="flex items-center gap-3 mb-3">
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab shrink-0" />
                    <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
                    <Input
                      value={rule.name}
                      onChange={e => updateRule(rule.id, { name: e.target.value })}
                      className="h-7 text-sm font-medium border-none shadow-none px-1 bg-transparent"
                    />
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => deleteRule(rule.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                  </div>

                  {/* Condition → Action */}
                  <div className="grid grid-cols-[1fr,auto,1fr] gap-3 items-end">
                    {/* Condition */}
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <CondIcon className="w-3 h-3" /> SI
                      </Label>
                      <Select value={rule.condition} onValueChange={v => updateRule(rule.id, { condition: v as RuleCondition })}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {conditionOptions.map(c => (
                            <SelectItem key={c.value} value={c.value} className="text-xs">{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {needsValue(rule.condition) && (
                        <Input
                          value={rule.conditionValue}
                          onChange={e => updateRule(rule.id, { conditionValue: e.target.value })}
                          placeholder="Valeur..."
                          className="h-7 text-xs"
                        />
                      )}
                    </div>

                    <div className="flex items-center pb-1">
                      <Badge variant="outline" className="text-[9px] px-2 py-0.5">ALORS</Badge>
                    </div>

                    {/* Action */}
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <ActIcon className="w-3 h-3" /> ACTION
                      </Label>
                      <Select value={rule.action} onValueChange={v => updateRule(rule.id, { action: v as RuleAction })}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {actionOptions.map(a => (
                            <SelectItem key={a.value} value={a.value} className="text-xs">{a.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {needsActionValue(rule.action) && (
                        <Input
                          value={rule.actionValue}
                          onChange={e => updateRule(rule.id, { actionValue: e.target.value })}
                          placeholder="Valeur..."
                          className="h-7 text-xs"
                        />
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {rules.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Settings2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Aucune règle configurée
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
