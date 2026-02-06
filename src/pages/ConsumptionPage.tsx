/**
 * Page de consommation utilisateur
 */

import { UserConsumptionDashboard } from '@/components/consumption';

export default function ConsumptionPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Consommation & Abonnement</h1>
        <p className="text-muted-foreground mt-1">
          Suivez votre utilisation et gérez votre abonnement
        </p>
      </div>
      <UserConsumptionDashboard />
    </div>
  );
}
