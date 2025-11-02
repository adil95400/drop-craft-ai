import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Send, Users, TrendingUp, Clock, Plus, Eye } from 'lucide-react';

const EmailMarketingPage: React.FC = () => {
  const campaigns = [
    {
      id: 1,
      name: 'Summer Sale 2024',
      status: 'sent',
      sent: 5432,
      opened: 2234,
      clicked: 892,
      sentDate: '2024-01-15',
    },
    {
      id: 2,
      name: 'New Products Launch',
      status: 'scheduled',
      recipients: 6789,
      scheduledDate: '2024-01-20',
    },
    {
      id: 3,
      name: 'Customer Loyalty Program',
      status: 'draft',
      recipients: 0,
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Email Marketing</h1>
          <p className="text-muted-foreground">
            Créez et gérez vos campagnes email
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle campagne
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails envoyés</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,543</div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'ouverture</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">41.2%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +2.4% vs moyenne
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de clic</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">16.4%</div>
            <p className="text-xs text-muted-foreground">+1.2% vs moyenne</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abonnés</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8,432</div>
            <p className="text-xs text-muted-foreground">+156 ce mois</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="lists">Listes</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vos campagnes</CardTitle>
              <CardDescription>Gérez vos campagnes email marketing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{campaign.name}</h3>
                        {campaign.status === 'sent' && (
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{campaign.sent} envoyés</span>
                            <span>•</span>
                            <span>{campaign.opened} ouvertures</span>
                            <span>•</span>
                            <span>{campaign.clicked} clics</span>
                          </div>
                        )}
                        {campaign.status === 'scheduled' && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <Clock className="inline h-3 w-3 mr-1" />
                            Prévu le {campaign.scheduledDate}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          campaign.status === 'sent'
                            ? 'default'
                            : campaign.status === 'scheduled'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {campaign.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        Voir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Templates d'email</CardTitle>
              <CardDescription>Vos modèles d'email personnalisés</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="h-40 bg-muted rounded-lg mb-3 flex items-center justify-center">
                        <Mail className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <h4 className="font-semibold">Template {i}</h4>
                      <p className="text-xs text-muted-foreground">Dernière modification il y a 2j</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lists">
          <Card>
            <CardHeader>
              <CardTitle>Listes de contacts</CardTitle>
              <CardDescription>Segmentez et gérez vos contacts</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Contenu des listes de contacts...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics email</CardTitle>
              <CardDescription>Performance détaillée de vos campagnes</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Contenu des analytics...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailMarketingPage;
