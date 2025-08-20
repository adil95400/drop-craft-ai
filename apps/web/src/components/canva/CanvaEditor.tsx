import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCanva } from '@/hooks/useCanva';
import { Palette, Plus, ExternalLink, RefreshCw, Trash2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CanvaDesign {
  id: string;
  canva_design_id: string;
  title: string;
  design_type: string;
  thumbnail_url?: string;
  design_url?: string;
  export_urls?: Record<string, string>;
  status: string;
  created_at: string;
  updated_at: string;
}

interface CanvaEditorProps {
  onDesignCreated?: (design: CanvaDesign) => void;
  onDesignUpdated?: (design: CanvaDesign) => void;
}

export const CanvaEditor: React.FC<CanvaEditorProps> = ({
  onDesignCreated,
  onDesignUpdated
}) => {
  const [designs, setDesigns] = useState<CanvaDesign[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  
  const {
    isConnecting,
    isLoading,
    connectCanva,
    disconnectCanva,
    checkConnectionStatus,
    getDesigns,
    getIntegration,
    openCanvaEditor
  } = useCanva();
  
  const { toast } = useToast();

  useEffect(() => {
    initializeCanvaConnection();
  }, []);

  const initializeCanvaConnection = async () => {
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

  const handleConnect = async () => {
    const success = await connectCanva();
    if (success) {
      setIsConnected(true);
      loadDesigns();
    }
  };

  const handleDisconnect = async () => {
    const success = await disconnectCanva();
    if (success) {
      setIsConnected(false);
      setDesigns([]);
    }
  };

  const handleCreateNew = () => {
    const template = selectedTemplate || undefined;
    openCanvaEditor(undefined, template);
    
    toast({
      title: "Éditeur ouvert",
      description: "L'éditeur Canva s'ouvre dans une nouvelle fenêtre"
    });
  };

  const handleEditDesign = (design: CanvaDesign) => {
    openCanvaEditor(design.canva_design_id);
    
    toast({
      title: "Design ouvert",
      description: `Édition de "${design.title}" dans Canva`
    });
  };

  const handleRefresh = () => {
    loadDesigns();
    toast({
      title: "Actualisation",
      description: "Liste des designs mise à jour"
    });
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

  const templateOptions = [
    { id: '', name: 'Design vierge' },
    { id: 'social-media', name: 'Post réseaux sociaux' },
    { id: 'presentation', name: 'Présentation' },
    { id: 'logo', name: 'Logo' },
    { id: 'poster', name: 'Affiche' },
    { id: 'flyer', name: 'Flyer' },
    { id: 'instagram-post', name: 'Post Instagram' },
    { id: 'facebook-cover', name: 'Couverture Facebook' }
  ];

  if (!isConnected) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
            <Palette className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Intégration Canva</CardTitle>
          <CardDescription>
            Connectez votre compte Canva pour créer et gérer vos designs directement depuis votre SaaS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-900 mb-2">Fonctionnalités disponibles :</h3>
            <ul className="space-y-2 text-sm text-purple-700">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                Créer et éditer des designs dans Canva
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                Synchronisation automatique des créations
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                Intégration dans vos produits et publicités
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                Gestion centralisée de vos assets créatifs
              </li>
            </ul>
          </div>
          
          <Button 
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            size="lg"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Connexion en cours...
              </>
            ) : (
              <>
                <Palette className="mr-2 h-4 w-4" />
                Connecter à Canva
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Palette className="h-6 w-6 text-purple-500" />
              Éditeur Canva
            </CardTitle>
            <CardDescription>
              Créez et gérez vos designs Canva depuis votre SaaS
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-600">
              Connecté
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Création de nouveau design */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Créer un nouveau design</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Type de design (optionnel)
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {templateOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
          
          <Button 
            onClick={handleCreateNew}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Créer dans Canva
          </Button>
        </CardContent>
      </Card>

      {/* Liste des designs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mes designs ({designs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {designs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Palette className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>Aucun design trouvé</p>
              <p className="text-sm">Créez votre premier design pour commencer</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {designs.map((design) => (
                <Card key={design.id} className="hover:shadow-md transition-shadow">
                  <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
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
                  
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-sm line-clamp-2">
                          {design.title}
                        </h3>
                        <Badge 
                          className={`text-xs ${getDesignTypeColor(design.design_type)}`}
                          variant="secondary"
                        >
                          {design.design_type}
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-gray-500">
                        Mis à jour le {new Date(design.updated_at).toLocaleDateString('fr-FR')}
                      </p>
                      
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditDesign(design)}
                          className="flex-1"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Éditer
                        </Button>
                        
                        {design.export_urls && Object.keys(design.export_urls).length > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const urls = design.export_urls!;
                              const firstUrl = Object.values(urls)[0];
                              if (firstUrl) {
                                window.open(firstUrl, '_blank');
                              }
                            }}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        )}
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