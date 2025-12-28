import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog';
import { Users, Link2, DollarSign, TrendingUp, Award, BarChart3, Plus, Copy, Trash2, ExternalLink } from 'lucide-react';
import { useAffiliates } from '@/hooks/useAffiliates';
import { useToast } from '@/hooks/use-toast';

const AffiliateMarketingPage: React.FC = () => {
  const { affiliates, stats, isLoading, createAffiliate, deleteAffiliate } = useAffiliates();
  const { toast } = useToast();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [newAffiliate, setNewAffiliate] = useState({ name: '', email: '' });

  const handleInviteAffiliate = async () => {
    if (!newAffiliate.name || !newAffiliate.email) return;
    
    await createAffiliate.mutateAsync(newAffiliate);
    setIsInviteOpen(false);
    setNewAffiliate({ name: '', email: '' });
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: "Lien copié",
      description: "Le lien d'affiliation a été copié dans le presse-papier"
    });
  };

  const handleDeleteAffiliate = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet affilié ?')) {
      await deleteAffiliate.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-16" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Marketing d'affiliation</h1>
          <p className="text-muted-foreground">
            Gérez votre programme d'affiliés
          </p>
        </div>
        
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Inviter un affilié
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Inviter un nouvel affilié</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="affiliate-name">Nom</Label>
                <Input
                  id="affiliate-name"
                  placeholder="Nom complet"
                  value={newAffiliate.name}
                  onChange={(e) => setNewAffiliate({ ...newAffiliate, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="affiliate-email">Email</Label>
                <Input
                  id="affiliate-email"
                  type="email"
                  placeholder="email@exemple.com"
                  value={newAffiliate.email}
                  onChange={(e) => setNewAffiliate({ ...newAffiliate, email: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleInviteAffiliate}
                disabled={!newAffiliate.name || !newAffiliate.email || createAffiliate.isPending}
              >
                {createAffiliate.isPending ? 'Envoi...' : 'Envoyer l\'invitation'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Affiliés actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAffiliates}</div>
            <p className="text-xs text-muted-foreground">Sur {stats.totalAffiliates} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue généré</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +18% ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commissions</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.totalCommissions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">À payer ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de conversion</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgConversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Moyenne globale</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="affiliates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="affiliates">Affiliés</TabsTrigger>
          <TabsTrigger value="links">Liens</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="affiliates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vos affiliés</CardTitle>
              <CardDescription>Liste de vos partenaires affiliés</CardDescription>
            </CardHeader>
            <CardContent>
              {affiliates.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucun affilié</h3>
                  <p className="text-muted-foreground mb-4">
                    Invitez des partenaires pour commencer votre programme d'affiliation
                  </p>
                  <Button onClick={() => setIsInviteOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Inviter un affilié
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {affiliates.map((affiliate) => (
                    <div
                      key={affiliate.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{affiliate.name}</h3>
                          <p className="text-sm text-muted-foreground">{affiliate.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-sm font-semibold">{affiliate.sales}</div>
                          <div className="text-xs text-muted-foreground">Ventes</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-semibold">€{affiliate.revenue.toFixed(0)}</div>
                          <div className="text-xs text-muted-foreground">Revenue</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-semibold">€{affiliate.commission.toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">Commission</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-semibold">{affiliate.conversionRate.toFixed(1)}%</div>
                          <div className="text-xs text-muted-foreground">Conversion</div>
                        </div>
                        <Badge
                          variant={affiliate.status === 'active' ? 'default' : 'secondary'}
                        >
                          {affiliate.status}
                        </Badge>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleCopyLink(affiliate.link)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-destructive"
                            onClick={() => handleDeleteAffiliate(affiliate.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links">
          <Card>
            <CardHeader>
              <CardTitle>Liens d'affiliation</CardTitle>
              <CardDescription>Gérez les liens de tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {affiliates.map((affiliate) => (
                  <div key={affiliate.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Link2 className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">{affiliate.name}</h4>
                      </div>
                      <Badge>{affiliate.clicks} clics</Badge>
                    </div>
                    <div className="p-2 bg-muted rounded font-mono text-sm">
                      {affiliate.link}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCopyLink(affiliate.link)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copier
                      </Button>
                      <Button size="sm" variant="outline">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Analytics
                      </Button>
                    </div>
                  </div>
                ))}
                
                {affiliates.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun lien d'affiliation
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions">
          <Card>
            <CardHeader>
              <CardTitle>Structure de commissions</CardTitle>
              <CardDescription>Définissez vos taux de commission</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Commission par défaut</h4>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Appliquée à tous les nouveaux affiliés
                    </p>
                    <Badge variant="secondary" className="text-lg">10%</Badge>
                  </div>
                  <Button size="sm" variant="outline" className="mt-3">
                    Modifier
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Commission par palier</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>0-10 ventes/mois</span>
                      <Badge variant="outline">10%</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>11-50 ventes/mois</span>
                      <Badge variant="outline">12%</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>50+ ventes/mois</span>
                      <Badge variant="outline">15%</Badge>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="mt-3">
                    Modifier
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Cookie de tracking</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Durée: 30 jours
                  </p>
                  <Button size="sm" variant="outline">
                    Modifier
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres du programme</CardTitle>
              <CardDescription>Configuration générale du programme d'affiliation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Paiements automatiques</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Les commissions sont payées automatiquement le 1er de chaque mois
                  </p>
                  <Button size="sm" variant="outline">
                    Configurer
                  </Button>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Seuil minimum</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Seuil minimum pour le paiement: €50
                  </p>
                  <Button size="sm" variant="outline">
                    Modifier
                  </Button>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Notifications</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Recevoir des alertes pour les nouvelles ventes affiliées
                  </p>
                  <Button size="sm" variant="outline">
                    Configurer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AffiliateMarketingPage;
