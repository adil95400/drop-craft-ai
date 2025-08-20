import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CanvaEditor } from '@/components/canva/CanvaEditor';
import { useCanva } from '@/hooks/useCanva';
import { 
  Palette, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Calendar,
  ExternalLink,
  Download,
  Eye,
  MoreHorizontal,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CanvaDesign {
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
}

export default function CanvaDesigns() {
  const [designs, setDesigns] = useState<CanvaDesign[]>([]);
  const [filteredDesigns, setFilteredDesigns] = useState<CanvaDesign[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isConnected, setIsConnected] = useState(false);
  
  const { 
    getDesigns, 
    checkConnectionStatus, 
    openCanvaEditor,
    isLoading 
  } = useCanva();
  
  const { toast } = useToast();

  useEffect(() => {
    initializePage();
  }, []);

  useEffect(() => {
    filterDesigns();
  }, [designs, searchTerm, selectedType]);

  const initializePage = async () => {
    const connected = await checkConnectionStatus();
    setIsConnected(connected);
    
    if (connected) {
      loadDesigns();
    }
  };

  const loadDesigns = async () => {
    const userDesigns = await getDesigns();
    setDesigns(userDesigns);
  };

  const filterDesigns = () => {
    let filtered = designs;

    // Filtrer par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(design =>
        design.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        design.design_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        design.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtrer par type
    if (selectedType !== 'all') {
      filtered = filtered.filter(design => design.design_type === selectedType);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleDesignAction = (action: string, design: CanvaDesign) => {
    switch (action) {
      case 'edit':
        openCanvaEditor(design.canva_design_id);
        break;
      case 'view':
        if (design.design_url) {
          window.open(design.design_url, '_blank');
        }
        break;
      case 'download':
        if (design.export_urls && Object.keys(design.export_urls).length > 0) {
          const firstUrl = Object.values(design.export_urls)[0];
          if (firstUrl) {
            window.open(firstUrl, '_blank');
          }
        }
        break;
    }
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto py-8">
        <CanvaEditor />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Palette className="h-8 w-8 text-purple-500" />
            Designs Canva
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez tous vos designs Canva depuis votre SaaS
          </p>
        </div>
        
        <Button 
          onClick={() => openCanvaEditor()}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau design
        </Button>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Recherche */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher des designs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filtre par type */}
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
            </div>

            {/* Mode d'affichage */}
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{designs.length}</div>
            <p className="text-sm text-muted-foreground">Total designs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{getDesignTypes().length}</div>
            <p className="text-sm text-muted-foreground">Types différents</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {designs.filter(d => new Date(d.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
            </div>
            <p className="text-sm text-muted-foreground">Modifiés cette semaine</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{filteredDesigns.length}</div>
            <p className="text-sm text-muted-foreground">Résultats filtrés</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des designs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mes designs</CardTitle>
              <CardDescription>
                {filteredDesigns.length} design{filteredDesigns.length > 1 ? 's' : ''} trouvé{filteredDesigns.length > 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Button variant="outline" onClick={loadDesigns} disabled={isLoading}>
              Actualiser
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredDesigns.length === 0 ? (
            <div className="text-center py-12">
              <Palette className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm || selectedType !== 'all' ? 'Aucun résultat' : 'Aucun design'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || selectedType !== 'all' 
                  ? 'Essayez de modifier vos critères de recherche'
                  : 'Créez votre premier design pour commencer'
                }
              </p>
              <Button 
                onClick={() => openCanvaEditor()}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer un design
              </Button>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
            }>
              {filteredDesigns.map((design) => (
                viewMode === 'grid' ? (
                  // Vue grille
                  <Card key={design.id} className="group hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                      {design.thumbnail_url ? (
                        <img
                          src={design.thumbnail_url}
                          alt={design.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Palette className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                            {design.title}
                          </h3>
                          <div className="flex items-center justify-between">
                            <Badge 
                              className={`text-xs ${getDesignTypeColor(design.design_type)}`}
                              variant="secondary"
                            >
                              {design.design_type.replace('-', ' ')}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatDate(design.updated_at)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleDesignAction('edit', design)}
                            className="flex-1"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Éditer
                          </Button>
                          
                          {design.export_urls && Object.keys(design.export_urls).length > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDesignAction('download', design)}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  // Vue liste
                  <Card key={design.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {design.thumbnail_url ? (
                            <img
                              src={design.thumbnail_url}
                              alt={design.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Palette className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold truncate">{design.title}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge 
                                  className={`text-xs ${getDesignTypeColor(design.design_type)}`}
                                  variant="secondary"
                                >
                                  {design.design_type.replace('-', ' ')}
                                </Badge>
                                <span className="text-sm text-gray-500">•</span>
                                <span className="text-sm text-gray-500">
                                  Modifié le {formatDate(design.updated_at)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                              <Button
                                size="sm"
                                onClick={() => handleDesignAction('edit', design)}
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Éditer
                              </Button>
                              
                              {design.export_urls && Object.keys(design.export_urls).length > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDesignAction('download', design)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}