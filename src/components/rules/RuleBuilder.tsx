import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ProductRule, RuleChannel, RulePriority, RuleOperator, RuleActionType } from '@/lib/rules/ruleTypes'
import { Save, Plus, Trash2, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { useQueryClient } from '@tanstack/react-query'

interface RuleBuilderProps {
  rule?: ProductRule
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
}

const OPERATORS: { value: RuleOperator; label: string }[] = [
  { value: 'eq', label: 'Égal à' },
  { value: 'ne', label: 'Différent de' },
  { value: 'lt', label: 'Inférieur à' },
  { value: 'gt', label: 'Supérieur à' },
  { value: 'contains', label: 'Contient' },
  { value: 'not_contains', label: 'Ne contient pas' },
  { value: 'empty', label: 'Est vide' },
  { value: 'not_empty', label: "N'est pas vide" },
  { value: 'starts_with', label: 'Commence par' },
  { value: 'ends_with', label: 'Finit par' },
]

const ACTIONS: { value: RuleActionType; label: string }[] = [
  { value: 'set_field', label: 'Définir valeur' },
  { value: 'append_text', label: 'Ajouter texte' },
  { value: 'prepend_text', label: 'Préfixer texte' },
  { value: 'replace_text', label: 'Remplacer texte' },
  { value: 'uppercase', label: 'Majuscules' },
  { value: 'lowercase', label: 'Minuscules' },
  { value: 'add_tag', label: 'Ajouter tag' },
  { value: 'remove_tag', label: 'Supprimer tag' },
  { value: 'generate_ai', label: 'Générer avec IA' },
]

const FIELDS = [
  'name', 'description', 'price', 'compare_at_price', 'category', 
  'brand', 'stock_quantity', 'sku', 'tags', 'seo_title', 'seo_description'
]

const CHANNELS: { value: RuleChannel; label: string }[] = [
  { value: 'global', label: 'Global' },
  { value: 'google', label: 'Google Shopping' },
  { value: 'meta', label: 'Meta/Facebook' },
  { value: 'tiktok', label: 'TikTok Shop' },
  { value: 'amazon', label: 'Amazon' },
  { value: 'shopify', label: 'Shopify' },
]

export function RuleBuilder({ rule, open, onOpenChange, onSave }: RuleBuilderProps) {
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    enabled: true,
    priority: 3 as RulePriority,
    channel: 'global' as RuleChannel,
    conditionField: 'name',
    conditionOperator: 'contains' as RuleOperator,
    conditionValue: '',
    actionType: 'set_field' as RuleActionType,
    actionField: 'name',
    actionValue: '',
  })

  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name || '',
        description: rule.description || '',
        enabled: rule.enabled,
        priority: rule.priority,
        channel: rule.channel,
        conditionField: rule.conditionGroup?.conditions?.[0]?.field || 'name',
        conditionOperator: rule.conditionGroup?.conditions?.[0]?.operator || 'contains',
        conditionValue: rule.conditionGroup?.conditions?.[0]?.value || '',
        actionType: rule.actions?.[0]?.type || 'set_field',
        actionField: rule.actions?.[0]?.field || 'name',
        actionValue: rule.actions?.[0]?.value || '',
      })
    } else {
      setFormData({
        name: '',
        description: '',
        enabled: true,
        priority: 3,
        channel: 'global',
        conditionField: 'name',
        conditionOperator: 'contains',
        conditionValue: '',
        actionType: 'set_field',
        actionField: 'name',
        actionValue: '',
      })
    }
  }, [rule, open])

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Le nom de la règle est requis')
      return
    }

    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const ruleData = {
        name: formData.name,
        description: formData.description,
        is_active: formData.enabled,
        priority: formData.priority,
        channel: formData.channel,
        condition_group: {
          logic: 'AND',
          conditions: [{
            id: '1',
            field: formData.conditionField,
            operator: formData.conditionOperator,
            value: formData.conditionValue
          }]
        },
        actions: [{
          id: '1',
          type: formData.actionType,
          field: formData.actionField,
          value: formData.actionValue
        }],
        user_id: user.id
      }

      if (rule?.id) {
        const { error } = await (supabase.from('pricing_rules') as any)
          .update(ruleData)
          .eq('id', rule.id)
        if (error) throw error
        toast.success('Règle mise à jour')
      } else {
        const { error } = await (supabase.from('pricing_rules') as any)
          .insert(ruleData)
        if (error) throw error
        toast.success('Règle créée')
      }

      queryClient.invalidateQueries({ queryKey: ['product-rules'] })
      onSave()
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving rule:', error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            {rule ? 'Éditer la règle' : 'Nouvelle règle'}
          </DialogTitle>
          <DialogDescription>
            Configurez les conditions et actions de votre règle d'automatisation
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Infos générales */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de la règle *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Optimiser titres longs"
                />
              </div>
              <div className="space-y-2">
                <Label>Canal</Label>
                <Select 
                  value={formData.channel} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, channel: v as RuleChannel }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANNELS.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Décrivez ce que fait cette règle..."
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.enabled}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
                />
                <Label>Activer la règle</Label>
              </div>
              <div className="flex items-center gap-2">
                <Label>Priorité:</Label>
                <Select 
                  value={String(formData.priority)} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, priority: Number(v) as RulePriority }))}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(p => (
                      <SelectItem key={p} value={String(p)}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Condition */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Badge variant="outline">SI</Badge>
              Condition
            </h4>
            <div className="grid grid-cols-3 gap-3 p-4 bg-muted/50 rounded-lg">
              <Select 
                value={formData.conditionField} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, conditionField: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Champ" />
                </SelectTrigger>
                <SelectContent>
                  {FIELDS.map(f => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={formData.conditionOperator} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, conditionOperator: v as RuleOperator }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Opérateur" />
                </SelectTrigger>
                <SelectContent>
                  {OPERATORS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                value={formData.conditionValue}
                onChange={(e) => setFormData(prev => ({ ...prev, conditionValue: e.target.value }))}
                placeholder="Valeur"
              />
            </div>
          </div>

          <Separator />

          {/* Action */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Badge variant="outline">ALORS</Badge>
              Action
            </h4>
            <div className="grid grid-cols-3 gap-3 p-4 bg-muted/50 rounded-lg">
              <Select 
                value={formData.actionType} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, actionType: v as RuleActionType }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIONS.map(a => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={formData.actionField} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, actionField: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Champ" />
                </SelectTrigger>
                <SelectContent>
                  {FIELDS.map(f => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                value={formData.actionValue}
                onChange={(e) => setFormData(prev => ({ ...prev, actionValue: e.target.value }))}
                placeholder="Valeur"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Sauvegarde...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
