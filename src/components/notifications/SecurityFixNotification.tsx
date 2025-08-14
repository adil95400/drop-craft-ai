import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CheckCircle, Shield, X } from "lucide-react";

export function SecurityFixNotification() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show notification only if it hasn't been dismissed before
    const dismissed = localStorage.getItem('security-fix-notification-dismissed');
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('security-fix-notification-dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <Alert className="border-green-200 bg-green-50 text-green-800 mb-6">
      <Shield className="h-4 w-4 text-green-600" />
      <div className="flex justify-between items-start w-full">
        <div className="flex-1">
          <AlertTitle className="text-green-800 font-semibold">
            Vulnérabilités de sécurité corrigées
          </AlertTitle>
          <AlertDescription className="text-green-700 mt-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Protection contre la récolte d'emails dans les newsletters</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Fonctions de base de données sécurisées</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Système de monitoring de sécurité amélioré</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Authentification avec journalisation des tentatives</span>
              </div>
            </div>
          </AlertDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="text-green-600 hover:text-green-800 p-1"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}