/**
 * Section des dialogs pour les règles produits
 */

import { memo } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { RuleBuilder } from '@/components/rules/RuleBuilder'
import { RuleTemplatesDialog } from '@/components/rules/RuleTemplatesDialog'
import { RuleTesterDialog } from '@/components/rules/RuleTesterDialog'
import { ProductRule } from '@/lib/rules/ruleTypes'

interface ProductsRulesDialogsProps {
  selectedRule?: ProductRule
  builderOpen: boolean
  onBuilderOpenChange: (open: boolean) => void
  templatesOpen: boolean
  onTemplatesOpenChange: (open: boolean) => void
  testerOpen: boolean
  onTesterOpenChange: (open: boolean) => void
  deleteDialogOpen: boolean
  onDeleteDialogChange: (open: boolean) => void
  onConfirmDelete: () => void
  onSelectTemplate: (templateId: string) => void
  isDeleting: boolean
}

export const ProductsRulesDialogs = memo(function ProductsRulesDialogs({
  selectedRule,
  builderOpen,
  onBuilderOpenChange,
  templatesOpen,
  onTemplatesOpenChange,
  testerOpen,
  onTesterOpenChange,
  deleteDialogOpen,
  onDeleteDialogChange,
  onConfirmDelete,
  onSelectTemplate,
  isDeleting
}: ProductsRulesDialogsProps) {
  return (
    <>
      <RuleBuilder
        rule={selectedRule}
        open={builderOpen}
        onOpenChange={onBuilderOpenChange}
        onSave={() => onBuilderOpenChange(false)}
      />

      <RuleTemplatesDialog
        open={templatesOpen}
        onOpenChange={onTemplatesOpenChange}
        onSelectTemplate={onSelectTemplate}
      />

      {selectedRule && (
        <RuleTesterDialog
          rule={selectedRule}
          open={testerOpen}
          onOpenChange={onTesterOpenChange}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={onDeleteDialogChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la règle ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La règle sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDelete} disabled={isDeleting}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
})
