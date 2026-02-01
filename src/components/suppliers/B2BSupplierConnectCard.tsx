/**
 * B2B Supplier Connect Card
 * Production-ready component for connecting to B2B suppliers
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useB2BSupplierConnector, B2B_SUPPLIERS, type B2BSupplierId } from '@/hooks/suppliers';
import { SUPPLIER_DEFINITIONS } from '@/data/supplierDefinitions';
import { Link2, Check, Loader2, RefreshCw, ExternalLink, Star, Package, Clock } from 'lucide-react';

interface B2BSupplierConnectCardProps {
  supplierId: B2BSupplierId;
  className?: string;
}

export function B2BSupplierConnectCard({ supplierId, className }: B2BSupplierConnectCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  
  const {
    isConnected,
    getConnection,
    connect,
    isConnecting,
    testConnection,
    isTesting,
    syncProducts,
    isSyncing,
    disconnect,
    isDisconnecting,
  } = useB2BSupplierConnector();

  const supplierConfig = B2B_SUPPLIERS[supplierId];
  const supplierDef = SUPPLIER_DEFINITIONS.find(s => s.id === supplierId);
  const connected = isConnected(supplierId);
  const connection = getConnection(supplierId);

  const handleConnect = async () => {
    try {
      await connect({
        supplierId,
        apiKey: credentials.api_key || credentials.app_key,
        apiSecret: credentials.api_secret || credentials.app_secret,
        accessToken: credentials.access_token,
        email: credentials.email,
        partnerId: credentials.partner_id,
      });
      setIsDialogOpen(false);
      setCredentials({});
    } catch {
      // Error handled by hook
    }
  };

  const handleTest = async () => {
    try {
      await testConnection(supplierId);
    } catch {
      // Error handled
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={supplierDef?.logo || '/placeholder.svg'} 
              alt={supplierConfig.name}
              className="w-10 h-10 rounded-lg object-contain bg-muted p-1"
            />
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {supplierConfig.name}
                {supplierDef?.premium && (
                  <Badge variant="secondary" className="text-xs">Premium</Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {supplierDef?.country && `🌍 ${supplierDef.country}`}
              </CardDescription>
            </div>
          </div>
          
          {connected ? (
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              <Check className="w-3 h-3 mr-1" />
              Connecté
            </Badge>
          ) : (
            <Badge variant="outline">Non connecté</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          {supplierDef?.rating && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Star className="w-3 h-3 text-yellow-500" />
              <span>{supplierDef.rating}</span>
            </div>
          )}
          {supplierDef?.productsCount && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Package className="w-3 h-3" />
              <span>{formatProductCount(supplierDef.productsCount)}</span>
            </div>
          )}
          {supplierDef?.shippingTime && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{supplierDef.shippingTime}</span>
            </div>
          )}
        </div>

        {/* Features */}
        {supplierDef?.features && (
          <div className="flex flex-wrap gap-1">
            {supplierDef.features.slice(0, 3).map((feature, i) => (
              <Badge key={i} variant="outline" className="text-xs font-normal">
                {feature}
              </Badge>
            ))}
          </div>
        )}

        {/* Connection info */}
        {connected && connection && (
          <div className="bg-muted/50 rounded-md p-2 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dernière sync:</span>
              <span>{connection.last_sync_at ? new Date(connection.last_sync_at).toLocaleDateString() : 'Jamais'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Statut:</span>
              <span className="capitalize">{connection.connection_status}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {connected ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => syncProducts(supplierId)}
                disabled={isSyncing}
                className="flex-1"
              >
                {isSyncing ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3 mr-1" />
                )}
                Synchroniser
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => disconnect(connection?.id || '')}
                disabled={isDisconnecting}
              >
                Déconnecter
              </Button>
            </>
          ) : (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex-1">
                  <Link2 className="w-3 h-3 mr-1" />
                  Connecter
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <img 
                      src={supplierDef?.logo || '/placeholder.svg'} 
                      alt={supplierConfig.name}
                      className="w-6 h-6 rounded"
                    />
                    Connecter {supplierConfig.name}
                  </DialogTitle>
                  <DialogDescription>
                    Entrez vos identifiants API pour connecter {supplierConfig.name}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  {supplierDef?.setupFields?.map((field) => (
                    <div key={field.name} className="space-y-2">
                      <Label htmlFor={field.name}>
                        {field.label}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      <Input
                        id={field.name}
                        type={field.type}
                        placeholder={field.placeholder}
                        value={credentials[field.name] || ''}
                        onChange={(e) => setCredentials(prev => ({ ...prev, [field.name]: e.target.value }))}
                      />
                    </div>
                  ))}

                  {(!supplierDef?.setupFields || supplierDef.setupFields.length === 0) && (
                    <p className="text-sm text-muted-foreground">
                      Ce fournisseur ne nécessite pas d'identifiants API.
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ExternalLink className="w-3 h-3" />
                    <a 
                      href={`https://developers.${supplierId}.com`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      Obtenir des identifiants API
                    </a>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={handleTest}
                      disabled={isTesting}
                      className="flex-1"
                    >
                      {isTesting && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                      Tester
                    </Button>
                    <Button
                      onClick={handleConnect}
                      disabled={isConnecting}
                      className="flex-1"
                    >
                      {isConnecting && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                      Connecter
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function formatProductCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(0)}M+`;
  if (count >= 1000) return `${(count / 1000).toFixed(0)}K+`;
  return count.toString();
}
