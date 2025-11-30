import React, { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';

export function PWAInstallBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const { isInstalled, canInstall, promptInstall } = usePWA();

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà fermé la bannière
    const dismissed = localStorage.getItem('pwa-install-banner-dismissed');
    const shouldShow = !isInstalled && canInstall && !dismissed;
    setIsVisible(shouldShow);
  }, [isInstalled, canInstall]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-install-banner-dismissed', 'true');
  };

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 sm:left-auto sm:right-8 sm:bottom-8 sm:max-w-md">
      <div className="bg-card border-2 border-primary/20 rounded-lg shadow-lg p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Installer ShopOpti+</h3>
              <p className="text-xs text-muted-foreground">
                Accédez à l'app depuis votre écran d'accueil
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 -mt-1 -mr-1"
            onClick={handleDismiss}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={handleInstall}
            size="sm"
            className="flex-1"
          >
            Installer
          </Button>
          <Button
            onClick={handleDismiss}
            variant="outline"
            size="sm"
          >
            Plus tard
          </Button>
        </div>
      </div>
    </div>
  );
}
