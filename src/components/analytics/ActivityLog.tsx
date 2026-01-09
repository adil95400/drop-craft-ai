import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, Search, Filter, User, ShoppingCart, Package, 
  Edit, Trash, Plus, Eye, Download, Upload, Settings,
  CheckCircle, AlertCircle, Clock
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ActivityItem {
  id: string;
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  action: string;
  actionType: 'create' | 'update' | 'delete' | 'view' | 'export' | 'import' | 'settings';
  target: string;
  targetType: 'order' | 'product' | 'customer' | 'report' | 'settings' | 'team';
  timestamp: Date;
  status: 'success' | 'pending' | 'failed';
  details?: string;
}

const mockActivities: ActivityItem[] = [
  {
    id: '1',
    user: { name: 'Jean Dupont', email: 'jean@example.com' },
    action: 'Commande validée',
    actionType: 'update',
    target: 'Commande #12345',
    targetType: 'order',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    status: 'success',
    details: 'Statut changé de "en attente" à "validée"'
  },
  {
    id: '2',
    user: { name: 'Marie Martin', email: 'marie@example.com' },
    action: 'Produit ajouté',
    actionType: 'create',
    target: 'Casque Bluetooth Pro',
    targetType: 'product',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    status: 'success',
  },
  {
    id: '3',
    user: { name: 'Pierre Durand', email: 'pierre@example.com' },
    action: 'Rapport exporté',
    actionType: 'export',
    target: 'Rapport ventes Q4',
    targetType: 'report',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'success',
  },
  {
    id: '4',
    user: { name: 'Sophie Bernard', email: 'sophie@example.com' },
    action: 'Client modifié',
    actionType: 'update',
    target: 'Client #8901',
    targetType: 'customer',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    status: 'success',
    details: 'Adresse de livraison mise à jour'
  },
  {
    id: '5',
    user: { name: 'Jean Dupont', email: 'jean@example.com' },
    action: 'Import produits',
    actionType: 'import',
    target: '150 produits',
    targetType: 'product',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    status: 'pending',
    details: 'Import en cours...'
  },
  {
    id: '6',
    user: { name: 'Admin', email: 'admin@example.com' },
    action: 'Paramètres modifiés',
    actionType: 'settings',
    target: 'Notifications email',
    targetType: 'settings',
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
    status: 'success',
  },
  {
    id: '7',
    user: { name: 'Marie Martin', email: 'marie@example.com' },
    action: 'Commande supprimée',
    actionType: 'delete',
    target: 'Commande #12340',
    targetType: 'order',
    timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000),
    status: 'failed',
    details: 'Échec: commande déjà expédiée'
  },
];

const actionIcons = {
  create: Plus,
  update: Edit,
  delete: Trash,
  view: Eye,
  export: Download,
  import: Upload,
  settings: Settings,
};

const targetIcons = {
  order: ShoppingCart,
  product: Package,
  customer: User,
  report: Activity,
  settings: Settings,
  team: User,
};

const statusConfig = {
  success: { icon: CheckCircle, color: 'text-green-500', label: 'Succès' },
  pending: { icon: Clock, color: 'text-yellow-500', label: 'En cours' },
  failed: { icon: AlertCircle, color: 'text-red-500', label: 'Échec' },
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR');
}

export function ActivityLog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredActivities = mockActivities.filter(activity => {
    const matchesSearch = 
      activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.user.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || activity.actionType === filterType;
    const matchesStatus = filterStatus === 'all' || activity.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Journal d'activité</h2>
          <p className="text-sm text-muted-foreground">Historique des actions de l'équipe</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une activité..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="create">Création</SelectItem>
                  <SelectItem value="update">Modification</SelectItem>
                  <SelectItem value="delete">Suppression</SelectItem>
                  <SelectItem value="export">Export</SelectItem>
                  <SelectItem value="import">Import</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="success">Succès</SelectItem>
                  <SelectItem value="pending">En cours</SelectItem>
                  <SelectItem value="failed">Échec</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {filteredActivities.map((activity) => {
                const ActionIcon = actionIcons[activity.actionType];
                const TargetIcon = targetIcons[activity.targetType];
                const StatusIcon = statusConfig[activity.status].icon;
                
                return (
                  <div 
                    key={activity.id} 
                    className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={activity.user.avatar} />
                      <AvatarFallback>
                        {activity.user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{activity.user.name}</span>
                        <Badge variant="outline" className="text-xs">
                          <ActionIcon className="h-3 w-3 mr-1" />
                          {activity.action}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <TargetIcon className="h-3 w-3" />
                        <span>{activity.target}</span>
                      </div>
                      
                      {activity.details && (
                        <p className="text-xs text-muted-foreground mt-2 bg-muted p-2 rounded">
                          {activity.details}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                      <div className={`flex items-center gap-1 text-xs ${statusConfig[activity.status].color}`}>
                        <StatusIcon className="h-3 w-3" />
                        <span>{statusConfig[activity.status].label}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {filteredActivities.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune activité trouvée</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
