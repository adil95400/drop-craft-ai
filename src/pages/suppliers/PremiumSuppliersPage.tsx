import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Crown, Shield, Star, Package, Truck, Search, Filter,
  BadgeCheck, TrendingUp, Globe, Award,
} from 'lucide-react';

const TIER_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  platinum: { label: 'Platinum', color: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200', icon: <Crown className="h-4 w-4" /> },
  gold: { label: 'Gold', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: <Award className="h-4 w-4" /> },
  silver: { label: 'Silver', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', icon: <Shield className="h-4 w-4" /> },
  standard: { label: 'Standard', color: 'bg-muted text-muted-foreground', icon: <Package className="h-4 w-4" /> },
};

export default function PremiumSuppliersPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['premium-suppliers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user.id)
        .order('is_verified', { ascending: false })
        .order('rating', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const filtered = suppliers.filter((s: any) => {
    const matchesSearch = !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.country?.toLowerCase().includes(search.toLowerCase());
    const matchesTier = tierFilter === 'all' || s.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const verified = suppliers.filter((s: any) => s.is_verified);
  const avgRating = verified.length > 0 ? (verified.reduce((sum: number, s: any) => sum + (s.rating || 0), 0) / verified.length).toFixed(1) : '0';

  if (isLoading) {
    return (
      <ChannablePageWrapper title="Fournisseurs Premium" description="Chargement..." heroImage="suppliers" badge={{ label: 'Premium', icon: Crown }}>
        <div className="grid gap-4 md:grid-cols-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}</div>
      </ChannablePageWrapper>
    );
  }

  return (
    <ChannablePageWrapper
      title="Fournisseurs Premium"
      description="Fournisseurs vérifiés avec badges, scoring et catalogue haute marge"
      heroImage="suppliers"
      badge={{ label: 'Premium', icon: Crown }}
    >
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total fournisseurs</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vérifiés</CardTitle>
            <BadgeCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{verified.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Note moyenne</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgRating}/5</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platinum/Gold</CardTitle>
            <Crown className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.filter((s: any) => s.tier === 'platinum' || s.tier === 'gold').length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher un fournisseur..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les tiers</SelectItem>
            <SelectItem value="platinum">Platinum</SelectItem>
            <SelectItem value="gold">Gold</SelectItem>
            <SelectItem value="silver">Silver</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Supplier Cards */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun fournisseur trouvé</h3>
            <p className="text-muted-foreground">Ajoutez des fournisseurs depuis la page Fournisseurs</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((supplier: any) => {
            const tier = TIER_CONFIG[supplier.tier || 'standard'];
            return (
              <Card key={supplier.id} className="relative overflow-hidden">
                {supplier.is_verified && (
                  <div className="absolute top-3 right-3">
                    <BadgeCheck className="h-5 w-5 text-green-500" />
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                      {supplier.name?.charAt(0)?.toUpperCase() || 'S'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{supplier.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={tier.color}>
                          {tier.icon}
                          <span className="ml-1">{tier.label}</span>
                        </Badge>
                        {supplier.country && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Globe className="h-3 w-3" />{supplier.country}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {supplier.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{supplier.description}</p>
                  )}
                  
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-3.5 w-3.5 text-yellow-500" />
                        <span className="font-semibold text-sm">{supplier.rating || '—'}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Note</span>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1">
                        <Truck className="h-3.5 w-3.5 text-blue-500" />
                        <span className="font-semibold text-sm">{supplier.avg_delivery_days ? `${supplier.avg_delivery_days}j` : '—'}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Livraison</span>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                        <span className="font-semibold text-sm">{supplier.total_orders || 0}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Commandes</span>
                    </div>
                  </div>

                  {supplier.specialties?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {supplier.specialties.slice(0, 3).map((s: string) => (
                        <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  )}

                  <Button variant="outline" size="sm" className="w-full">
                    Voir le catalogue
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </ChannablePageWrapper>
  );
}
