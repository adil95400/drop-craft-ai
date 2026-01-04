import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Shield, Download, Trash2, Cookie, BarChart3, Mail, Share2, Loader2 } from 'lucide-react';
import { useGdprConsents, ConsentType } from '@/hooks/useGdprConsents';

const CONSENT_OPTIONS: { type: ConsentType; label: string; description: string; icon: React.ReactNode }[] = [
  {
    type: 'cookies',
    label: 'Cookies essentiels',
    description: 'Nécessaires au fonctionnement du site. Ne peuvent pas être désactivés.',
    icon: <Cookie className="h-4 w-4" />
  },
  {
    type: 'analytics',
    label: 'Cookies analytiques',
    description: 'Nous aident à comprendre comment vous utilisez le site pour l\'améliorer.',
    icon: <BarChart3 className="h-4 w-4" />
  },
  {
    type: 'marketing',
    label: 'Communications marketing',
    description: 'Recevoir des emails promotionnels et des offres personnalisées.',
    icon: <Mail className="h-4 w-4" />
  },
  {
    type: 'third_party',
    label: 'Partage avec des tiers',
    description: 'Partager vos données avec nos partenaires sélectionnés.',
    icon: <Share2 className="h-4 w-4" />
  },
  {
    type: 'newsletter',
    label: 'Newsletter',
    description: 'Recevoir notre newsletter hebdomadaire avec les dernières actualités.',
    icon: <Mail className="h-4 w-4" />
  }
];

export const GdprConsentManager = () => {
  const { consents, isLoading, updateConsent, exportUserData, getConsentStatus } = useGdprConsents();
  const [pendingChanges, setPendingChanges] = useState<Partial<Record<ConsentType, boolean>>>({});

  const handleConsentChange = (type: ConsentType, granted: boolean) => {
    if (type === 'cookies') return; // Essential cookies cannot be disabled
    
    setPendingChanges(prev => ({ ...prev, [type]: granted }));
    updateConsent.mutate({ consentType: type, granted });
  };

  const getEffectiveValue = (type: ConsentType): boolean => {
    if (type === 'cookies') return true; // Always enabled
    if (type in pendingChanges) return pendingChanges[type];
    return getConsentStatus(type);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Protection des données (RGPD)</CardTitle>
              <CardDescription>
                Gérez vos préférences de confidentialité et vos consentements
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Consent Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Préférences de consentement</CardTitle>
          <CardDescription>
            Choisissez comment nous pouvons utiliser vos données
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {CONSENT_OPTIONS.map((option) => (
            <div 
              key={option.type} 
              className="flex items-center justify-between py-3 border-b last:border-0"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  {option.icon}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={option.type} className="font-medium">
                      {option.label}
                    </Label>
                    {option.type === 'cookies' && (
                      <Badge variant="secondary" className="text-xs">Requis</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </div>
              <Switch
                id={option.type}
                checked={getEffectiveValue(option.type)}
                onCheckedChange={(checked) => handleConsentChange(option.type, checked)}
                disabled={option.type === 'cookies' || updateConsent.isPending || isLoading}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Data Rights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Vos droits</CardTitle>
          <CardDescription>
            Conformément au RGPD, vous avez le droit d'accéder, de modifier et de supprimer vos données
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Export Data */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Exporter mes données</p>
              <p className="text-sm text-muted-foreground">
                Téléchargez une copie de toutes vos données personnelles
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => exportUserData.mutate()}
              disabled={exportUserData.isPending}
            >
              {exportUserData.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Exporter
            </Button>
          </div>

          <Separator />

          {/* Delete Account */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium text-destructive">Supprimer mon compte</p>
              <p className="text-sm text-muted-foreground">
                Supprime définitivement votre compte et toutes vos données
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Toutes vos données seront définitivement supprimées.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Supprimer définitivement
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Last Updated */}
      {consents && consents.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Dernière mise à jour : {new Date(consents[0].updated_at).toLocaleDateString('fr-FR')}
        </p>
      )}
    </div>
  );
};
