import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Upload, Download, Mail, Bell, Settings, BarChart3, Users, Package, ShoppingCart, Zap, FileText, Link2 } from 'lucide-react';
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
  const navigate = useNavigate();

  const quickActions: QuickAction[] = [
    {
      id: 'add-product',
      title: 'Ajouter produit',
      description: 'Créer un produit',
      icon: <Package className="h-5 w-5" />,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => navigate('/products/create')
    },
    {
      id: 'create-order',
      title: 'Nouvelle commande',
      description: 'Créer commande',
      icon: <ShoppingCart className="h-5 w-5" />,
      color: 'bg-green-500 hover:bg-green-600',
      action: () => navigate('/orders/create')
    },
    {
      id: 'add-customer',
      title: 'Ajouter client',
      description: 'Nouveau client',
      icon: <Users className="h-5 w-5" />,
      color: 'bg-purple-500 hover:bg-purple-600',
      action: () => navigate('/customers/create')
    },
    {
      id: 'quick-import-url',
      title: 'Import URL',
      description: 'Coller un lien',
      icon: <Link2 className="h-5 w-5" />,
      color: 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600',
      action: () => navigate('/import/url'),
      badge: 'Nouveau'
    },
    {
      id: 'import-data',
      title: 'Importer',
      description: 'Importer données',
      icon: <Upload className="h-5 w-5" />,
      color: 'bg-orange-500 hover:bg-orange-600',
      action: () => navigate('/import/quick')
    },
    {
      id: 'create-campaign',
      title: 'Marketing',
      description: 'Nouvelle campagne',
      icon: <Mail className="h-5 w-5" />,
      color: 'bg-pink-500 hover:bg-pink-600',
      action: () => navigate('/marketing')
    },
    {
      id: 'automation',
      title: 'Automatisation',
      description: 'Workflow auto',
      icon: <Zap className="h-5 w-5" />,
      color: 'bg-yellow-500 hover:bg-yellow-600',
      action: () => navigate('/automation/workflow-builder')
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Voir performances',
      icon: <BarChart3 className="h-5 w-5" />,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      action: () => navigate('/analytics')
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Notifier users',
      icon: <Bell className="h-5 w-5" />,
      color: 'bg-red-500 hover:bg-red-600',
      action: () => navigate('/notifications/create'),
      badge: 'Nouveau'
    },
    {
      id: 'export-data',
      title: 'Exporter',
      description: 'Télécharger',
      icon: <Download className="h-5 w-5" />,
      color: 'bg-teal-500 hover:bg-teal-600',
      action: () => navigate('/dashboard')
    },
    {
      id: 'generate-report',
      title: 'Rapport',
      description: 'Générer rapport',
      icon: <FileText className="h-5 w-5" />,
      color: 'bg-slate-500 hover:bg-slate-600',
      action: () => navigate('/analytics/reports')
    },
    {
      id: 'suppliers',
      title: 'Fournisseurs',
      description: 'Gérer fournisseurs',
      icon: <Package className="h-5 w-5" />,
      color: 'bg-cyan-500 hover:bg-cyan-600',
      action: () => navigate('/suppliers')
    },
    {
      id: 'integrations',
      title: 'Intégrations',
      description: 'Connecter',
      icon: <Settings className="h-5 w-5" />,
      color: 'bg-gray-500 hover:bg-gray-600',
      action: () => navigate('/integrations')
    }
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
          Actions rapides
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        {/* Mobile: horizontal scroll, Desktop: grid */}
        <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0 sm:overflow-visible scrollbar-hide">
          <div className="flex gap-2 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 sm:gap-3 min-w-max sm:min-w-0">
            {quickActions.map(action => (
              <Button
                key={action.id}
                variant="outline"
                className={`h-auto p-2 sm:p-3 flex flex-col items-center gap-1 sm:gap-2 relative ${action.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'} transition-all duration-200 min-h-[70px] sm:min-h-[90px] w-[72px] sm:w-auto flex-shrink-0`}
                onClick={action.action}
                disabled={action.disabled}
              >
                {action.badge && (
                  <Badge variant="secondary" className="absolute -top-1.5 -right-1.5 text-[10px] px-1 py-0">
                    {action.badge}
                  </Badge>
                )}
                
                <div className={`p-1.5 sm:p-2 rounded-lg text-white ${action.color}`}>
                  {action.icon}
                </div>
                
                <div className="text-center w-full overflow-hidden">
                  <div className="font-medium text-[10px] sm:text-xs leading-tight line-clamp-2">{action.title}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};