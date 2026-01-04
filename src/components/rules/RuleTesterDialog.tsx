import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ProductRule } from '@/lib/rules/ruleTypes'

interface RuleTesterDialogProps {
  rule: ProductRule
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RuleTesterDialog({ rule, open, onOpenChange }: RuleTesterDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tester la règle: {rule.name}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Testeur de règles à implémenter</p>
      </DialogContent>
    </Dialog>
  )
}