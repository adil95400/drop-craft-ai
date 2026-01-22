/**
 * Page Gestion des Retours - Style Channable
 * Hub centralisé pour la gestion des retours, automation et analytics
 */
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { ReturnsHub } from '@/components/returns';
import { RotateCcw, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ReturnsManagementPage() {
  return (
    <ChannablePageWrapper
      title="Gestion des Retours"
      subtitle="Après-vente"
      description="Gérez les demandes de retour, automatisez les remboursements et analysez les tendances"
      heroImage="orders"
      badge={{ label: "Retours", icon: RotateCcw }}
      actions={
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau retour
        </Button>
      }
    >
      <ReturnsHub />
    </ChannablePageWrapper>
  );
}
