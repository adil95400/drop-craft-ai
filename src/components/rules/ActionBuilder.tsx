import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, GripVertical, Ban, Check, FolderTree } from 'lucide-react'
import type { RuleAction, ActionType, FieldType } from '@/lib/rules/ruleTypes'
import { PRODUCT_FIELDS, ACTIONS_BY_TYPE, GLOBAL_ACTIONS } from '@/lib/rules/ruleTypes'

interface ActionBuilderProps {
  action: RuleAction
  onChange: (action: RuleAction) => void
  onRemove: () => void
}

// Get all available actions
const getAllActions = () => {
  const fieldActions: { value: ActionType; label: string; description: string }[] = []
  
  // Merge actions from all types (remove duplicates)
  const seenActions = new Set<ActionType>()
  
  Object.values(ACTIONS_BY_TYPE).forEach(actions => {
    actions.forEach(action => {
      if (!seenActions.has(action.value)) {
        seenActions.add(action.value)
        fieldActions.push(action)
      }
    })
  })

  return fieldActions
}

export function ActionBuilder({ action, onChange, onRemove }: ActionBuilderProps) {
  const isGlobalAction = action.targetField === '_global'
  const allActions = getAllActions()
  
  const selectedField = PRODUCT_FIELDS.find(f => f.id === action.targetField)
  const fieldType: FieldType = selectedField?.type || 'string'
  const fieldActions = ACTIONS_BY_TYPE[fieldType] || ACTIONS_BY_TYPE.string

  const handleTypeChange = (type: ActionType) => {
    const isGlobal = GLOBAL_ACTIONS.some(a => a.value === type)
    onChange({
      ...action,
      type,
      targetField: isGlobal ? '_global' : action.targetField === '_global' ? 'title' : action.targetField,
      value: undefined,
      options: undefined
    })
  }

  const handleTargetFieldChange = (fieldId: string) => {
    const field = PRODUCT_FIELDS.find(f => f.id === fieldId)
    const newFieldType = field?.type || 'string'
    const availableActions = ACTIONS_BY_TYPE[newFieldType]
    
    // Check if current action is valid for new field type
    const actionValid = availableActions.some(a => a.value === action.type)
    
    onChange({
      ...action,
      targetField: fieldId,
      type: actionValid ? action.type : availableActions[0].value
    })
  }

  const handleValueChange = (value: string) => {
    onChange({
      ...action,
      value: value
    })
  }

  const handleOptionsChange = (key: string, value: any) => {
    onChange({
      ...action,
      options: {
        ...action.options,
        [key]: value
      }
    })
  }

  // Determine which value input to show based on action type
  const renderValueInput = () => {
    switch (action.type) {
      case 'exclude_product':
      case 'include_product':
        return null

      case 'set_value':
      case 'append_text':
      case 'prepend_text':
      case 'remove_text':
        return (
          <div className="col-span-4">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Valeur</Label>
            <Input
              value={action.value as string ?? ''}
              onChange={(e) => handleValueChange(e.target.value)}
              placeholder="Entrer la valeur ({field} pour variable)"
            />
          </div>
        )

      case 'replace_text':
        return (
          <>
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground mb-1.5 block">Rechercher</Label>
              <Input
                value={action.options?.pattern ?? ''}
                onChange={(e) => handleOptionsChange('pattern', e.target.value)}
                placeholder="Texte à remplacer"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground mb-1.5 block">Remplacer par</Label>
              <Input
                value={action.value as string ?? ''}
                onChange={(e) => handleValueChange(e.target.value)}
                placeholder="Nouveau texte"
              />
            </div>
          </>
        )

      case 'truncate':
        return (
          <div className="col-span-4">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Longueur max</Label>
            <Input
              type="number"
              value={action.value as number ?? 100}
              onChange={(e) => handleValueChange(e.target.value)}
              min={1}
            />
          </div>
        )

      case 'round_number':
        return (
          <div className="col-span-4">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Décimales</Label>
            <Input
              type="number"
              value={action.value as number ?? 2}
              onChange={(e) => handleValueChange(e.target.value)}
              min={0}
              max={10}
            />
          </div>
        )

      case 'add_value':
      case 'subtract_value':
      case 'multiply_value':
      case 'divide_value':
        return (
          <>
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground mb-1.5 block">Champ source</Label>
              <Select 
                value={action.options?.sourceField ?? action.targetField}
                onValueChange={(v) => handleOptionsChange('sourceField', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_FIELDS.filter(f => f.type === 'number').map(field => (
                    <SelectItem key={field.id} value={field.id}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                {action.type === 'multiply_value' || action.type === 'divide_value' ? 'Facteur' : 'Montant'}
              </Label>
              <Input
                type="number"
                value={action.value as number ?? 0}
                onChange={(e) => handleValueChange(e.target.value)}
                step={action.type === 'multiply_value' || action.type === 'divide_value' ? '0.01' : '1'}
              />
            </div>
          </>
        )

      case 'set_category':
        return (
          <div className="col-span-4">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Catégorie Google</Label>
            <Input
              value={action.value as string ?? ''}
              onChange={(e) => handleValueChange(e.target.value)}
              placeholder="Ex: Vêtements > Chaussures > Baskets"
            />
          </div>
        )

      case 'combine_fields':
        return (
          <>
            <div className="col-span-3">
              <Label className="text-xs text-muted-foreground mb-1.5 block">Champs à combiner</Label>
              <Input
                value={action.options?.fields?.join(', ') ?? ''}
                onChange={(e) => handleOptionsChange('fields', e.target.value.split(',').map(s => s.trim()))}
                placeholder="brand, title, color"
              />
            </div>
            <div className="col-span-1">
              <Label className="text-xs text-muted-foreground mb-1.5 block">Séparateur</Label>
              <Input
                value={action.options?.separator ?? ' '}
                onChange={(e) => handleOptionsChange('separator', e.target.value)}
                placeholder=" - "
              />
            </div>
          </>
        )

      default:
        return null
    }
  }

  const getActionIcon = () => {
    switch (action.type) {
      case 'exclude_product':
        return <Ban className="h-4 w-4 text-destructive" />
      case 'include_product':
        return <Check className="h-4 w-4 text-green-500" />
      case 'set_category':
        return <FolderTree className="h-4 w-4 text-primary" />
      default:
        return null
    }
  }

  return (
    <Card className="relative group">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex items-center h-9 text-muted-foreground cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-4 w-4" />
          </div>

          <div className="flex-1 grid grid-cols-12 gap-3">
            {/* Action type selector */}
            <div className="col-span-4">
              <Label className="text-xs text-muted-foreground mb-1.5 block">Action</Label>
              <Select value={action.type} onValueChange={handleTypeChange as any}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    {getActionIcon()}
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Actions globales
                  </div>
                  {GLOBAL_ACTIONS.map(a => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">
                    Transformations
                  </div>
                  {allActions.map(a => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target field (not for global actions) */}
            {!isGlobalAction && (
              <div className="col-span-3">
                <Label className="text-xs text-muted-foreground mb-1.5 block">Champ cible</Label>
                <Select value={action.targetField} onValueChange={handleTargetFieldChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_FIELDS.map(field => (
                      <SelectItem key={field.id} value={field.id}>
                        {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Value inputs */}
            {renderValueInput()}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-9 w-9 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
