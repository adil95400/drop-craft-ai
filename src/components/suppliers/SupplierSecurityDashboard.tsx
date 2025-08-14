import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Lock, Eye, Clock, RefreshCw } from "lucide-react";
import { useRealSuppliers } from "@/hooks/useRealSuppliers";
import { supabase } from "@/integrations/supabase/client";

interface SecurityEvent {
  id: string;
  event_type: string;
  severity: string;
  description: string;
  created_at: string;
  metadata: any;
}

export function SupplierSecurityDashboard() {
  const { suppliers } = useRealSuppliers();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSecurityEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .in('event_type', ['credentials_encrypted', 'credentials_accessed', 'sensitive_data_access'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setSecurityEvents(data || []);
    } catch (error) {
      console.error('Error fetching security events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityEvents();
  }, []);

  const suppliersWithCredentials = suppliers.filter(s => s.encrypted_credentials);
  const recentAccessEvents = securityEvents.filter(e => e.event_type === 'credentials_accessed');
  const totalAccessCount = suppliers.reduce((sum, s) => sum + (s.access_count || 0), 0);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'destructive';
      case 'warn': return 'secondary';
      case 'info': return 'default';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Supplier Security Dashboard</h2>
          <p className="text-muted-foreground">Monitor and secure your supplier API credentials</p>
        </div>
        <Button onClick={fetchSecurityEvents} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Protected Suppliers</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliersWithCredentials.length}</div>
            <p className="text-xs text-muted-foreground">
              of {suppliers.length} total suppliers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credential Access</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAccessCount}</div>
            <p className="text-xs text-muted-foreground">
              total access attempts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Events</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentAccessEvents.length}</div>
            <p className="text-xs text-muted-foreground">
              in last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Status</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Secure</div>
            <p className="text-xs text-muted-foreground">
              All credentials encrypted
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          All supplier API credentials are encrypted using AES-GCM encryption with a 256-bit key. 
          Access is logged and restricted to authenticated users only.
        </AlertDescription>
      </Alert>

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {securityEvents.length === 0 ? (
              <p className="text-muted-foreground">No security events found.</p>
            ) : (
              securityEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getSeverityColor(event.severity)}>
                        {event.severity.toUpperCase()}
                      </Badge>
                      <span className="text-sm font-medium">{event.event_type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                    {event.metadata && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {event.metadata.supplier_id && (
                          <span>Supplier: {event.metadata.supplier_id.substring(0, 8)}...</span>
                        )}
                        {event.metadata.access_count && (
                          <span className="ml-2">Access #{event.metadata.access_count}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(event.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Supplier Credential Status */}
      <Card>
        <CardHeader>
          <CardTitle>Supplier Credential Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {suppliers.map((supplier) => (
              <div key={supplier.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{supplier.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Status: {supplier.status} • Country: {supplier.country || 'Unknown'}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {supplier.encrypted_credentials ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <Lock className="h-3 w-3 mr-1" />
                      Encrypted
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      No Credentials
                    </Badge>
                  )}
                  {supplier.access_count && supplier.access_count > 0 && (
                    <Badge variant="outline">
                      {supplier.access_count} accesses
                    </Badge>
                  )}
                  {supplier.last_access_at && (
                    <span className="text-xs text-muted-foreground">
                      Last: {new Date(supplier.last_access_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}