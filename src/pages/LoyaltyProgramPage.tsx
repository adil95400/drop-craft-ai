import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Award, Star, Gift, Users, TrendingUp, Crown, Plus, Trash2, Loader2 } from 'lucide-react';
import { useLoyaltyProgram } from '@/hooks/useLoyaltyProgram';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide';

const iconMap: Record<string, React.ElementType> = {
  award: Award,
  star: Star,
  crown: Crown,
  gift: Gift
};

const LoyaltyProgramPage: React.FC = () => {
  const { 
    tiers, 
    rewards, 
    members, 
    stats, 
    isLoading,
    createTier,
    createReward,
    deleteTier,
    deleteReward,
    isCreatingTier,
    isCreatingReward
  } = useLoyaltyProgram();

  const [newTier, setNewTier] = useState({ name: '', min_points: 0, discount_percent: 0 });
  const [newReward, setNewReward] = useState({ name: '', points_cost: 100, stock: 50 });
  const [tierDialogOpen, setTierDialogOpen] = useState(false);
  const [rewardDialogOpen, setRewardDialogOpen] = useState(false);

  const handleCreateTier = () => {
    createTier(newTier);
    setNewTier({ name: '', min_points: 0, discount_percent: 0 });
    setTierDialogOpen(false);
  };

  const handleCreateReward = () => {
    createReward(newReward);
    setNewReward({ name: '', points_cost: 100, stock: 50 });
    setRewardDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ChannablePageWrapper
      title="Programme de fidélité"
      subtitle="Marketing"
      description="Récompensez vos clients fidèles avec un système de points et de récompenses"
      heroImage="marketing"
      badge={{ label: "Loyalty", icon: Award }}
      actions={
        <Dialog open={rewardDialogOpen} onOpenChange={setRewardDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Gift className="mr-2 h-4 w-4" />
              Nouvelle récompense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une récompense</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Nom de la récompense</Label>
                <Input
                  value={newReward.name}
                  onChange={(e) => setNewReward({ ...newReward, name: e.target.value })}
                  placeholder="Ex: Bon de réduction 10€"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Points requis</Label>
                  <Input
                    type="number"
                    value={newReward.points_cost}
                    onChange={(e) => setNewReward({ ...newReward, points_cost: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Stock</Label>
                  <Input
                    type="number"
                    value={newReward.stock}
                    onChange={(e) => setNewReward({ ...newReward, stock: Number(e.target.value) })}
                  />
                </div>
              </div>
              <Button onClick={handleCreateReward} className="w-full" disabled={isCreatingReward}>
                {isCreatingReward && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Créer la récompense
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      <AdvancedFeatureGuide {...ADVANCED_GUIDES.loyalty} />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membres actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">Inscrits au programme</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Points distribués</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPointsDistributed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total cumulé</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Récompenses échangées</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rewardsRedeemed}</div>
            <p className="text-xs text-muted-foreground">{stats.rewardsValue.toLocaleString()} points utilisés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Niveaux actifs</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tiers.length}</div>
            <p className="text-xs text-muted-foreground">{rewards.length} récompenses</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tiers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tiers">Niveaux</TabsTrigger>
          <TabsTrigger value="rewards">Récompenses</TabsTrigger>
          <TabsTrigger value="members">Membres ({members.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="tiers" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={tierDialogOpen} onOpenChange={setTierDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau niveau
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un niveau de fidélité</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label>Nom du niveau</Label>
                    <Input
                      value={newTier.name}
                      onChange={(e) => setNewTier({ ...newTier, name: e.target.value })}
                      placeholder="Ex: Or, Platine..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Points minimum</Label>
                      <Input
                        type="number"
                        value={newTier.min_points}
                        onChange={(e) => setNewTier({ ...newTier, min_points: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Réduction (%)</Label>
                      <Input
                        type="number"
                        value={newTier.discount_percent}
                        onChange={(e) => setNewTier({ ...newTier, discount_percent: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <Button onClick={handleCreateTier} className="w-full" disabled={isCreatingTier}>
                    {isCreatingTier && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Créer le niveau
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {tiers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Award className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Aucun niveau configuré.<br />
                  Créez votre premier niveau de fidélité.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {tiers.map((tier) => {
                const IconComponent = iconMap[tier.icon] || Award;
                const memberCount = stats.membersByTier.find(t => t.id === tier.id)?.memberCount || 0;
                
                return (
                  <Card key={tier.id} className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                      <IconComponent className={`h-12 w-12 ${tier.color} opacity-20`} />
                    </div>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <IconComponent className={`h-6 w-6 ${tier.color}`} />
                          <CardTitle>{tier.name}</CardTitle>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => deleteTier(tier.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <CardDescription>À partir de {tier.min_points} points</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="text-2xl font-bold">{memberCount}</div>
                        <div className="text-xs text-muted-foreground">membres</div>
                      </div>
                      
                      {tier.discount_percent > 0 && (
                        <Badge variant="secondary">
                          {tier.discount_percent}% de réduction
                        </Badge>
                      )}

                      {tier.benefits.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">Avantages:</h4>
                          <ul className="space-y-1">
                            {tier.benefits.map((benefit, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                <Star className="h-3 w-3 mt-0.5 text-primary" />
                                {benefit}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Catalogue de récompenses</CardTitle>
              <CardDescription>Récompenses disponibles pour vos clients</CardDescription>
            </CardHeader>
            <CardContent>
              {rewards.length === 0 ? (
                <div className="text-center py-12">
                  <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Aucune récompense configurée.<br />
                    Créez votre première récompense.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {rewards.map((reward) => (
                    <div
                      key={reward.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Gift className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{reward.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Stock: {reward.stock ?? 'Illimité'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary" className="gap-1">
                          <Star className="h-3 w-3" />
                          {reward.points_cost} points
                        </Badge>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => deleteReward(reward.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Membres du programme</CardTitle>
              <CardDescription>Clients inscrits au programme de fidélité</CardDescription>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Aucun membre inscrit.<br />
                    Les clients seront ajoutés automatiquement.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">
                            {member.customers?.first_name} {member.customers?.last_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {member.customers?.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {member.loyalty_tiers && (
                          <Badge variant="outline">
                            {member.loyalty_tiers.name}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="gap-1">
                          <Star className="h-3 w-3" />
                          {member.available_points} points
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
};

export default LoyaltyProgramPage;
