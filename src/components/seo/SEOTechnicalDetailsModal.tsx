import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertTriangle, Clock, Smartphone, Shield, FileText, Globe, Zap } from "lucide-react";

interface TechnicalDetail {
  check: string;
  status: 'success' | 'warning' | 'error';
  details: string;
  score?: number;
  recommendations?: string[];
  impact?: string;
}

interface SEOTechnicalDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: TechnicalDetail | null;
}

export const SEOTechnicalDetailsModal = ({ 
  open, 
  onOpenChange, 
  detail 
}: SEOTechnicalDetailsModalProps) => {
  if (!detail) return null;

  const getIcon = (check: string) => {
    switch (check) {
      case 'Vitesse de chargement':
        return <Clock className="h-6 w-6" />;
      case 'Mobile-friendly':
        return <Smartphone className="h-6 w-6" />;
      case 'HTTPS':
        return <Shield className="h-6 w-6" />;
      case 'Sitemap XML':
        return <FileText className="h-6 w-6" />;
      case 'Robots.txt':
        return <Globe className="h-6 w-6" />;
      default:
        return <Zap className="h-6 w-6" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getDetailedInfo = (check: string) => {
    switch (check) {
      case 'Vitesse de chargement':
        return {
          metrics: [
            { label: 'First Contentful Paint', value: '1.2s', status: 'success' },
            { label: 'Largest Contentful Paint', value: '2.1s', status: 'success' },
            { label: 'Cumulative Layout Shift', value: '0.05', status: 'success' },
            { label: 'First Input Delay', value: '89ms', status: 'success' }
          ],
          recommendations: [
            'Optimiser les images en utilisant des formats modernes (WebP, AVIF)',
            'Minifier les fichiers CSS et JavaScript',
            'Utiliser un CDN pour distribuer le contenu',
            'Implémenter la mise en cache du navigateur'
          ]
        };
      case 'Mobile-friendly':
        return {
          metrics: [
            { label: 'Responsive Design', value: 'Conforme', status: 'success' },
            { label: 'Taille des boutons', value: 'Adaptée', status: 'success' },
            { label: 'Lisibilité du texte', value: 'Bonne', status: 'success' },
            { label: 'Espacement tactile', value: 'Suffisant', status: 'success' }
          ],
          recommendations: [
            'Maintenir les bonnes pratiques actuelles',
            'Tester régulièrement sur différents appareils',
            'Vérifier la taille des éléments interactifs'
          ]
        };
      case 'HTTPS':
        return {
          metrics: [
            { label: 'Certificat SSL', value: 'Valide', status: 'success' },
            { label: 'Protocole TLS', value: '1.3', status: 'success' },
            { label: 'Redirection HTTP', value: 'Active', status: 'success' },
            { label: 'HSTS', value: 'Configuré', status: 'success' }
          ],
          recommendations: [
            'Renouveler automatiquement le certificat SSL',
            'Maintenir les bonnes pratiques de sécurité'
          ]
        };
      case 'Sitemap XML':
        return {
          metrics: [
            { label: 'Sitemap existant', value: 'Oui', status: 'success' },
            { label: 'Dernière mise à jour', value: 'Il y a 7 jours', status: 'warning' },
            { label: 'Nombre d\'URLs', value: '247', status: 'success' },
            { label: 'Erreurs détectées', value: '3', status: 'warning' }
          ],
          recommendations: [
            'Mettre à jour le sitemap automatiquement',
            'Corriger les URLs en erreur dans le sitemap',
            'Soumettre le sitemap mis à jour à Google Search Console'
          ]
        };
      case 'Robots.txt':
        return {
          metrics: [
            { label: 'Fichier robots.txt', value: 'Présent', status: 'success' },
            { label: 'Syntaxe', value: 'Correcte', status: 'success' },
            { label: 'Sitemap référencé', value: 'Oui', status: 'success' },
            { label: 'Règles définies', value: '8', status: 'success' }
          ],
          recommendations: [
            'Vérifier régulièrement les règles de blocage',
            'Tester le fichier robots.txt avec Google Search Console'
          ]
        };
      default:
        return {
          metrics: [],
          recommendations: []
        };
    }
  };

  const detailedInfo = getDetailedInfo(detail.check);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={getStatusColor(detail.status)}>
              {getIcon(detail.check)}
            </div>
            {detail.check}
            <Badge variant={detail.status === 'success' ? 'default' : detail.status === 'warning' ? 'secondary' : 'destructive'}>
              {detail.status === 'success' ? 'Bon' : detail.status === 'warning' ? 'Attention' : 'Erreur'}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Analyse détaillée et recommandations d'optimisation
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Score général */}
          {detail.score && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Score global</span>
                <span className="text-sm text-muted-foreground">{detail.score}/100</span>
              </div>
              <Progress value={detail.score} className="h-2" />
            </div>
          )}

          {/* Métriques détaillées */}
          {detailedInfo.metrics.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold">Métriques détaillées</h4>
              <div className="space-y-3">
                {detailedInfo.metrics.map((metric, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {metric.status === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="text-sm font-medium">{metric.label}</span>
                    </div>
                    <span className="text-sm">{metric.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Impact */}
          {detail.impact && (
            <div className="space-y-2">
              <h4 className="font-semibold">Impact SEO</h4>
              <p className="text-sm text-muted-foreground">{detail.impact}</p>
            </div>
          )}

          {/* Recommandations */}
          {detailedInfo.recommendations.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold">Recommandations</h4>
              <ul className="space-y-2">
                {detailedInfo.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
            <Button>
              Commencer l'optimisation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};