import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Cookie, Settings, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const COOKIE_CONSENT_KEY = 'cookie_consent_given';

export const CookieConsentBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const consentGiven = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consentGiven) {
      // Delay showing banner for better UX
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString()
    }));
    setShowBanner(false);
  };

  const handleAcceptEssential = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString()
    }));
    setShowBanner(false);
  };

  const handleReject = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString()
    }));
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-background to-transparent pointer-events-none">
      <Card className="max-w-4xl mx-auto shadow-lg border-2 pointer-events-auto">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
              <Cookie className="h-6 w-6 text-primary" />
            </div>
            
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-semibold text-lg">🍪 Nous utilisons des cookies</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Nous utilisons des cookies pour améliorer votre expérience, analyser le trafic et personnaliser le contenu. 
                  En cliquant sur "Accepter tout", vous consentez à l'utilisation de tous les cookies.
                </p>
              </div>

              {showDetails && (
                <div className="space-y-2 p-3 bg-muted/50 rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span><strong>Cookies essentiels</strong> - Nécessaires au fonctionnement (toujours actifs)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span><strong>Cookies analytiques</strong> - Nous aident à améliorer le site</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span><strong>Cookies marketing</strong> - Personnalisent les publicités</span>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={handleAcceptAll} className="gap-2">
                  <Check className="h-4 w-4" />
                  Accepter tout
                </Button>
                <Button variant="outline" onClick={handleAcceptEssential}>
                  Essentiels uniquement
                </Button>
                <Button variant="ghost" onClick={handleReject} className="gap-2">
                  <X className="h-4 w-4" />
                  Refuser
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowDetails(!showDetails)}
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  {showDetails ? 'Masquer' : 'Détails'}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                En savoir plus dans notre{' '}
                <Link to="/privacy" className="underline hover:text-primary">
                  Politique de confidentialité
                </Link>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
