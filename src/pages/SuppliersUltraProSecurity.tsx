import { AppLayout } from "@/layouts/AppLayout";
import { SupplierSecurityDashboard } from "@/components/suppliers/SupplierSecurityDashboard";
import { SecureCustomersList } from "@/components/customers/SecureCustomersList";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, CheckCircle } from "lucide-react";

export default function SuppliersUltraProSecurity() {
  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="h-8 w-8 text-green-600" />
          <h1 className="text-3xl font-bold">Sécurité Avancée</h1>
        </div>
        
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Toutes les données clients sont protégées par chiffrement et masquage automatique.
            Les accès sont journalisés pour audit complet.
          </AlertDescription>
        </Alert>
        
        <SupplierSecurityDashboard />
        
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Données Clients Sécurisées</h2>
          <SecureCustomersList />
        </div>
      </div>
    </AppLayout>
  );
}