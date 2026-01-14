import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, GripVertical } from 'lucide-react'
import type { RuleCondition, FieldType } from '@/lib/rules/ruleTypes'
import { PRODUCT_FIELDS, OPERATORS_BY_TYPE } from '@/lib/rules/ruleTypes'

interface ConditionBuilderProps {
  condition: RuleCondition
  onChange: (condition: RuleCondition) => void
  onRemove: () => void
}

export function ConditionBuilder({ condition, onChange, onRemove }: ConditionBuilderProps) {
  const selectedField = PRODUCT_FIELDS.find(f => f.id === condition.field)
  const fieldType: FieldType = selectedField?.type || 'string'
  const availableOperators = OPERATORS_BY_TYPE[fieldType] || OPERATORS_BY_TYPE.string

  const handleFieldChange = (fieldId: string) => {
    const field = PRODUCT_FIELDS.find(f => f.id === fieldId)
    const newFieldType = field?.type || 'string'
    const newOperators = OPERATORS_BY_TYPE[newFieldType]
    
    // Reset operator if not valid for new field type
    const operatorValid = newOperators.some(o => o.value === condition.operator)
    
    onChange({
      ...condition,
      field: fieldId,
      operator: operatorValid ? condition.operator : newOperators[0].value,
      value: ''
    })
  }

  const handleOperatorChange = (operator: string) => {
    onChange({
      ...condition,
      operator: operator as RuleCondition['operator']
    })
  }

  const handleValueChange = (value: string) => {
    onChange({
      ...condition,
      value: fieldType === 'number' ? (value === '' ? '' : Number(value)) : value
    })
  }

  const handleCaseSensitiveChange = (caseSensitive: boolean) => {
    onChange({
      ...condition,
      caseSensitive
    })
  }

  const needsValue = !['is_empty', 'is_not_empty'].includes(condition.operator)
  const showCaseSensitive = fieldType === 'string' && needsValue

  return (
    <Card className="relative group">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex items-center h-9 text-muted-foreground cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-4 w-4" />
          </div>

          <div className="flex-1 grid grid-cols-12 gap-3">
            {/* Field selector */}
            <div className="col-span-4">
              <Label className="text-xs text-muted-foreground mb-1.5 block">Champ</Label>
              <Select value={condition.field} onValueChange={handleFieldChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un champ" />
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

            {/* Operator selector */}
            <div className="col-span-3">
              <Label className="text-xs text-muted-foreground mb-1.5 block">Opérateur</Label>
              <Select value={condition.operator} onValueChange={handleOperatorChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableOperators.map(op => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Value input */}
            {needsValue && (
              <div className="col-span-4">
                <Label className="text-xs text-muted-foreground mb-1.5 block">Valeur</Label>
                <Input
                  type={fieldType === 'number' ? 'number' : 'text'}
                  value={condition.value as string}
                  onChange={(e) => handleValueChange(e.target.value)}
                  placeholder={
                    condition.operator === 'in_list' 
                      ? 'valeur1, valeur2, valeur3'
                      : condition.operator === 'matches_regex'
                        ? '^[A-Z].*'
                        : 'Entrer une valeur'
                  }
                />
              </div>
            )}

            {/* Case sensitive toggle */}
            {showCaseSensitive && (
              <div className="col-span-1 flex flex-col justify-end">
                <div className="flex items-center gap-1.5 h-9">
                  <Switch
                    id={`case-${condition.id}`}
                    checked={condition.caseSensitive ?? false}
                    onCheckedChange={handleCaseSensitiveChange}
                  />
                  <Label 
                    htmlFor={`case-${condition.id}`} 
                    className="text-xs text-muted-foreground cursor-pointer"
                    title="Respecter la casse"
                  >
                    Aa
                  </Label>
                </div>
              </div>
            )}
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
