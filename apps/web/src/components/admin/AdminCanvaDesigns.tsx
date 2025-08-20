import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { 
  Palette, 
  Search, 
  Users, 
  Calendar,
  ExternalLink,
  Eye,
  BarChart3,
  TrendingUp,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CanvaDesignWithUser {
  id: string;
  canva_design_id: string;
  title: string;
  design_type: string;
  thumbnail_url?: string;
  design_url?: string;
  export_urls?: Record<string, string>;
  tags?: string[];
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
}

interface CanvaIntegrationStats {
  total_users: number;
  active_integrations: number;
  total_designs: number;
  designs_this_month: number;
  popular_design_types: Array<{ type: string; count: number }>;
}

export const AdminCanvaDesigns: React.FC = () => {
  const [designs, setDesigns] = useState<CanvaDesignWithUser[]>([]);
  const [filteredDesigns, setFilteredDesigns] = useState<CanvaDesignWithUser[]>([]);
  const [stats, setStats] = useState<CanvaIntegrationStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterDesigns();
  }, [designs, searchTerm, selectedType, selectedStatus]);

  const loadData = async () => {
    setIsLoading(true);
    
    try {
      await Promise.all([
        loadDesigns(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadDesigns = async () => {
    // Récupérer tous les designs avec les informations utilisateur
    const { data: designsData, error: designsError } = await supabase
      .from('canva_designs')
      .select(`
        *,
        profiles!canva_designs_user_id_fkey (
          full_name
        )
      `)
      .order('updated_at', { ascending: false });

    if (designsError) {
      throw designsError;
    }

    // Récupérer les emails des utilisateurs depuis auth.users (via RPC si nécessaire)
    const designsWithUserInfo = await Promise.all((designsData || []).map(async (design) => {
      // Note: En réalité, vous pourriez avoir besoin d'une fonction RPC pour récupérer l'email
      // car auth.users n'est pas directement accessible
      return {
        ...design,
        user_email: `user-${design.user_id.slice(0, 8)}@example.com`, // Placeholder
        user_name: design.profiles?.full_name || 'Utilisateur inconnu'
      };
    }));

    setDesigns(designsWithUserInfo);
  };

  const loadStats = async () => {
    try {
      // Statistiques des intégrations
      const { data: integrationsData } = await supabase
        .from('canva_integrations')
        .select('user_id, status, created_at');

      // Statistiques des designs
      const { data: designsData } = await supabase
        .from('canva_designs')
        .select('design_type, status, created_at');

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Calculer les statistiques
      const totalUsers = new Set(integrationsData?.map(i => i.user_id) || []).size;
      const activeIntegrations = integrationsData?.filter(i => i.status === 'active').length || 0;
      const totalDesigns = designsData?.length || 0;
      const designsThisMonth = designsData?.filter(d => new Date(d.created_at) >= thisMonth).length || 0;

      // Types de designs populaires
      const typeCount = designsData?.reduce((acc, design) => {
        const type = design.design_type || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const popularDesignTypes = Object.entries(typeCount)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setStats({
        total_users: totalUsers,
        active_integrations: activeIntegrations,
        total_designs: totalDesigns,
        designs_this_month: designsThisMonth,
        popular_design_types: popularDesignTypes
      });

    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const filterDesigns = () => {
    let filtered = designs;

    // Filtrer par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(design =>
        design.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        design.design_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        design.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        design.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrer par type
    if (selectedType !== 'all') {
      filtered = filtered.filter(design => design.design_type === selectedType);
    }

    // Filtrer par statut
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(design => design.status === selectedStatus);
    }

    setFilteredDesigns(filtered);
  };

  const getDesignTypes = () => {
    const types = [...new Set(designs.map(design => design.design_type))];
    return types.filter(Boolean);
  };

  const getDesignTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      'social-media-post': 'bg-blue-100 text-blue-800',
      'presentation': 'bg-green-100 text-green-800',
      'logo': 'bg-purple-100 text-purple-800',
      'poster': 'bg-orange-100 text-orange-800',
      'flyer': 'bg-pink-100 text-pink-800',
      'default': 'bg-gray-100 text-gray-800'
    };
    
    return colorMap[type] || colorMap['default'];
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'active': 'bg-green-100 text-green-800',
      'deleted': 'bg-red-100 text-red-800',
      'archived': 'bg-yellow-100 text-yellow-800'
    };
    
    return colorMap[status] || colorMap['active'];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Palette className="h-6 w-6 text-purple-500" />
          Gestion des Designs Canva
        </h2>
        <p className="text-muted-foreground mt-1">
          Superviser tous les designs Canva créés par vos utilisateurs
        </p>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats.total_users}</div>
                  <p className="text-sm text-muted-foreground">Utilisateurs connectés</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold text-purple-600">{stats.total_designs}</div>
                  <p className="text-sm text-muted-foreground">Total designs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.designs_this_month}</div>
                  <p className="text-sm text-muted-foreground">Ce mois-ci</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-orange-500" />
                <div>
                  <div className="text-2xl font-bold text-orange-600">{stats.active_integrations}</div>
                  <p className="text-sm text-muted-foreground">Intégrations actives</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Types populaires */}
      {stats && stats.popular_design_types.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Types de designs populaires</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {stats.popular_design_types.map((item, index) => (
                <div key={item.type} className="text-center">
                  <div className="text-xl font-bold text-purple-600">{item.count}</div>
                  <Badge 
                    className={`${getDesignTypeColor(item.type)} text-xs`}
                    variant="secondary"
                  >
                    {item.type.replace('-', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {/* Recherche */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher designs, utilisateurs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtres */}
            <div className="flex gap-4">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">Tous les types</option>
                {getDesignTypes().map((type) => (
                  <option key={type} value={type}>
                    {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="deleted">Supprimé</option>
                <option value="archived">Archivé</option>
              </select>
            </div>

            <Button variant="outline" onClick={loadData} disabled={isLoading}>
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des designs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tous les designs</CardTitle>
              <CardDescription>
                {filteredDesigns.length} design{filteredDesigns.length > 1 ? 's' : ''} trouvé{filteredDesigns.length > 1 ? 's' : ''}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Chargement...</p>
            </div>
          ) : filteredDesigns.length === 0 ? (
            <div className="text-center py-12">
              <Palette className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun design trouvé</h3>
              <p className="text-gray-500">
                {searchTerm || selectedType !== 'all' || selectedStatus !== 'all'
                  ? 'Essayez de modifier vos critères de recherche'
                  : 'Aucun design Canva n\'a encore été créé'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDesigns.map((design) => (
                <Card key={design.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {design.thumbnail_url ? (
                          <img
                            src={design.thumbnail_url}
                            alt={design.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Palette className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{design.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                className={`text-xs ${getDesignTypeColor(design.design_type)}`}
                                variant="secondary"
                              >
                                {design.design_type.replace('-', ' ')}
                              </Badge>
                              <Badge 
                                className={`text-xs ${getStatusColor(design.status)}`}
                                variant="secondary"
                              >
                                {design.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {design.user_name}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(design.updated_at)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                            {design.design_url && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(design.design_url, '_blank')}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Voir
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              onClick={() => window.open(`https://www.canva.com/design/${design.canva_design_id}`, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Ouvrir dans Canva
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};