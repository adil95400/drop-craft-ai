/**
 * Admin Feature Flags Manager Component
 * Allows admins to manage feature flags from the dashboard
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Flag, 
  RefreshCw, 
  Plus, 
  History, 
  Users, 
  Percent,
  Shield,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

import type { Json } from '@/integrations/supabase/types';

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
  is_enabled: boolean;
  is_public: boolean;
  min_plan: string;
  rollout_percentage: number;
  allowed_user_ids: string[];
  blocked_user_ids: string[];
  metadata: Json;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

interface AuditLogEntry {
  id: string;
  flag_key: string;
  action: string;
  actor_id: string | null;
  old_value: Json | null;
  new_value: Json | null;
  created_at: string;
}

const PLAN_OPTIONS = ['free', 'starter', 'pro', 'enterprise', 'ultra_pro'];
const CATEGORY_OPTIONS = ['general', 'products', 'analytics', 'automation', 'integrations', 'api', 'extension'];

export function FeatureFlagsManager() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // New flag form state
  const [newFlag, setNewFlag] = useState({
    key: '',
    name: '',
    description: '',
    category: 'general',
    min_plan: 'free',
    rollout_percentage: 100,
  });

  useEffect(() => {
    loadFlags();
    loadAuditLogs();
  }, []);

  const loadFlags = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('category', { ascending: true })
        .order('key', { ascending: true });

      if (error) throw error;
      setFlags(data || []);
    } catch (error) {
      console.error('Error loading flags:', error);
      toast.error('Erreur lors du chargement des feature flags');
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('feature_flag_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    }
  };

  const toggleFlag = async (flag: FeatureFlag) => {
    try {
      const { error } = await supabase
        .from('feature_flags')
        .update({ is_enabled: !flag.is_enabled })
        .eq('id', flag.id);

      if (error) throw error;

      setFlags((prev) =>
        prev.map((f) =>
          f.id === flag.id ? { ...f, is_enabled: !f.is_enabled } : f
        )
      );

      toast.success(
        `Flag "${flag.name}" ${!flag.is_enabled ? 'activé' : 'désactivé'}`
      );
      loadAuditLogs();
    } catch (error) {
      console.error('Error toggling flag:', error);
      toast.error('Erreur lors de la mise à jour du flag');
    }
  };

  const updateRollout = async (flag: FeatureFlag, percentage: number) => {
    try {
      const { error } = await supabase
        .from('feature_flags')
        .update({ rollout_percentage: percentage })
        .eq('id', flag.id);

      if (error) throw error;

      setFlags((prev) =>
        prev.map((f) =>
          f.id === flag.id ? { ...f, rollout_percentage: percentage } : f
        )
      );

      toast.success(`Rollout mis à jour à ${percentage}%`);
    } catch (error) {
      console.error('Error updating rollout:', error);
      toast.error('Erreur lors de la mise à jour du rollout');
    }
  };

  const updateMinPlan = async (flag: FeatureFlag, plan: string) => {
    try {
      const { error } = await supabase
        .from('feature_flags')
        .update({ min_plan: plan })
        .eq('id', flag.id);

      if (error) throw error;

      setFlags((prev) =>
        prev.map((f) => (f.id === flag.id ? { ...f, min_plan: plan } : f))
      );

      toast.success(`Plan minimum mis à jour: ${plan}`);
      loadAuditLogs();
    } catch (error) {
      console.error('Error updating min plan:', error);
      toast.error('Erreur lors de la mise à jour du plan');
    }
  };

  const createFlag = async () => {
    try {
      const { error } = await supabase.from('feature_flags').insert({
        key: newFlag.key,
        name: newFlag.name,
        description: newFlag.description || null,
        category: newFlag.category,
        min_plan: newFlag.min_plan,
        rollout_percentage: newFlag.rollout_percentage,
        is_enabled: false,
        is_public: true,
      });

      if (error) throw error;

      toast.success('Feature flag créé avec succès');
      setIsCreateDialogOpen(false);
      setNewFlag({
        key: '',
        name: '',
        description: '',
        category: 'general',
        min_plan: 'free',
        rollout_percentage: 100,
      });
      loadFlags();
      loadAuditLogs();
    } catch (error) {
      console.error('Error creating flag:', error);
      toast.error('Erreur lors de la création du flag');
    }
  };

  const filteredFlags = flags.filter((flag) => {
    const matchesCategory =
      activeCategory === 'all' || flag.category === activeCategory;
    const matchesSearch =
      flag.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flag.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = ['all', ...new Set(flags.map((f) => f.category))];

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case 'free':
        return 'secondary';
      case 'starter':
        return 'outline';
      case 'pro':
        return 'default';
      case 'enterprise':
      case 'ultra_pro':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Flag className="h-6 w-6" />
            Gestion des Feature Flags
          </h2>
          <p className="text-muted-foreground">
            Contrôlez les fonctionnalités disponibles pour vos utilisateurs
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadFlags} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Flag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un Feature Flag</DialogTitle>
                <DialogDescription>
                  Ajoutez un nouveau flag pour contrôler une fonctionnalité
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Clé (unique)</Label>
                  <Input
                    value={newFlag.key}
                    onChange={(e) =>
                      setNewFlag({ ...newFlag, key: e.target.value })
                    }
                    placeholder="feature.name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input
                    value={newFlag.name}
                    onChange={(e) =>
                      setNewFlag({ ...newFlag, name: e.target.value })
                    }
                    placeholder="Nom de la fonctionnalité"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={newFlag.description}
                    onChange={(e) =>
                      setNewFlag({ ...newFlag, description: e.target.value })
                    }
                    placeholder="Description optionnelle"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Catégorie</Label>
                    <Select
                      value={newFlag.category}
                      onValueChange={(v) =>
                        setNewFlag({ ...newFlag, category: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Plan Minimum</Label>
                    <Select
                      value={newFlag.min_plan}
                      onValueChange={(v) =>
                        setNewFlag({ ...newFlag, min_plan: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PLAN_OPTIONS.map((plan) => (
                          <SelectItem key={plan} value={plan}>
                            {plan}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Rollout: {newFlag.rollout_percentage}%</Label>
                  <Slider
                    value={[newFlag.rollout_percentage]}
                    onValueChange={([v]) =>
                      setNewFlag({ ...newFlag, rollout_percentage: v })
                    }
                    max={100}
                    step={5}
                  />
                </div>
                <Button onClick={createFlag} className="w-full">
                  Créer le Flag
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="flags" className="space-y-4">
        <TabsList>
          <TabsTrigger value="flags" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Flags
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flags" className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Rechercher un flag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <div className="flex gap-2">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat === 'all' ? 'Tous' : cat}
                </Button>
              ))}
            </div>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Flag</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Plan Min</TableHead>
                  <TableHead>Rollout</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFlags.map((flag) => (
                  <TableRow key={flag.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{flag.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {flag.key}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{flag.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={flag.min_plan}
                        onValueChange={(v) => updateMinPlan(flag, v)}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PLAN_OPTIONS.map((plan) => (
                            <SelectItem key={plan} value={plan}>
                              <Badge variant={getPlanBadgeVariant(plan)}>
                                {plan}
                              </Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-muted-foreground" />
                        <Slider
                          value={[flag.rollout_percentage]}
                          onValueChange={([v]) => updateRollout(flag, v)}
                          max={100}
                          step={5}
                          className="w-20"
                        />
                        <span className="text-sm w-10">
                          {flag.rollout_percentage}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={flag.is_enabled ? 'default' : 'secondary'}
                      >
                        {flag.is_enabled ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={flag.is_enabled}
                        onCheckedChange={() => toggleFlag(flag)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Audit Trail
              </CardTitle>
              <CardDescription>
                Historique des modifications des feature flags
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Flag</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Détails</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {format(new Date(log.created_at), 'Pp', { locale: getDateFnsLocale() })}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.flag_key}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            log.action === 'created'
                              ? 'default'
                              : log.action === 'deleted'
                              ? 'destructive'
                              : 'outline'
                          }
                        >
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                        {log.new_value
                          ? JSON.stringify(log.new_value).slice(0, 50) + '...'
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
