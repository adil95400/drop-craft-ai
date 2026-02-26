import { useState } from 'react';
import { useReferrals } from '@/hooks/useReferrals';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Gift, Copy, Plus, ArrowRight, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

export default function ReferralPage() {
  const { codes, referrals, stats, isLoading, generateCode, isGenerating, applyCode, isApplying } = useReferrals();
  const [applyInput, setApplyInput] = useState('');
  const [customCode, setCustomCode] = useState('');

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copié !');
  };

  const shareUrl = (code: string) => {
    const url = `${window.location.origin}/auth?ref=${code}`;
    navigator.clipboard.writeText(url);
    toast.success('Lien de parrainage copié !');
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Programme de Parrainage</h1>
        <p className="text-muted-foreground">Invitez vos amis et gagnez des récompenses</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total_referred}</p>
              <p className="text-sm text-muted-foreground">Filleuls</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent">
              <Gift className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total_rewards}€</p>
              <p className="text-sm text-muted-foreground">Récompenses totales</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary">
              <TrendingUp className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.pending_rewards}€</p>
              <p className="text-sm text-muted-foreground">En attente</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generate code */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Créer un code de parrainage</CardTitle>
            <CardDescription>Générez un code unique à partager</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Code personnalisé (optionnel)"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
              maxLength={12}
            />
            <Button
              onClick={() => {
                generateCode({ custom_code: customCode || undefined, reward_value: 10, referee_reward_value: 10 });
                setCustomCode('');
              }}
              disabled={isGenerating}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Générer un code
            </Button>
          </CardContent>
        </Card>

        {/* Apply code */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Utiliser un code</CardTitle>
            <CardDescription>Entrez le code d'un ami pour recevoir votre récompense</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Ex: FRIEND2024"
              value={applyInput}
              onChange={(e) => setApplyInput(e.target.value.toUpperCase())}
            />
            <Button
              onClick={() => {
                if (applyInput) {
                  applyCode(applyInput);
                  setApplyInput('');
                }
              }}
              disabled={isApplying || !applyInput}
              variant="secondary"
              className="w-full"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Appliquer le code
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* My codes */}
      {codes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mes codes de parrainage</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Récompense parrain</TableHead>
                  <TableHead>Récompense filleul</TableHead>
                  <TableHead>Utilisations</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-bold">{c.code}</TableCell>
                    <TableCell>{c.reward_value}€</TableCell>
                    <TableCell>{c.referee_reward_value}€</TableCell>
                    <TableCell>{c.current_uses}{c.max_uses ? `/${c.max_uses}` : ''}</TableCell>
                    <TableCell>
                      <Badge variant={c.is_active ? 'default' : 'secondary'}>
                        {c.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => copyCode(c.code)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => shareUrl(c.code)}>
                        Lien
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Referral history */}
      {referrals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Historique des parrainages</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Récompense</TableHead>
                  <TableHead>Versée</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{format(new Date(r.created_at), 'dd MMM yyyy', { locale: getDateFnsLocale() })}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === 'completed' || r.status === 'rewarded' ? 'default' : 'secondary'}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{r.referrer_reward_amount}€</TableCell>
                    <TableCell>
                      <Badge variant={r.referrer_reward_given ? 'default' : 'outline'}>
                        {r.referrer_reward_given ? 'Oui' : 'En attente'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
