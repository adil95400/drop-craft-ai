/**
 * Sprint 19: Loyalty Program Management Component
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useLoyaltyProgram } from '@/hooks/useLoyaltyProgram';
import { Crown, Gift, Star, Plus, Trophy, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';

export function LoyaltyProgramManager() {
  const { tiers, rewards, members, transactions, stats, isLoading, createTier, createReward } = useLoyaltyProgram();
  const [showTierDialog, setShowTierDialog] = useState(false);
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  const [tierName, setTierName] = useState('');
  const [tierMinPoints, setTierMinPoints] = useState('0');
  const [tierDiscount, setTierDiscount] = useState('5');
  const [tierColor, setTierColor] = useState('#6366f1');
  const [rewardName, setRewardName] = useState('');
  const [rewardCost, setRewardCost] = useState('100');
  const [rewardDesc, setRewardDesc] = useState('');

  const handleCreateTier = () => {
    if (!tierName) return;
    createTier({ name: tierName, min_points: Number(tierMinPoints), discount_percent: Number(tierDiscount), color: tierColor });
    setTierName(''); setTierMinPoints('0'); setShowTierDialog(false);
  };

  const handleCreateReward = () => {
    if (!rewardName) return;
    createReward({ name: rewardName, points_cost: Number(rewardCost), description: rewardDesc });
    setRewardName(''); setRewardCost('100'); setRewardDesc(''); setShowRewardDialog(false);
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <Crown className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">Membres</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Star className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-bold">{stats.totalPointsDistributed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Points distribués</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Trophy className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-bold">{tiers.length}</div>
            <p className="text-xs text-muted-foreground">Paliers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Gift className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-bold">{rewards.filter(r => r.is_active).length}</div>
            <p className="text-xs text-muted-foreground">Récompenses</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tiers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tiers"><Trophy className="h-4 w-4 mr-1" /> Paliers</TabsTrigger>
          <TabsTrigger value="rewards"><Gift className="h-4 w-4 mr-1" /> Récompenses</TabsTrigger>
          <TabsTrigger value="members"><Crown className="h-4 w-4 mr-1" /> Membres</TabsTrigger>
          <TabsTrigger value="history"><Star className="h-4 w-4 mr-1" /> Historique</TabsTrigger>
        </TabsList>

        {/* TIERS */}
        <TabsContent value="tiers" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={showTierDialog} onOpenChange={setShowTierDialog}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-1" /> Nouveau Palier</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Créer un palier</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Nom</Label><Input value={tierName} onChange={e => setTierName(e.target.value)} placeholder="Ex: Gold" /></div>
                  <div><Label>Points minimum</Label><Input type="number" value={tierMinPoints} onChange={e => setTierMinPoints(e.target.value)} /></div>
                  <div><Label>Réduction (%)</Label><Input type="number" value={tierDiscount} onChange={e => setTierDiscount(e.target.value)} /></div>
                  <div><Label>Couleur</Label><Input type="color" value={tierColor} onChange={e => setTierColor(e.target.value)} className="h-10 w-20" /></div>
                  <Button onClick={handleCreateTier} className="w-full">Créer</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tiers.map(tier => (
              <Card key={tier.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tier.color || '#6366f1' }} />
                    <CardTitle className="text-sm">{tier.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Points min.</span>
                    <span className="font-medium">{tier.min_points.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Réduction</span>
                    <Badge variant="secondary">{tier.discount_percent}%</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            {tiers.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Aucun palier configuré</p>
                <p className="text-xs mt-1">Créez des paliers pour structurer votre programme</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* REWARDS */}
        <TabsContent value="rewards" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={showRewardDialog} onOpenChange={setShowRewardDialog}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-1" /> Nouvelle Récompense</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Créer une récompense</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Nom</Label><Input value={rewardName} onChange={e => setRewardName(e.target.value)} placeholder="Ex: -10% sur la commande" /></div>
                  <div><Label>Description</Label><Input value={rewardDesc} onChange={e => setRewardDesc(e.target.value)} placeholder="Description optionnelle" /></div>
                  <div><Label>Coût en points</Label><Input type="number" value={rewardCost} onChange={e => setRewardCost(e.target.value)} /></div>
                  <Button onClick={handleCreateReward} className="w-full">Créer</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rewards.map(reward => (
              <Card key={reward.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Gift className="h-4 w-4" /> {reward.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {reward.description && <p className="text-xs text-muted-foreground mb-2">{reward.description}</p>}
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Coût</span>
                    <Badge>{reward.points_cost} pts</Badge>
                  </div>
                  <Badge variant={reward.is_active ? 'default' : 'secondary'}>
                    {reward.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </CardContent>
              </Card>
            ))}
            {rewards.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <Gift className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Aucune récompense configurée</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* MEMBERS */}
        <TabsContent value="members" className="space-y-2">
          {members.map((cl) => (
            <Card key={cl.id}>
              <CardContent className="py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {cl.customers ? `${cl.customers.first_name || ''} ${cl.customers.last_name || ''}`.trim() || 'Client' : 'Client inconnu'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{cl.customers?.email}</p>
                </div>
                {cl.loyalty_tiers && (
                  <Badge variant="outline" className="gap-1">
                    <Crown className="h-3 w-3" /> {cl.loyalty_tiers.name}
                  </Badge>
                )}
                <div className="text-right">
                  <p className="font-bold text-sm">{cl.available_points.toLocaleString()} pts</p>
                  <p className="text-xs text-muted-foreground">dispo</p>
                </div>
                <div className="w-20 hidden sm:block">
                  <Progress value={Math.min((cl.total_points / (tiers[tiers.length - 1]?.min_points || 1000)) * 100, 100)} className="h-2" />
                </div>
              </CardContent>
            </Card>
          ))}
          {members.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Crown className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Aucun membre dans le programme</p>
            </div>
          )}
        </TabsContent>

        {/* HISTORY */}
        <TabsContent value="history" className="space-y-2">
          {transactions.map(tx => (
            <Card key={tx.id}>
              <CardContent className="py-3 flex items-center gap-4">
                <div className={`p-2 rounded-lg ${tx.points > 0 ? 'bg-primary/10' : 'bg-destructive/10'}`}>
                  {tx.points > 0 ? <ArrowUpRight className="h-4 w-4 text-primary" /> : <ArrowDownRight className="h-4 w-4 text-destructive" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{tx.description || tx.transaction_type}</p>
                  <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <Badge variant={tx.points > 0 ? 'default' : 'destructive'}>
                  {tx.points > 0 ? '+' : ''}{tx.points} pts
                </Badge>
              </CardContent>
            </Card>
          ))}
          {transactions.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Star className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Aucune transaction</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
