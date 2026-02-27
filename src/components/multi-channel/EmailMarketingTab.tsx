import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Mail, Send, Users, BarChart3, Clock, CheckCircle2, 
  AlertCircle, Plus, Settings, Zap, ArrowUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailPlatform {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  subscribers?: number;
  lastSync?: string;
  status: 'active' | 'inactive' | 'error';
}

const EMAIL_PLATFORMS: EmailPlatform[] = [
  { id: 'mailchimp', name: 'Mailchimp', icon: '🐵', connected: false, status: 'inactive' },
  { id: 'klaviyo', name: 'Klaviyo', icon: '📧', connected: false, status: 'inactive' },
  { id: 'sendinblue', name: 'Brevo (Sendinblue)', icon: '💙', connected: false, status: 'inactive' },
  { id: 'mailerlite', name: 'MailerLite', icon: '✉️', connected: false, status: 'inactive' },
  { id: 'convertkit', name: 'ConvertKit', icon: '📬', connected: false, status: 'inactive' },
  { id: 'activecampaign', name: 'ActiveCampaign', icon: '⚡', connected: false, status: 'inactive' },
];

const DEMO_CAMPAIGNS = [
  { id: '1', name: 'Soldes d\'hiver - Nouveautés', status: 'sent', sent: 2450, opened: 1120, clicked: 340, revenue: 4520, date: '2026-02-25' },
  { id: '2', name: 'Relance panier abandonné', status: 'active', sent: 890, opened: 445, clicked: 156, revenue: 2890, date: '2026-02-24' },
  { id: '3', name: 'Bienvenue nouveaux clients', status: 'active', sent: 1200, opened: 780, clicked: 234, revenue: 1560, date: '2026-02-23' },
  { id: '4', name: 'Cross-sell post-achat', status: 'draft', sent: 0, opened: 0, clicked: 0, revenue: 0, date: '2026-02-27' },
];

export function EmailMarketingTab() {
  const [platforms, setPlatforms] = useState(EMAIL_PLATFORMS);

  const toggleConnect = (id: string) => {
    setPlatforms(ps => ps.map(p => 
      p.id === id ? { ...p, connected: !p.connected, status: p.connected ? 'inactive' as const : 'active' as const, subscribers: p.connected ? undefined : Math.floor(Math.random() * 5000) + 500 } : p
    ));
  };

  const connectedCount = platforms.filter(p => p.connected).length;
  const totalSubscribers = platforms.reduce((a, p) => a + (p.subscribers || 0), 0);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Plateformes connectées</p>
                <p className="text-2xl font-bold">{connectedCount}</p>
              </div>
              <Mail className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Abonnés totaux</p>
                <p className="text-2xl font-bold">{totalSubscribers.toLocaleString('fr-FR')}</p>
              </div>
              <Users className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux d'ouverture moy.</p>
                <p className="text-2xl font-bold">45.7%</p>
              </div>
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenu email</p>
                <p className="text-2xl font-bold">8 970 €</p>
              </div>
              <ArrowUpRight className="h-5 w-5 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platforms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Plateformes email
          </CardTitle>
          <CardDescription>Connectez vos outils d'email marketing pour synchroniser segments et campagnes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {platforms.map(platform => (
              <div key={platform.id} className={cn(
                "p-4 rounded-xl border transition-all",
                platform.connected ? "border-primary/40 bg-primary/[0.03]" : "border-border hover:border-muted-foreground/30"
              )}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{platform.icon}</span>
                    <div>
                      <p className="font-medium text-sm">{platform.name}</p>
                      {platform.connected && (
                        <p className="text-xs text-muted-foreground">{platform.subscribers?.toLocaleString('fr-FR')} abonnés</p>
                      )}
                    </div>
                  </div>
                  <Switch checked={platform.connected} onCheckedChange={() => toggleConnect(platform.id)} />
                </div>
                {platform.connected && (
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="text-[10px]">
                      <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                      Connecté
                    </Badge>
                    <Button variant="ghost" size="sm" className="h-6 text-xs ml-auto">
                      <Settings className="h-3 w-3 mr-1" />
                      Config
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Campaigns */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                Campagnes récentes
              </CardTitle>
              <CardDescription>Automatisées via vos segments clients</CardDescription>
            </div>
            <Button size="sm">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Nouvelle campagne
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {DEMO_CAMPAIGNS.map(campaign => {
              const openRate = campaign.sent > 0 ? ((campaign.opened / campaign.sent) * 100).toFixed(1) : '0';
              const clickRate = campaign.opened > 0 ? ((campaign.clicked / campaign.opened) * 100).toFixed(1) : '0';
              return (
                <div key={campaign.id} className="flex items-center gap-4 p-4 rounded-lg border border-border/60 hover:border-primary/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm truncate">{campaign.name}</p>
                      <Badge variant={campaign.status === 'sent' ? 'secondary' : campaign.status === 'active' ? 'default' : 'outline'} className="text-[10px] shrink-0">
                        {campaign.status === 'sent' ? 'Envoyée' : campaign.status === 'active' ? 'Active' : 'Brouillon'}
                      </Badge>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>{campaign.sent.toLocaleString('fr-FR')} envoyés</span>
                      <span>Ouverture: {openRate}%</span>
                      <span>Clics: {clickRate}%</span>
                    </div>
                  </div>
                  {campaign.revenue > 0 && (
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-primary">{campaign.revenue.toLocaleString('fr-FR')} €</p>
                      <p className="text-xs text-muted-foreground">revenu</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
