import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Info, Clock } from "lucide-react";
import { ActionModal } from "@/components/common/ActionModal";

interface Alert {
  id: string;
  message: string;
  type: 'warning' | 'info' | 'success' | 'error';
  timestamp: string;
}

interface AIAlertsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alerts?: string[];
}

export function AIAlertsModal({ open, onOpenChange, alerts = [] }: AIAlertsModalProps) {
  const [modalAlerts, setModalAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    if (alerts.length > 0) {
      const formattedAlerts: Alert[] = alerts.map((alert, index) => ({
        id: `alert-${index}`,
        message: alert,
        type: alert.includes('Retard') || alert.includes('baisse') ? 'warning' : 
              alert.includes('prévu') ? 'info' : 'success',
        timestamp: new Date().toLocaleTimeString()
      }));
      setModalAlerts(formattedAlerts);
    }
  }, [alerts]);

  const getIcon = (type: Alert['type']) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-success" />;
      default: return <Info className="h-4 w-4 text-info" />;
    }
  };

  const getBadgeVariant = (type: Alert['type']) => {
    switch (type) {
      case 'warning': return 'destructive';
      case 'error': return 'destructive';
      case 'success': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Alertes IA Prédictives
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {modalAlerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune alerte active détectée</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {modalAlerts.length} alerte{modalAlerts.length > 1 ? 's' : ''} détectée{modalAlerts.length > 1 ? 's' : ''} par l'IA
              </p>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {modalAlerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className="flex items-start gap-3 p-4 border rounded-lg bg-card"
                  >
                    {getIcon(alert.type)}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant={getBadgeVariant(alert.type)} className="text-xs">
                          {alert.type === 'warning' ? 'Attention' : 
                           alert.type === 'error' ? 'Erreur' :
                           alert.type === 'success' ? 'Succès' : 'Info'}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {alert.timestamp}
                        </span>
                      </div>
                      <p className="text-sm">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
            {modalAlerts.length > 0 && (
              <Button onClick={() => {
                // Simuler l'acquittement des alertes
                setModalAlerts([]);
                onOpenChange(false);
              }}>
                Acquitter toutes
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}