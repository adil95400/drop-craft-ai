import { useState } from 'react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Mail, Smartphone, Monitor, Volume2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface NotifCategory {
  id: string;
  label: string;
  description: string;
  email: boolean;
  push: boolean;
  inApp: boolean;
}

const defaultCategories: NotifCategory[] = [
  { id: 'orders', label: 'Commandes', description: 'Nouvelles commandes, mises à jour de statut, annulations', email: true, push: true, inApp: true },
  { id: 'stock', label: 'Stock & Inventaire', description: 'Alertes de stock bas, ruptures, réapprovisionnement', email: true, push: true, inApp: true },
  { id: 'sync', label: 'Synchronisation', description: 'Sync terminée, erreurs de sync, conflits', email: true, push: false, inApp: true },
  { id: 'pricing', label: 'Prix & Repricing', description: 'Changements de prix concurrents, ajustements automatiques', email: false, push: true, inApp: true },
  { id: 'import', label: 'Importation', description: 'Jobs terminés, erreurs, doublons détectés', email: true, push: false, inApp: true },
  { id: 'marketing', label: 'Marketing & SEO', description: 'Scores SEO, campagnes, performances', email: false, push: false, inApp: true },
  { id: 'security', label: 'Sécurité', description: 'Connexions suspectes, changements de mot de passe', email: true, push: true, inApp: true },
  { id: 'billing', label: 'Facturation', description: 'Paiements, factures, quotas atteints', email: true, push: false, inApp: true },
  { id: 'system', label: 'Système', description: 'Maintenance, mises à jour, performances', email: false, push: false, inApp: true },
];

export default function NotificationPreferencesPage() {
  const [categories, setCategories] = useState(defaultCategories);

  const toggle = (id: string, channel: 'email' | 'push' | 'inApp') => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, [channel]: !c[channel] } : c));
  };

  const handleSave = () => {
    toast.success('Préférences de notifications sauvegardées');
  };

  return (
    <ChannablePageWrapper
      title="Préférences de notifications"
      description="Choisissez comment et quand vous souhaitez être notifié"
      actions={
        <Button onClick={handleSave}><Save className="h-4 w-4 mr-2" /> Sauvegarder</Button>
      }
    >
      {/* Channel legend */}
      <div className="flex gap-6 text-sm text-muted-foreground">
        <span className="flex items-center gap-1"><Mail className="h-4 w-4" /> Email</span>
        <span className="flex items-center gap-1"><Smartphone className="h-4 w-4" /> Push</span>
        <span className="flex items-center gap-1"><Monitor className="h-4 w-4" /> In-App</span>
      </div>

      <div className="space-y-3">
        {categories.map((cat) => (
          <Card key={cat.id}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex-1 min-w-[200px]">
                  <p className="font-medium text-sm">{cat.label}</p>
                  <p className="text-xs text-muted-foreground">{cat.description}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <Switch checked={cat.email} onCheckedChange={() => toggle(cat.id, 'email')} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-3 w-3 text-muted-foreground" />
                    <Switch checked={cat.push} onCheckedChange={() => toggle(cat.id, 'push')} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Monitor className="h-3 w-3 text-muted-foreground" />
                    <Switch checked={cat.inApp} onCheckedChange={() => toggle(cat.id, 'inApp')} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ChannablePageWrapper>
  );
}
