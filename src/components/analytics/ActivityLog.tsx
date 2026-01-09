import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Activity, Search, Filter, User, ShoppingCart, Package, 
  Edit, Trash, Plus, Eye, Download, Upload, Settings,
  CheckCircle, AlertCircle, Clock, RefreshCw
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useActivityLogs } from '@/hooks/useActivityLogs';

const actionIcons: Record<string, React.ElementType> = {
  create: Plus,
  update: Edit,
  delete: Trash,
  view: Eye,
  export: Download,
  import: Upload,
  settings: Settings,
  login: User,
  logout: User,
};

const targetIcons: Record<string, React.ElementType> = {
  order: ShoppingCart,
  product: Package,
  customer: User,
  report: Activity,
  settings: Settings,
  team: User,
  user: User,
};

const severityConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  info: { icon: CheckCircle, color: 'text-blue-500', label: 'Info' },
  success: { icon: CheckCircle, color: 'text-green-500', label: 'Succès' },
  warning: { icon: AlertCircle, color: 'text-yellow-500', label: 'Attention' },
  error: { icon: AlertCircle, color: 'text-red-500', label: 'Erreur' },
};

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
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

function getActionType(action: string): string {
  const lowerAction = action.toLowerCase();
  if (lowerAction.includes('créé') || lowerAction.includes('ajout') || lowerAction.includes('create')) return 'create';
  if (lowerAction.includes('modif') || lowerAction.includes('update') || lowerAction.includes('mis à jour')) return 'update';
  if (lowerAction.includes('supprim') || lowerAction.includes('delete')) return 'delete';
  if (lowerAction.includes('export')) return 'export';
  if (lowerAction.includes('import')) return 'import';
  if (lowerAction.includes('connexion') || lowerAction.includes('login')) return 'login';
  return 'view';
}

export function ActivityLog() {
  const { logs, isLoading } = useActivityLogs();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.entity_type || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const actionType = getActionType(log.action);
    const matchesType = filterType === 'all' || actionType === filterType;
    const matchesSeverity = filterSeverity === 'all' || (log as any).severity === filterSeverity;

    return matchesSearch && matchesType && matchesSeverity;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-10 w-full" />
          </CardHeader>
          <CardContent>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 border-b">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Journal d'activité</h2>
          <p className="text-sm text-muted-foreground">
            {logs.length} activité{logs.length > 1 ? 's' : ''} enregistrée{logs.length > 1 ? 's' : ''}
          </p>
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
                  <SelectItem value="login">Connexion</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Sévérité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Succès</SelectItem>
                  <SelectItem value="warning">Attention</SelectItem>
                  <SelectItem value="error">Erreur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune activité trouvée</p>
                  <p className="text-sm mt-1">Les activités apparaîtront ici au fur et à mesure</p>
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const actionType = getActionType(log.action);
                  const ActionIcon = actionIcons[actionType] || Activity;
                  const TargetIcon = targetIcons[log.entity_type || 'user'] || Activity;
                  const severity = (log as any).severity || 'info';
                  const severityInfo = severityConfig[severity] || severityConfig.info;
                  const StatusIcon = severityInfo.icon;
                  
                  return (
                    <div 
                      key={log.id} 
                      className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">Utilisateur</span>
                          <Badge variant="outline" className="text-xs">
                            <ActionIcon className="h-3 w-3 mr-1" />
                            {log.action}
                          </Badge>
                        </div>
                        
                        {log.entity_type && (
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <TargetIcon className="h-3 w-3" />
                            <span>{log.entity_type}{log.entity_id ? ` #${log.entity_id.slice(0, 8)}` : ''}</span>
                          </div>
                        )}
                        
                        {log.description && (
                          <p className="text-xs text-muted-foreground mt-2 bg-muted p-2 rounded">
                            {log.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatTimeAgo(log.created_at)}
                        </span>
                        <div className={`flex items-center gap-1 text-xs ${severityInfo.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          <span>{severityInfo.label}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
