import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Upload,
  Download,
  Mail,
  Bell,
  Settings,
  BarChart3,
  Users,
  Package,
  ShoppingCart,
  Zap,
  FileText
} from 'lucide-react';
import { useModals } from '@/hooks/useModals';
import { useNavigate } from 'react-router-dom';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
  badge?: string;
  disabled?: boolean;
}

export const QuickActions: React.FC = () => {
  const { openModal } = useModals();
  const navigate = useNavigate();

  const quickActions: QuickAction[] = [
    {
      id: 'add-product',
      title: 'Ajouter un produit',
      description: 'Créer un nouveau produit',
      icon: <Package className="h-5 w-5" />,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => openModal('createProduct')
    },
    {
      id: 'create-order',
      title: 'Nouvelle commande',
      description: 'Créer une commande manuelle',
      icon: <ShoppingCart className="h-5 w-5" />,
      color: 'bg-green-500 hover:bg-green-600',
      action: () => openModal('createOrder')
    },
    {
      id: 'add-customer',
      title: 'Ajouter un client',
      description: 'Enregistrer un nouveau client',
      icon: <Users className="h-5 w-5" />,
      color: 'bg-purple-500 hover:bg-purple-600',
      action: () => openModal('createCustomer')
    },
    {
      id: 'import-data',
      title: 'Importer des données',
      description: 'Importer produits ou commandes',
      icon: <Upload className="h-5 w-5" />,
      color: 'bg-orange-500 hover:bg-orange-600',
      action: () => navigate('/products/import/quick')
    },
    {
      id: 'create-campaign',
      title: 'Campagne marketing',
      description: 'Lancer une nouvelle campagne',
      icon: <Mail className="h-5 w-5" />,
      color: 'bg-pink-500 hover:bg-pink-600',
      action: () => navigate('/marketing/campaigns')
    },
    {
      id: 'automation',
      title: 'Nouvelle automatisation',
      description: 'Créer un workflow automatisé',
      icon: <Zap className="h-5 w-5" />,
      color: 'bg-yellow-500 hover:bg-yellow-600',
      action: () => navigate('/automation/workflows')
    },
    {
      id: 'analytics',
      title: 'Voir les analyses',
      description: 'Consulter les performances',
      icon: <BarChart3 className="h-5 w-5" />,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      action: () => navigate('/analytics')
    },
    {
      id: 'notifications',
      title: 'Envoyer une notification',
      description: 'Notifier vos utilisateurs',
      icon: <Bell className="h-5 w-5" />,
      color: 'bg-red-500 hover:bg-red-600',
      action: () => openModal('notification'),
      badge: 'Nouveau'
    },
    {
      id: 'export-data',
      title: 'Exporter les données',
      description: 'Télécharger vos données',
      icon: <Download className="h-5 w-5" />,
      color: 'bg-teal-500 hover:bg-teal-600',
      action: () => openModal('exportData')
    },
    {
      id: 'generate-report',
      title: 'Générer un rapport',
      description: 'Créer un rapport personnalisé',
      icon: <FileText className="h-5 w-5" />,
      color: 'bg-slate-500 hover:bg-slate-600',
      action: () => navigate('/analytics/reports')
    },
    {
      id: 'suppliers',
      title: 'Gérer les fournisseurs',
      description: 'Ajouter et connecter des fournisseurs',
      icon: <Package className="h-5 w-5" />,
      color: 'bg-cyan-500 hover:bg-cyan-600',
      action: () => navigate('/products/suppliers')
    },
    {
      id: 'integrations',
      title: 'Intégrations',
      description: 'Connecter vos plateformes',
      icon: <Settings className="h-5 w-5" />,
      color: 'bg-gray-500 hover:bg-gray-600',
      action: () => navigate('/integrations')
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Actions rapides
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              className={`h-auto p-4 flex flex-col items-center gap-2 relative ${
                action.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
              } transition-all duration-200`}
              onClick={action.action}
              disabled={action.disabled}
            >
              {action.badge && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-2 -right-2 text-xs px-1.5 py-0.5"
                >
                  {action.badge}
                </Badge>
              )}
              
              <div className={`p-2 rounded-lg text-white ${action.color}`}>
                {action.icon}
              </div>
              
              <div className="text-center">
                <div className="font-medium text-sm">{action.title}</div>
                <div className="text-xs text-muted-foreground">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>

        {/* Shortcuts Info */}
        <div className="mt-6 p-3 bg-muted/50 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Raccourcis clavier :</h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div><kbd className="bg-white px-1 rounded">Ctrl+K</kbd> Recherche globale</div>
            <div><kbd className="bg-white px-1 rounded">Ctrl+N</kbd> Nouveau produit</div>
            <div><kbd className="bg-white px-1 rounded">Ctrl+O</kbd> Nouvelle commande</div>
            <div><kbd className="bg-white px-1 rounded">Ctrl+I</kbd> Import de données</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};