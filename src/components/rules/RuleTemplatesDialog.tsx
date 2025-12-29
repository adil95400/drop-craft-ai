import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { RULE_TEMPLATES } from '@/lib/rules/ruleTypes'
import { FileText, Sparkles, Tag, DollarSign, AlertTriangle, Check } from 'lucide-react'

interface RuleTemplatesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectTemplate: (templateId: string) => void
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'SEO':
      return <Sparkles className="h-4 w-4 text-primary" />
    case 'Contenu':
      return <FileText className="h-4 w-4 text-info" />
    case 'Gestion Stock':
      return <Tag className="h-4 w-4 text-warning" />
    case 'Pricing':
      return <DollarSign className="h-4 w-4 text-success" />
    case 'Qualité':
      return <AlertTriangle className="h-4 w-4 text-destructive" />
    default:
      return <FileText className="h-4 w-4" />
  }
}

const getChannelColor = (channel: string) => {
  switch (channel) {
    case 'google':
      return 'bg-blue-500'
    case 'meta':
      return 'bg-indigo-500'
    case 'amazon':
      return 'bg-orange-500'
    case 'tiktok':
      return 'bg-pink-500'
    default:
      return 'bg-gray-500'
  }
}

export function RuleTemplatesDialog({ open, onOpenChange, onSelectTemplate }: RuleTemplatesDialogProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleSelect = (templateId: string) => {
    setSelectedId(templateId)
  }

  const handleConfirm = () => {
    if (selectedId) {
      onSelectTemplate(selectedId)
      setSelectedId(null)
    }
  }

  const categories = [...new Set(RULE_TEMPLATES.map(t => t.category))]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Templates de règles
          </DialogTitle>
          <DialogDescription>
            Choisissez un template pré-configuré pour démarrer rapidement
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {categories.map(category => (
              <div key={category}>
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  {getCategoryIcon(category)}
                  {category}
                </h3>
                <div className="grid gap-3">
                  {RULE_TEMPLATES.filter(t => t.category === category).map(template => (
                    <Card 
                      key={template.id}
                      className={`p-4 cursor-pointer transition-all hover:border-primary ${
                        selectedId === template.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : ''
                      }`}
                      onClick={() => handleSelect(template.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{template.name}</h4>
                            <Badge 
                              variant="secondary" 
                              className={`text-xs text-white ${getChannelColor(template.channel)}`}
                            >
                              {template.channel}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                          
                          {/* Aperçu de la règle */}
                          <div className="mt-3 text-xs space-y-1">
                            {template.rule.conditionGroup?.conditions?.[0] && (
                              <div className="flex items-center gap-1">
                                <Badge variant="outline" className="text-xs">SI</Badge>
                                <span>
                                  {template.rule.conditionGroup.conditions[0].field}{' '}
                                  {template.rule.conditionGroup.conditions[0].operator}{' '}
                                  {template.rule.conditionGroup.conditions[0].value}
                                </span>
                              </div>
                            )}
                            {template.rule.actions?.[0] && (
                              <div className="flex items-center gap-1">
                                <Badge variant="outline" className="text-xs">ALORS</Badge>
                                <span>
                                  {template.rule.actions[0].type} sur {template.rule.actions[0].field}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        {selectedId === template.id && (
                          <Check className="h-5 w-5 text-primary flex-shrink-0" />
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedId}>
            <Sparkles className="h-4 w-4 mr-2" />
            Utiliser ce template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
