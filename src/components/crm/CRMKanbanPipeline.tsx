/**
 * CRMKanbanPipeline - Pipeline visuel Kanban avec drag & drop
 * Vue Enterprise pour gestion des deals
 */
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Plus, MoreHorizontal, DollarSign, Calendar, 
  User, Phone, Mail, Building, TrendingUp,
  ChevronRight, Star, Edit, Trash2, Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useCRMDeals, CRMDeal } from '@/hooks/useCRMDeals';
import { formatDistanceToNow } from 'date-fns';
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale';

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  probability: number;
}

const stages: PipelineStage[] = [
  { id: 'prospecting', name: 'Prospection', color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200', probability: 10 },
  { id: 'qualification', name: 'Qualification', color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-200', probability: 25 },
  { id: 'proposal', name: 'Proposition', color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-200', probability: 50 },
  { id: 'negotiation', name: 'Négociation', color: 'text-orange-600', bgColor: 'bg-orange-50 border-orange-200', probability: 75 },
  { id: 'closed_won', name: 'Gagné', color: 'text-green-600', bgColor: 'bg-green-50 border-green-200', probability: 100 },
  { id: 'closed_lost', name: 'Perdu', color: 'text-red-600', bgColor: 'bg-red-50 border-red-200', probability: 0 },
];

interface DealCardProps {
  deal: CRMDeal;
  onMoveToStage: (dealId: string, stage: string) => void;
  onEdit: (deal: CRMDeal) => void;
  onDelete: (dealId: string) => void;
}

function DealCard({ deal, onMoveToStage, onEdit, onDelete }: DealCardProps) {
  const locale = useDateFnsLocale();
  const [isHovered, setIsHovered] = useState(false);

  const currentStageIndex = stages.findIndex(s => s.id === deal.stage);
  const nextStage = stages[currentStageIndex + 1];
  const prevStage = stages[currentStageIndex - 1];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group"
    >
      <Card className="hover:shadow-md transition-all cursor-pointer border-l-4 border-l-primary/50">
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold truncate">{deal.name}</h4>
              <p className="text-sm text-muted-foreground truncate">
                {formatDistanceToNow(new Date(deal.created_at), { addSuffix: true, locale })}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(deal)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                {prevStage && prevStage.id !== 'closed_lost' && (
                  <DropdownMenuItem onClick={() => onMoveToStage(deal.id, prevStage.id)}>
                    <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
                    Reculer à {prevStage.name}
                  </DropdownMenuItem>
                )}
                {nextStage && (
                  <DropdownMenuItem onClick={() => onMoveToStage(deal.id, nextStage.id)}>
                    <ChevronRight className="h-4 w-4 mr-2" />
                    Avancer à {nextStage.name}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => onDelete(deal.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Value */}
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="font-semibold text-green-600">
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(deal.value)}
            </span>
          </div>

          {/* Probability */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all"
                style={{ width: `${deal.probability}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{deal.probability}%</span>
          </div>

          {/* Quick Actions */}
          <AnimatePresence>
            {isHovered && nextStage && !deal.stage.startsWith('closed') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Button
                  size="sm"
                  className="w-full gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveToStage(deal.id, nextStage.id);
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                  {nextStage.name}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function CRMKanbanPipeline() {
  const { deals, stats, isLoading, createDeal, updateDeal, deleteDeal } = useCRMDeals();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<CRMDeal | null>(null);
  const [newDeal, setNewDeal] = useState({
    name: '',
    value: '',
    notes: '',
  });

  const dealsByStage = useMemo(() => {
    const grouped: Record<string, CRMDeal[]> = {};
    stages.forEach(stage => {
      grouped[stage.id] = deals.filter(d => d.stage === stage.id);
    });
    return grouped;
  }, [deals]);

  const stageStats = useMemo(() => {
    return stages.map(stage => ({
      ...stage,
      count: dealsByStage[stage.id]?.length || 0,
      value: dealsByStage[stage.id]?.reduce((sum, d) => sum + d.value, 0) || 0,
    }));
  }, [dealsByStage]);

  const handleMoveToStage = (dealId: string, newStage: string) => {
    const stage = stages.find(s => s.id === newStage);
    if (!stage) return;

    updateDeal({
      id: dealId,
      stage: newStage as CRMDeal['stage'],
      probability: stage.probability,
    });
    toast.success(`Deal déplacé vers "${stage.name}"`);
  };

  const handleAddDeal = () => {
    if (!newDeal.name) {
      toast.error('Le nom du deal est requis');
      return;
    }

    createDeal({
      name: newDeal.name,
      value: parseFloat(newDeal.value) || 0,
      notes: newDeal.notes,
      stage: 'prospecting',
      probability: 10,
    });

    setNewDeal({ name: '', value: '', notes: '' });
    setIsAddDialogOpen(false);
  };

  const handleDeleteDeal = (dealId: string) => {
    deleteDeal(dealId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total deals</div>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('fr-FR', { 
                    style: 'currency', 
                    currency: 'EUR',
                    maximumFractionDigits: 0 
                  }).format(stats.totalValue)}
                </div>
                <div className="text-sm text-muted-foreground">Valeur totale</div>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('fr-FR', { 
                    style: 'currency', 
                    currency: 'EUR',
                    maximumFractionDigits: 0 
                  }).format(stats.weightedValue)}
                </div>
                <div className="text-sm text-muted-foreground">Valeur pondérée</div>
              </div>
              <Star className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.won}</div>
                <div className="text-sm text-muted-foreground">Gagnés</div>
              </div>
              <Badge className="bg-green-500">{stats.lost} perdus</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Deal Button */}
      <div className="flex justify-end">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nouveau deal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un nouveau deal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nom du deal *</Label>
                <Input
                  value={newDeal.name}
                  onChange={(e) => setNewDeal(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Contrat entreprise XYZ"
                />
              </div>
              <div className="space-y-2">
                <Label>Valeur (€)</Label>
                <Input
                  type="number"
                  value={newDeal.value}
                  onChange={(e) => setNewDeal(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="10000"
                />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={newDeal.notes}
                  onChange={(e) => setNewDeal(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notes sur le deal..."
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                  Annuler
                </Button>
                <Button onClick={handleAddDeal} className="flex-1">
                  Créer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4 min-w-max">
          {stageStats.map((stage) => (
            <div
              key={stage.id}
              className={cn(
                "w-80 flex-shrink-0 rounded-lg border-2",
                stage.bgColor
              )}
            >
              {/* Stage Header */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-2">
                  <h3 className={cn("font-semibold", stage.color)}>
                    {stage.name}
                  </h3>
                  <Badge variant="secondary">{stage.count}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Intl.NumberFormat('fr-FR', { 
                    style: 'currency', 
                    currency: 'EUR',
                    maximumFractionDigits: 0 
                  }).format(stage.value)}
                </div>
              </div>

              {/* Stage Cards */}
              <div className="p-4 space-y-3 min-h-[300px]">
                <AnimatePresence mode="popLayout">
                  {dealsByStage[stage.id]?.map((deal) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      onMoveToStage={handleMoveToStage}
                      onEdit={setEditingDeal}
                      onDelete={handleDeleteDeal}
                    />
                  ))}
                </AnimatePresence>

                {dealsByStage[stage.id]?.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">Aucun deal</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
