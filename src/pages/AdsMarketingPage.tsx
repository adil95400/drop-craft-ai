import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  TrendingUp, 
  DollarSign, 
  Eye, 
  MousePointer, 
  Download, 
  Target,
  ExternalLink,
  Plus,
  Trash2,
  Loader2,
  Play,
  Pause
} from 'lucide-react'
import { useAdsMarketing } from '@/hooks/useAdsMarketing'

const AdsMarketingPage = () => {
  const { 
    adAccounts, 
    campaigns, 
    stats, 
    isLoading,
    createAccount,
    createCampaign,
    updateCampaignStatus,
    deleteCampaign,
    toggleAccountConnection,
    isCreatingAccount,
    isCreatingCampaign
  } = useAdsMarketing();

  const [activeTab, setActiveTab] = useState('overview');
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({ platform: 'google', name: '' });
  const [newCampaign, setNewCampaign] = useState({ name: '', platform: 'google', budget: 50 });

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'google': return '🔍'
      case 'facebook': return '📘'
      case 'tiktok': return '🎵'
      default: return '📊'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'disconnected':
      case 'paused': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'error':
      case 'ended': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  const handleCreateAccount = () => {
    createAccount({ 
      platform: newAccount.platform as 'google' | 'facebook' | 'tiktok', 
      name: newAccount.name || `Compte ${newAccount.platform}` 
    });
    setNewAccount({ platform: 'google', name: '' });
    setAccountDialogOpen(false);
  };

  const handleCreateCampaign = () => {
    createCampaign({
      name: newCampaign.name,
      platform: newCampaign.platform,
      budget: newCampaign.budget
    });
    setNewCampaign({ name: '', platform: 'google', budget: 50 });
    setCampaignDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Ads & Marketing</h1>
          <p className="text-muted-foreground">Gestion des campagnes publicitaires et analyse ROI</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
          <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Target className="mr-2 h-4 w-4" />
                Nouvelle campagne
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une campagne</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Nom de la campagne</Label>
                  <Input
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                    placeholder="Ex: Promo été 2025"
                  />
                </div>
                <div>
                  <Label>Plateforme</Label>
                  <Select 
                    value={newCampaign.platform} 
                    onValueChange={(v) => setNewCampaign({ ...newCampaign, platform: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">🔍 Google Ads</SelectItem>
                      <SelectItem value="facebook">📘 Facebook Ads</SelectItem>
                      <SelectItem value="tiktok">🎵 TikTok Ads</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Budget journalier (€)</Label>
                  <Input
                    type="number"
                    value={newCampaign.budget}
                    onChange={(e) => setNewCampaign({ ...newCampaign, budget: Number(e.target.value) })}
                  />
                </div>
                <Button onClick={handleCreateCampaign} className="w-full" disabled={isCreatingCampaign}>
                  {isCreatingCampaign && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Créer la campagne
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dépenses totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.totalSpend.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{stats.activeCampaigns} campagnes actives</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalImpressions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Toutes plateformes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clics</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{stats.totalConversions} conversions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROAS Moyen</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageROAS.toFixed(1)}x</div>
            <p className="text-xs text-muted-foreground">{stats.connectedAccounts} comptes connectés</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="platforms">Plateformes ({adAccounts.length})</TabsTrigger>
          <TabsTrigger value="campaigns">Campagnes ({campaigns.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance par plateforme</CardTitle>
              </CardHeader>
              <CardContent>
                {adAccounts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Aucun compte publicitaire</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={() => setAccountDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un compte
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {adAccounts.map((account) => (
                      <div key={account.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getPlatformIcon(account.platform)}</span>
                          <div>
                            <p className="font-medium">{account.name}</p>
                            <p className="text-sm text-muted-foreground">{account.conversions} conversions</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">€{Number(account.spend).toFixed(2)}</p>
                          <Badge className={getStatusColor(account.status)}>{account.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Campagnes</CardTitle>
              </CardHeader>
              <CardContent>
                {campaigns.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Aucune campagne</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={() => setCampaignDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Créer une campagne
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {campaigns.slice(0, 3).map((campaign) => (
                      <div key={campaign.id} className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{campaign.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {getPlatformIcon(campaign.platform)} ROAS: {Number(campaign.roas).toFixed(1)}x
                            </p>
                          </div>
                          <Badge className={getStatusColor(campaign.status)}>{campaign.status}</Badge>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all" 
                            style={{ width: `${Math.min((Number(campaign.spend) / Number(campaign.budget)) * 100, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          €{Number(campaign.spend).toFixed(2)} / €{Number(campaign.budget)} ({Math.round((Number(campaign.spend) / Number(campaign.budget)) * 100)}%)
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un compte
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter un compte publicitaire</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label>Plateforme</Label>
                    <Select 
                      value={newAccount.platform} 
                      onValueChange={(v) => setNewAccount({ ...newAccount, platform: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google">🔍 Google Ads</SelectItem>
                        <SelectItem value="facebook">📘 Facebook Ads</SelectItem>
                        <SelectItem value="tiktok">🎵 TikTok Ads</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Nom du compte</Label>
                    <Input
                      value={newAccount.name}
                      onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                      placeholder="Ex: Compte principal Google"
                    />
                  </div>
                  <Button onClick={handleCreateAccount} className="w-full" disabled={isCreatingAccount}>
                    {isCreatingAccount && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Ajouter le compte
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {adAccounts.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ExternalLink className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    Aucun compte publicitaire configuré.<br />
                    Ajoutez vos comptes Google, Facebook ou TikTok Ads.
                  </p>
                </CardContent>
              </Card>
            ) : (
              adAccounts.map((account) => (
                <Card key={account.id}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{getPlatformIcon(account.platform)}</span>
                      <div>
                        <CardTitle className="text-base">{account.name}</CardTitle>
                        <CardDescription className="capitalize">{account.platform} Ads</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Dépenses:</span>
                        <span className="font-bold">€{Number(account.spend).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Conversions:</span>
                        <span className="font-bold">{account.conversions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Clics:</span>
                        <span className="font-bold">{account.clicks}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge className={getStatusColor(account.status)}>{account.status}</Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => toggleAccountConnection({ 
                          id: account.id, 
                          status: account.status === 'connected' ? 'disconnected' : 'connected' 
                        })}
                      >
                        {account.status === 'connected' ? 'Déconnecter' : 'Connecter'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          {campaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Aucune campagne créée.<br />
                  Lancez votre première campagne publicitaire.
                </p>
                <Button className="mt-4" onClick={() => setCampaignDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une campagne
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <Card key={campaign.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <span className="text-xl">{getPlatformIcon(campaign.platform)}</span>
                          {campaign.name}
                        </CardTitle>
                        <CardDescription>Budget: €{Number(campaign.budget)}/jour</CardDescription>
                      </div>
                      <Badge className={getStatusColor(campaign.status)}>{campaign.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Dépensé</p>
                        <p className="text-lg font-bold">€{Number(campaign.spend).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Clics</p>
                        <p className="text-lg font-bold">{campaign.clicks}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Impressions</p>
                        <p className="text-lg font-bold">{campaign.impressions.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">CTR</p>
                        <p className="text-lg font-bold">{Number(campaign.ctr).toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">CPC</p>
                        <p className="text-lg font-bold">€{Number(campaign.cpc).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">ROAS</p>
                        <p className="text-lg font-bold text-green-600">{Number(campaign.roas).toFixed(1)}x</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => updateCampaignStatus({ 
                          id: campaign.id, 
                          status: campaign.status === 'active' ? 'paused' : 'active' 
                        })}
                      >
                        {campaign.status === 'active' ? (
                          <><Pause className="mr-2 h-4 w-4" /> Pause</>
                        ) : (
                          <><Play className="mr-2 h-4 w-4" /> Activer</>
                        )}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteCampaign(campaign.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdsMarketingPage
