import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ProductRule } from '@/lib/rules/ruleTypes'

interface RuleBuilderProps {
  rule?: ProductRule
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
}

export function RuleBuilder({ rule, open, onOpenChange, onSave }: RuleBuilderProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{rule ? 'Éditer la règle' : 'Nouvelle règle'}</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p className="text-sm text-muted-foreground">Éditeur de règles à implémenter</p>
          <Button onClick={onSave} className="mt-4">Enregistrer</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}