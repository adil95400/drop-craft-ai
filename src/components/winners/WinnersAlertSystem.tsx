import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Bell, Plus, Trash2, TrendingUp, DollarSign, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Alert {
  id: string;
  type: 'score' | 'price' | 'trend';
  condition: string;
  value: number;
  enabled: boolean;
  category?: string;
}

export const WinnersAlertSystem = () => {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>([
    { id: '1', type: 'score', condition: 'above', value: 85, enabled: true },
    { id: '2', type: 'price', condition: 'below', value: 30, enabled: true, category: 'Tech' },
  ]);

  const [newAlert, setNewAlert] = useState<Partial<Alert>>({
    type: 'score',
    condition: 'above',
    value: 80,
    enabled: true
  });

  const addAlert = () => {
    if (!newAlert.value) {
      toast({
        title: "Valeur requise",
        description: "Veuillez définir une valeur pour l'alerte",
        variant: "destructive"
      });
      return;
    }

    const alert: Alert = {
      id: Date.now().toString(),
      type: newAlert.type || 'score',
      condition: newAlert.condition || 'above',
      value: newAlert.value,
      enabled: true,
      category: newAlert.category
    };

    setAlerts([...alerts, alert]);
    setNewAlert({ type: 'score', condition: 'above', value: 80, enabled: true });
    
    toast({
      title: "✅ Alerte créée",
      description: "Vous serez notifié quand les conditions seront remplies"
    });
  };

  const removeAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
    toast({
      title: "Alerte supprimée",
      description: "L'alerte a été retirée"
    });
  };

  const toggleAlert = (id: string) => {
    setAlerts(alerts.map(a => 
      a.id === id ? { ...a, enabled: !a.enabled } : a
    ));
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'score': return <Target className="w-4 h-4" />;
      case 'price': return <DollarSign className="w-4 h-4" />;
      case 'trend': return <TrendingUp className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getAlertLabel = (alert: Alert) => {
    const typeLabels = {
      score: 'Score',
      price: 'Prix',
      trend: 'Tendance'
    };
    const conditionLabels = {
      above: 'supérieur à',
      below: 'inférieur à'
    };
    
    return `${typeLabels[alert.type]} ${conditionLabels[alert.condition as 'above' | 'below']} ${alert.value}${alert.type === 'price' ? '€' : ''}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Système d'Alertes Automatiques
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Création d'alerte */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <h4 className="font-semibold text-sm">Créer une nouvelle alerte</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Type d'alerte</Label>
              <select
                className="w-full p-2 border rounded-md"
                value={newAlert.type}
                onChange={(e) => setNewAlert({ ...newAlert, type: e.target.value as Alert['type'] })}
              >
                <option value="score">Score de produit</option>
                <option value="price">Prix</option>
                <option value="trend">Tendance</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Condition</Label>
              <select
                className="w-full p-2 border rounded-md"
                value={newAlert.condition}
                onChange={(e) => setNewAlert({ ...newAlert, condition: e.target.value })}
              >
                <option value="above">Supérieur à</option>
                <option value="below">Inférieur à</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Valeur</Label>
              <Input
                type="number"
                placeholder="80"
                value={newAlert.value || ''}
                onChange={(e) => setNewAlert({ ...newAlert, value: Number(e.target.value) })}
              />
            </div>

            <div className="flex items-end">
              <Button onClick={addAlert} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Catégorie (optionnel)</Label>
              <Input
                placeholder="Ex: Tech & Gadgets"
                value={newAlert.category || ''}
                onChange={(e) => setNewAlert({ ...newAlert, category: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Liste des alertes */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Alertes actives ({alerts.filter(a => a.enabled).length})</h4>
          
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucune alerte configurée</p>
              <p className="text-sm">Créez votre première alerte ci-dessus</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    alert.enabled ? 'bg-background' : 'bg-muted/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`p-2 rounded-full ${
                      alert.enabled ? 'bg-primary/10 text-primary' : 'bg-muted'
                    }`}>
                      {getAlertIcon(alert.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{getAlertLabel(alert)}</span>
                        {alert.category && (
                          <Badge variant="outline" className="text-xs">
                            {alert.category}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {alert.enabled 
                          ? "Vous serez notifié quand cette condition est remplie"
                          : "Alerte désactivée"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      checked={alert.enabled}
                      onCheckedChange={() => toggleAlert(alert.id)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAlert(alert.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Paramètres de notification */}
        <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
          <h4 className="font-semibold text-sm">Paramètres de notification</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Notifications push</div>
                <div className="text-xs text-muted-foreground">Recevoir des alertes en temps réel</div>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Emails quotidiens</div>
                <div className="text-xs text-muted-foreground">Résumé journalier des nouvelles opportunités</div>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Alertes de prix</div>
                <div className="text-xs text-muted-foreground">Baisse de prix sur produits favoris</div>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <Bell className="w-4 h-4 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <p className="font-semibold mb-1">💡 Astuce</p>
            <p className="text-blue-800 dark:text-blue-200">
              Les alertes vous permettent de ne jamais manquer une opportunité. 
              Configurez des alertes pour être notifié dès qu'un produit correspond à vos critères !
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
