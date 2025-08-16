import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Eye, EyeOff } from "lucide-react";
import { useRealCustomers } from '@/hooks/useRealCustomers';
import { useSecureAdmin } from '@/hooks/useSecureAdmin';

export const SecureCustomersList = () => {
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const { customers, isLoading } = useRealCustomers();
  const { isAdmin, logAdminAccess } = useSecureAdmin();

  const handleToggleSensitiveData = async () => {
    if (!showSensitiveData) {
      // Log admin access when showing sensitive data
      await logAdminAccess('customers', 'view_sensitive_data');
    }
    setShowSensitiveData(!showSensitiveData);
  };

  const maskEmail = (email: string) => {
    if (!email) return '';
    const [local, domain] = email.split('@');
    if (!domain) return email;
    return `${local.slice(0, 2)}***@${domain}`;
  };

  const maskPhone = (phone: string) => {
    if (!phone) return '';
    return phone.slice(0, 3) + '****' + phone.slice(-2);
  };

  if (isLoading) {
    return <div>Chargement sécurisé...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-600" />
          Clients Sécurisés
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleSensitiveData}
          className="flex items-center gap-2"
          disabled={!isAdmin}
        >
          {showSensitiveData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showSensitiveData ? 'Masquer' : 'Afficher'} les données
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {customers.map((customer) => (
            <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="font-medium">{customer.name}</div>
                <div className="text-sm text-muted-foreground">
                  Email: {(showSensitiveData && isAdmin) ? customer.email : maskEmail(customer.email)}
                </div>
                {customer.phone && (
                  <div className="text-sm text-muted-foreground">
                    Tél: {(showSensitiveData && isAdmin) ? customer.phone : maskPhone(customer.phone)}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                  {customer.status}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  {customer.total_orders} commandes
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {!showSensitiveData && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-yellow-800">
              <Shield className="h-4 w-4" />
              <span>Les données sensibles sont masquées pour la sécurité</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};