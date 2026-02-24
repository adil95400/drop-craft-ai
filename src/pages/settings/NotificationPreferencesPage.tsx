import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Mail, Smartphone, Monitor, Save } from 'lucide-react';
import { toast } from 'sonner';

interface NotifCategory {
  id: string;
  labelKey: string;
  descKey: string;
  email: boolean;
  push: boolean;
  inApp: boolean;
}

const defaultCategories: NotifCategory[] = [
  { id: 'orders', labelKey: 'notifPrefs.orders', descKey: 'notifPrefs.ordersDesc', email: true, push: true, inApp: true },
  { id: 'stock', labelKey: 'notifPrefs.stock', descKey: 'notifPrefs.stockDesc', email: true, push: true, inApp: true },
  { id: 'sync', labelKey: 'notifPrefs.sync', descKey: 'notifPrefs.syncDesc', email: true, push: false, inApp: true },
  { id: 'pricing', labelKey: 'notifPrefs.pricing', descKey: 'notifPrefs.pricingDesc', email: false, push: true, inApp: true },
  { id: 'import', labelKey: 'notifPrefs.import', descKey: 'notifPrefs.importDesc', email: true, push: false, inApp: true },
  { id: 'marketing', labelKey: 'notifPrefs.marketing', descKey: 'notifPrefs.marketingDesc', email: false, push: false, inApp: true },
  { id: 'security', labelKey: 'notifPrefs.security', descKey: 'notifPrefs.securityDesc', email: true, push: true, inApp: true },
  { id: 'billing', labelKey: 'notifPrefs.billingNotif', descKey: 'notifPrefs.billingDesc', email: true, push: false, inApp: true },
  { id: 'system', labelKey: 'notifPrefs.system', descKey: 'notifPrefs.systemDesc', email: false, push: false, inApp: true },
];

export default function NotificationPreferencesPage() {
  const { t } = useTranslation('settings');
  const [categories, setCategories] = useState(defaultCategories);

  const toggle = (id: string, channel: 'email' | 'push' | 'inApp') => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, [channel]: !c[channel] } : c));
  };

  const handleSave = () => {
    toast.success(t('notifPrefs.saved'));
  };

  return (
    <ChannablePageWrapper
      title={t('notifPrefs.title')}
      description={t('notifPrefs.description')}
      actions={
        <Button onClick={handleSave}><Save className="h-4 w-4 mr-2" /> {t('notifPrefs.save')}</Button>
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
                  <p className="font-medium text-sm">{t(cat.labelKey)}</p>
                  <p className="text-xs text-muted-foreground">{t(cat.descKey)}</p>
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
