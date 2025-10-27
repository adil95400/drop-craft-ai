import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Sparkles, 
  Truck, 
  Shield, 
  Star, 
  TrendingUp,
  Package,
  Zap,
  CheckCircle2,
  Clock,
  Globe,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';

interface PremiumSupplier {
  id: string;
  name: string;
  display_name: string;
  description: string;
  logo_url: string;
  country: string;
  tier: 'gold' | 'platinum' | 'diamond';
  delivery_regions: string[];
  avg_delivery_days: number;
  certifications: string[];
  quality_score: number;
  reliability_score: number;
  categories: string[];
  product_count: number;
  featured: boolean;
  connection_status?: string;
}

const tierColors = {
  gold: 'from-yellow-400 to-yellow-600',
  platinum: 'from-slate-300 to-slate-500',
  diamond: 'from-cyan-400 to-blue-600'
};

const tierBadgeColors = {
  gold: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
  platinum: 'bg-gradient-to-r from-slate-300 to-slate-500',
  diamond: 'bg-gradient-to-r from-cyan-400 to-blue-600'
};

export default function PremiumSuppliersHub() {
  const [suppliers, setSuppliers] = useState<PremiumSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('browse');
  const [syncing, setSyncing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('premium-suppliers', {
        body: { action: 'browse' }
      });

      if (error) throw error;
      if (data?.success) {
        setSuppliers(data.suppliers || []);
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (supplierId: string, supplierName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('premium-suppliers', {
        body: { 
          action: 'connect',
          supplier_id: supplierId,
          markup_percentage: 30
        }
      });

      if (error) throw error;
      
      toast({
        title: '✨ Connexion réussie',
        description: data.message || `Connecté à ${supplierName}`,
      });
      
      await loadSuppliers();
    } catch (error: any) {
      toast({
        title: 'Erreur de connexion',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleSync = async (supplierId: string) => {
    setSyncing(supplierId);
    try {
      const { data, error } = await supabase.functions.invoke('premium-suppliers', {
        body: { 
          action: 'sync',
          supplier_id: supplierId
        }
      });

      if (error) throw error;
      
      toast({
        title: '🔄 Synchronisation réussie',
        description: data.message,
      });
      
      await loadSuppliers();
    } catch (error: any) {
      toast({
        title: 'Erreur de synchronisation',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSyncing(null);
    }
  };

  const getCertificationIcon = (cert: string) => {
    const icons: Record<string, React.ReactNode> = {
      'iso_9001': <Shield className="h-4 w-4" />,
      'fda_approved': <CheckCircle2 className="h-4 w-4" />,
      'ce_certified': <Shield className="h-4 w-4" />,
      'eco_friendly': <Globe className="h-4 w-4" />,
      'fair_trade': <Star className="h-4 w-4" />
    };
    return icons[cert] || <Shield className="h-4 w-4" />;
  };

  const SupplierCard = ({ supplier }: { supplier: PremiumSupplier }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300">
        {/* Header with tier badge */}
        <div className={`h-2 bg-gradient-to-r ${tierColors[supplier.tier]}`} />
        
        <div className="p-6">
          {/* Logo and Title */}
          <div className="flex items-start gap-4 mb-4">
            <img 
              src={supplier.logo_url} 
              alt={supplier.display_name}
              className="w-16 h-16 rounded-lg object-cover shadow-md"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold">{supplier.display_name}</h3>
                {supplier.featured && (
                  <Sparkles className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`${tierBadgeColors[supplier.tier]} text-white border-0`}>
                  {supplier.tier.toUpperCase()}
                </Badge>
                <span className="text-sm text-muted-foreground">{supplier.country}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {supplier.description}
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Truck className="h-4 w-4 text-primary" />
              <span>{supplier.avg_delivery_days}j livraison</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-primary" />
              <span>{supplier.product_count} produits</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 text-yellow-500" />
              <span>{supplier.quality_score}/5.0</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span>{supplier.reliability_score}/5.0</span>
            </div>
          </div>

          {/* Certifications */}
          <div className="flex flex-wrap gap-2 mb-4">
            {supplier.certifications.slice(0, 3).map((cert, idx) => (
              <Badge key={idx} variant="outline" className="flex items-center gap-1">
                {getCertificationIcon(cert)}
                <span className="text-xs">{cert.replace(/_/g, ' ')}</span>
              </Badge>
            ))}
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-4">
            {supplier.categories.slice(0, 3).map((cat, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {cat}
              </Badge>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {supplier.connection_status === 'active' ? (
              <>
                <Button 
                  className="flex-1 bg-gradient-primary" 
                  disabled={syncing === supplier.id}
                  onClick={() => handleSync(supplier.id)}
                >
                  {syncing === supplier.id ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Synchroniser
                </Button>
                <Button variant="outline" size="icon">
                  <Package className="h-4 w-4" />
                </Button>
              </>
            ) : supplier.connection_status === 'pending' ? (
              <Button className="flex-1" variant="outline" disabled>
                <Clock className="h-4 w-4 mr-2" />
                En attente d'approbation
              </Button>
            ) : (
              <Button 
                className="flex-1 bg-gradient-primary"
                onClick={() => handleConnect(supplier.id, supplier.display_name)}
              >
                <Zap className="h-4 w-4 mr-2" />
                Se connecter
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const featuredSuppliers = suppliers.filter(s => s.featured);
  const connectedSuppliers = suppliers.filter(s => s.connection_status === 'active');
  const availableSuppliers = suppliers.filter(s => !s.connection_status || s.connection_status === 'not_connected');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            Fournisseurs Premium
          </h1>
          <p className="text-muted-foreground mt-2">
            Accédez aux meilleurs fournisseurs avec livraison rapide EU/US et produits de qualité supérieure
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fournisseurs disponibles</p>
              <p className="text-2xl font-bold">{suppliers.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-500/10">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Connectés</p>
              <p className="text-2xl font-bold">{connectedSuppliers.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-yellow-500/10">
              <Sparkles className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Premium</p>
              <p className="text-2xl font-bold">{featuredSuppliers.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Truck className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Livraison rapide</p>
              <p className="text-2xl font-bold">2-5j</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browse">
            <Globe className="h-4 w-4 mr-2" />
            Parcourir
          </TabsTrigger>
          <TabsTrigger value="featured">
            <Sparkles className="h-4 w-4 mr-2" />
            Premium
          </TabsTrigger>
          <TabsTrigger value="connected">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Mes connexions ({connectedSuppliers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableSuppliers.map(supplier => (
              <SupplierCard key={supplier.id} supplier={supplier} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="featured" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredSuppliers.map(supplier => (
              <SupplierCard key={supplier.id} supplier={supplier} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="connected" className="mt-6">
          {connectedSuppliers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {connectedSuppliers.map(supplier => (
                <SupplierCard key={supplier.id} supplier={supplier} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Aucune connexion</h3>
              <p className="text-muted-foreground mb-6">
                Connectez-vous à des fournisseurs premium pour commencer
              </p>
              <Button onClick={() => setActiveTab('browse')}>
                <Sparkles className="h-4 w-4 mr-2" />
                Parcourir les fournisseurs
              </Button>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}