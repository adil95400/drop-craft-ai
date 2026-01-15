/**
 * Page Gestion des Retours - Optimisée
 * Hub centralisé pour la gestion des retours, automation et analytics
 */
import { ReturnsHub } from '@/components/returns'

export default function ReturnsManagementPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestion des Retours</h1>
        <p className="text-muted-foreground mt-1">
          Gérez les demandes de retour, automatisez les remboursements et analysez les tendances
        </p>
      </div>
      
      <ReturnsHub />
    </div>
  );
}
