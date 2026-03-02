import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Cookie, Settings, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const COOKIE_CONSENT_KEY = 'shopopti_cookie_consent';

interface CookiePreferences {
  necessary: boolean; // always true
  analytics: boolean;
  performance: boolean;
}

function getStoredConsent(): CookiePreferences | null {
  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function storeConsent(prefs: CookiePreferences) {
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ ...prefs, timestamp: Date.now() }));
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    performance: false,
  });

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptAll = () => {
    const allAccepted = { necessary: true, analytics: true, performance: true };
    storeConsent(allAccepted);
    setVisible(false);
  };

  const rejectAll = () => {
    const onlyNecessary = { necessary: true, analytics: false, performance: false };
    storeConsent(onlyNecessary);
    setVisible(false);
  };

  const savePrefs = () => {
    storeConsent(prefs);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6"
        >
          <Card className="max-w-3xl mx-auto border shadow-2xl bg-background/95 backdrop-blur-md">
            <div className="p-5 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Cookie className="h-6 w-6 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-base">Nous respectons votre vie privée</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Nous utilisons des cookies pour améliorer votre expérience. Les cookies nécessaires sont
                      toujours actifs. Vous pouvez choisir d'activer les cookies analytiques et de performance.{' '}
                      <Link to="/privacy#cookies" className="underline text-primary">En savoir plus</Link>
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={rejectAll} aria-label="Fermer">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Details */}
              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-3 overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">Cookies nécessaires</p>
                        <p className="text-xs text-muted-foreground">Authentification, sécurité, préférences</p>
                      </div>
                      <Switch checked disabled aria-label="Cookies nécessaires (toujours actifs)" />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">Cookies analytiques</p>
                        <p className="text-xs text-muted-foreground">Mesure d'audience anonymisée</p>
                      </div>
                      <Switch
                        checked={prefs.analytics}
                        onCheckedChange={(v) => setPrefs(p => ({ ...p, analytics: v }))}
                        aria-label="Cookies analytiques"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">Cookies de performance</p>
                        <p className="text-xs text-muted-foreground">Optimisation et vitesse du service</p>
                      </div>
                      <Switch
                        checked={prefs.performance}
                        onCheckedChange={(v) => setPrefs(p => ({ ...p, performance: v }))}
                        aria-label="Cookies de performance"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="gap-1"
                >
                  <Settings className="h-4 w-4" />
                  {showDetails ? 'Masquer les détails' : 'Personnaliser'}
                </Button>
                <Button variant="outline" size="sm" onClick={rejectAll}>
                  Refuser tout
                </Button>
                {showDetails ? (
                  <Button size="sm" onClick={savePrefs}>
                    Enregistrer mes choix
                  </Button>
                ) : (
                  <Button size="sm" onClick={acceptAll}>
                    Tout accepter
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
