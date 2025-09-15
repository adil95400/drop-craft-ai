import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Truck, Clock, Star, AlertTriangle, TrendingUp, Calendar } from "lucide-react";

interface CarrierMetrics {
  deliveryRate: string;
  avgDeliveryTime: string;
  customerSatisfaction: string;
  issues: string;
}

interface CarrierDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carrier?: string;
  metrics?: CarrierMetrics;
}

export function CarrierDetailsModal({ 
  open, 
  onOpenChange, 
  carrier = "Transporteur", 
  metrics
}: CarrierDetailsModalProps) {
  
  // Debug logging to understand what's happening
  console.log('CarrierDetailsModal - metrics received:', metrics);
  console.log('CarrierDetailsModal - typeof metrics:', typeof metrics);
  console.log('CarrierDetailsModal - metrics === null:', metrics === null);
  
  // Use default metrics if metrics is null or undefined
  const defaultMetrics = {
    deliveryRate: "98.5%",
    avgDeliveryTime: "2.3 jours",
    customerSatisfaction: "4.2/5",
    issues: "Retards fréquents le vendredi"
  };
  
  const actualMetrics = metrics || defaultMetrics;
  console.log('CarrierDetailsModal - actualMetrics:', actualMetrics);
  
  const performanceScore = parseFloat(actualMetrics.deliveryRate.replace('%', ''));
  const satisfactionScore = parseFloat(actualMetrics.customerSatisfaction.split('/')[0]) * 20; // Convert to percentage
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-600" />
            Détails de performance - {carrier}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Métriques principales */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg bg-card">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Taux de livraison</span>
              </div>
               <div className="space-y-2">
                 <div className="text-2xl font-bold text-green-600">{actualMetrics.deliveryRate}</div>
                 <Progress value={performanceScore} className="h-2" />
               </div>
             </div>
             
             <div className="p-4 border rounded-lg bg-card">
               <div className="flex items-center gap-2 mb-2">
                 <Clock className="h-4 w-4 text-blue-600" />
                 <span className="text-sm font-medium">Temps moyen</span>
               </div>
               <div className="text-2xl font-bold text-blue-600">{actualMetrics.avgDeliveryTime}</div>
            </div>
          </div>
          
          {/* Satisfaction client */}
          <div className="p-4 border rounded-lg bg-card">
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Satisfaction client</span>
            </div>
             <div className="flex items-center gap-4">
               <div className="text-xl font-bold text-amber-600">{actualMetrics.customerSatisfaction}</div>
               <Progress value={satisfactionScore} className="flex-1 h-2" />
               <Badge variant={satisfactionScore >= 80 ? "default" : "secondary"}>
                 {satisfactionScore >= 80 ? "Excellent" : "Bon"}
               </Badge>
             </div>
           </div>
           
           {/* Problèmes identifiés */}
           <div className="p-4 border rounded-lg bg-card">
             <div className="flex items-center gap-2 mb-3">
               <AlertTriangle className="h-4 w-4 text-amber-500" />
               <span className="text-sm font-medium">Problèmes identifiés</span>
             </div>
             <div className="bg-amber-50 border border-amber-200 rounded p-3">
               <p className="text-sm text-amber-800">{actualMetrics.issues}</p>
            </div>
          </div>
          
          {/* Tendances */}
          <div className="p-4 border rounded-lg bg-card">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Tendances récentes (7 derniers jours)</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Lundi - Vendredi :</span>
                <Badge variant="default">Performance optimale</Badge>
              </div>
              <div className="flex justify-between">
                <span>Weekend :</span>
                <Badge variant="secondary">Service réduit</Badge>
              </div>
              <div className="flex justify-between">
                <span>Vendredi PM :</span>
                <Badge variant="destructive">Zone à risque</Badge>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
            <Button onClick={() => {
              // Simuler l'ouverture d'un rapport détaillé
              onOpenChange(false);
            }}>
              Rapport détaillé
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}