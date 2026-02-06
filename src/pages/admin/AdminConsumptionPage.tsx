/**
 * Page Admin - Vue globale de la consommation
 */

import { AdminConsumptionDashboard } from '@/components/consumption';

export default function AdminConsumptionPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Suivi de consommation</h1>
        <p className="text-muted-foreground mt-1">
          Vue globale de la consommation de tous les utilisateurs
        </p>
      </div>
      <AdminConsumptionDashboard />
    </div>
  );
}
