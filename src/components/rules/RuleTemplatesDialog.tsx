import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RULE_TEMPLATES } from '@/lib/rules/ruleTypes'

interface RuleTemplatesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectTemplate: (templateId: string) => void
}

export function RuleTemplatesDialog({ open, onOpenChange, onSelectTemplate }: RuleTemplatesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Templates de règles</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {RULE_TEMPLATES.map(template => (
            <div key={template.id} className="p-3 border rounded">
              <h3 className="font-semibold">{template.name}</h3>
              <p className="text-sm text-muted-foreground">{template.description}</p>
              <Button size="sm" className="mt-2" onClick={() => onSelectTemplate(template.id)}>
                Utiliser ce template
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}