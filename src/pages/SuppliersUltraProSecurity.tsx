import { AppLayout } from "@/layouts/AppLayout";
import { SupplierSecurityDashboard } from "@/components/suppliers/SupplierSecurityDashboard";

export default function SuppliersUltraProSecurity() {
  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <SupplierSecurityDashboard />
      </div>
    </AppLayout>
  );
}