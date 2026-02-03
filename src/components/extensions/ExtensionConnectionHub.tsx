/**
 * Extension Connection Hub - Real-time import dashboard
 * Shows connection status, import history, and quick actions
 */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Chrome, 
  CheckCircle2, 
  XCircle, 
  Clock,
  RefreshCw,
  Download,
  Settings,
  Copy,
  Eye,
  EyeOff,
  Zap,
  Package,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { 
  useExtensionConnectionStatus, 
  useGenerateExtensionToken 
} from '@/hooks/useExtensionRealtimeImport';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function ExtensionConnectionHub() {
  const { user } = useAuth();
  const { data: connectionStatus, isLoading: isLoadingStatus } = useExtensionConnectionStatus();
  const generateToken = useGenerateExtensionToken();
  const [showToken, setShowToken] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  // Fetch import history
  const { data: importHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['extension-import-history', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('imported_products')
        .select('id, name, source_platform, price, quality_score, status, imported_at, image_urls')
        .eq('user_id', user.id)
        .order('imported_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch import stats
  const { data: importStats } = useQuery({
    queryKey: ['extension-import-stats', user?.id],
    queryFn: async () => {
      if (!user) return { today: 0, week: 0, total: 0, avgScore: 0 };
      
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: todayData } = await supabase
        .from('imported_products')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .gte('imported_at', todayStart);

      const { data: weekData } = await supabase
        .from('imported_products')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .gte('imported_at', weekStart);

      const { data: totalData } = await supabase
        .from('imported_products')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id);

      // Quality score would come from a separate calculation or table
      const avgScore = 85; // Default good score

      return {
        today: todayData?.length || 0,
        week: weekData?.length || 0,
        total: totalData?.length || 0,
        avgScore,
      };
    },
    enabled: !!user,
  });

  const handleGenerateToken = async () => {
    try {
      const result = await generateToken.mutateAsync();
      setGeneratedToken(result.token);
      setShowToken(true);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleCopyToken = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken);
      toast.success('Token copié dans le presse-papier');
    }
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      aliexpress: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
      amazon: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
      ebay: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
      temu: 'bg-pink-500/10 text-pink-600 border-pink-500/30',
      shopify: 'bg-green-500/10 text-green-600 border-green-500/30',
      etsy: 'bg-orange-600/10 text-orange-700 border-orange-600/30',
    };
    return colors[platform] || 'bg-gray-500/10 text-gray-600 border-gray-500/30';
  };

  return (
    <div className="space-y-6">
      {/* Connection Status Header */}
      <Card className="overflow-hidden">
        <div className={cn(
          "h-2 w-full",
          connectionStatus?.connected ? "bg-green-500" : "bg-amber-500"
        )} />
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-3 rounded-xl",
                connectionStatus?.connected 
                  ? "bg-green-500/10 text-green-600" 
                  : "bg-amber-500/10 text-amber-600"
              )}>
                <Chrome className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Extension ShopOpti+
                  {connectionStatus?.connected ? (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Connectée
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                      <Clock className="h-3 w-3 mr-1" />
                      Déconnectée
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {connectionStatus?.lastSeen 
                    ? `Dernière activité: ${new Date(connectionStatus.lastSeen).toLocaleString('fr-FR')}`
                    : 'Aucune connexion récente'
                  }
                </CardDescription>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleGenerateToken}
              disabled={generateToken.isPending}
            >
              {generateToken.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Générer nouveau token
            </Button>
          </div>
        </CardHeader>
        
        {generatedToken && (
          <CardContent className="pt-0">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <code className="flex-1 text-sm font-mono truncate">
                {showToken ? generatedToken : '••••••••••••••••••••••••••••••'}
              </code>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleCopyToken}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Collez ce token dans l'extension Chrome pour la connecter à votre compte.
            </p>
          </CardContent>
        )}
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{importStats?.today || 0}</p>
                  <p className="text-sm text-muted-foreground">Aujourd'hui</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{importStats?.week || 0}</p>
                  <p className="text-sm text-muted-foreground">Cette semaine</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-green-500/10 text-green-600">
                  <Download className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{importStats?.total || 0}</p>
                  <p className="text-sm text-muted-foreground">Total importé</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{importStats?.avgScore || 0}%</p>
                  <p className="text-sm text-muted-foreground">Score qualité</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Import History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Historique d'import
          </CardTitle>
          <CardDescription>
            Derniers produits importés via l'extension
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !importHistory?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Aucun produit importé</p>
              <p className="text-sm">
                Utilisez l'extension Chrome pour importer vos premiers produits
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {importHistory.map((product: any) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* Product Image */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {product.image_urls?.[0] ? (
                      <img 
                        src={product.image_urls[0]} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", getPlatformColor(product.source_platform))}
                      >
                        {product.source_platform}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(product.imported_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>

                  {/* Price & Score */}
                  <div className="text-right">
                    <p className="font-semibold">{product.price?.toFixed(2)} €</p>
                    {product.quality_score && (
                      <div className="flex items-center gap-1 justify-end">
                        <Progress 
                          value={product.quality_score} 
                          className="w-16 h-1.5"
                        />
                        <span className="text-xs text-muted-foreground">
                          {product.quality_score}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <Badge 
                    variant={product.status === 'imported' ? 'default' : 'secondary'}
                  >
                    {product.status === 'imported' ? (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    ) : (
                      <AlertCircle className="h-3 w-3 mr-1" />
                    )}
                    {product.status}
                  </Badge>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
