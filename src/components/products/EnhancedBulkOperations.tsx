import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AsyncButton } from '@/components/ui/async-button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useConfirm } from '@/hooks/useConfirm';
import { 
  Grid3X3, 
  Edit, 
  Trash2, 
  Copy, 
  Download, 
  Package, 
  Tag, 
  Archive,
  Sparkles,
  DollarSign,
  TrendingUp,
  Image,
  FileText,
  Globe,
  Zap,
  RotateCcw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface EnhancedBulkOperationsProps {
  selectedProducts: string[];
  products: any[];
  onClearSelection: () => void;
  onRefresh?: () => void;
}

export function EnhancedBulkOperations({ 
  selectedProducts, 
  products,
  onClearSelection,
  onRefresh
}: EnhancedBulkOperationsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { confirm, confirmState } = useConfirm();
  
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPriceDialog, setShowPriceDialog] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState('');
  
  // État des modifications
  const [editData, setEditData] = useState({
    category: '',
    status: '',
    tags: '',
    applyCategory: false,
    applyStatus: false,
    applyTags: false
  });
  
  const [priceData, setPriceData] = useState({
    adjustmentType: 'percentage' as 'percentage' | 'fixed' | 'margin',
    adjustmentValue: 0,
    roundTo: 'none' as 'none' | '0.99' | '0.95' | '0.00'
  });

  const selectedProductsData = products.filter(p => selectedProducts.includes(p.id));

  if (selectedProducts.length === 0) return null;

  // Statistiques des sélectionnés
  const stats = {
    totalValue: selectedProductsData.reduce((sum, p) => sum + (p.price || 0), 0),
    avgPrice: selectedProductsData.length > 0 
      ? selectedProductsData.reduce((sum, p) => sum + (p.price || 0), 0) / selectedProductsData.length 
      : 0,
    active: selectedProductsData.filter(p => p.status === 'active').length,
    withImages: selectedProductsData.filter(p => p.image_url).length,
    withDescription: selectedProductsData.filter(p => p.description).length
  };

  const handleBulkEdit = async () => {
    setIsProcessing(true);
    setCurrentOperation('Mise à jour en cours...');
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const updates: Record<string, any> = {};
      
      if (editData.applyCategory && editData.category) {
        updates.category = editData.category;
      }
      if (editData.applyStatus && editData.status) {
        updates.status = editData.status;
      }
      
      if (Object.keys(updates).length === 0) {
        toast({ title: 'Aucune modification', description: 'Sélectionnez au moins un champ à modifier' });
        setIsProcessing(false);
        return;
      }

      let completed = 0;
      for (const id of selectedProducts) {
        await supabase.from('products').update(updates).eq('id', id);
        completed++;
        setProgress((completed / selectedProducts.length) * 100);
      }
      
      toast({
        title: 'Modifications appliquées',
        description: `${selectedProducts.length} produits mis à jour`
      });
      
      queryClient.invalidateQueries({ queryKey: ['unified-products'] });
      setShowEditDialog(false);
      onClearSelection();
      onRefresh?.();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de la mise à jour',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleBulkPriceAdjust = async () => {
    setIsProcessing(true);
    setCurrentOperation('Ajustement des prix...');
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      let completed = 0;
      for (const product of selectedProductsData) {
        let newPrice = product.price;
        
        if (priceData.adjustmentType === 'percentage') {
          newPrice = product.price * (1 + priceData.adjustmentValue / 100);
        } else if (priceData.adjustmentType === 'fixed') {
          newPrice = product.price + priceData.adjustmentValue;
        } else if (priceData.adjustmentType === 'margin' && product.cost_price) {
          newPrice = product.cost_price * (1 + priceData.adjustmentValue / 100);
        }
        
        // Arrondi
        if (priceData.roundTo === '0.99') {
          newPrice = Math.floor(newPrice) + 0.99;
        } else if (priceData.roundTo === '0.95') {
          newPrice = Math.floor(newPrice) + 0.95;
        } else if (priceData.roundTo === '0.00') {
          newPrice = Math.round(newPrice);
        }
        
        await supabase.from('products').update({ price: Math.max(0, newPrice) }).eq('id', product.id);
        completed++;
        setProgress((completed / selectedProducts.length) * 100);
      }
      
      toast({
        title: 'Prix ajustés',
        description: `${selectedProducts.length} produits mis à jour`
      });
      
      queryClient.invalidateQueries({ queryKey: ['unified-products'] });
      setShowPriceDialog(false);
      onClearSelection();
      onRefresh?.();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de l\'ajustement',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleBulkDuplicate = async () => {
    setIsProcessing(true);
    setCurrentOperation('Duplication...');
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');
      
      let completed = 0;
      for (const product of selectedProductsData) {
        const { id, created_at, updated_at, ...productData } = product;
        await supabase.from('products').insert({
          ...productData,
          name: `${product.name} (copie)`,
          user_id: user.id
        });
        completed++;
        setProgress((completed / selectedProducts.length) * 100);
      }
      
      toast({
        title: 'Duplication réussie',
        description: `${selectedProducts.length} produits dupliqués`
      });
      
      queryClient.invalidateQueries({ queryKey: ['unified-products'] });
      onClearSelection();
      onRefresh?.();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de la duplication',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleBulkDelete = async () => {
    const confirmed = await confirm({
      title: 'Supprimer les produits',
      description: `Supprimer définitivement ${selectedProducts.length} produit(s) ? Cette action est irréversible.`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      variant: 'destructive'
    });

    if (!confirmed) return;

    setIsProcessing(true);
    setCurrentOperation('Suppression...');
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', selectedProducts);
      
      if (error) throw error;
      
      toast({
        title: 'Suppression réussie',
        description: `${selectedProducts.length} produits supprimés`
      });
      
      queryClient.invalidateQueries({ queryKey: ['unified-products'] });
      onClearSelection();
      onRefresh?.();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de la suppression',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkExport = async () => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', selectedProducts);
      
      if (error) throw error;
      
      // Export CSV
      const headers = Object.keys(data[0] || {}).join(',');
      const rows = data.map(p => Object.values(p).map(v => JSON.stringify(v)).join(',')).join('\n');
      const csv = `${headers}\n${rows}`;
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export_${selectedProducts.length}_produits_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      
      toast({
        title: 'Export réussi',
        description: `${selectedProducts.length} produits exportés`
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de l\'export',
        variant: 'destructive'
      });
    }
  };

  return (
    <>
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="py-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Grid3X3 className="h-4 w-4 text-primary" />
                <span>Actions groupées</span>
              </div>
              <Badge variant="secondary" className="font-bold">
                {selectedProducts.length} sélectionné{selectedProducts.length > 1 ? 's' : ''}
              </Badge>
            </div>
            
            {/* Stats rapides */}
            <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {stats.avgPrice.toFixed(2)}€ moy
              </span>
              <span className="flex items-center gap-1">
                <Image className="h-3 w-3" />
                {stats.withImages}/{selectedProducts.length}
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                {stats.active} actifs
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="py-3 pt-0">
          {isProcessing ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{currentOperation}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {/* Édition en masse */}
              <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Edit className="h-4 w-4" />
                    Éditer
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Édition en masse - {selectedProducts.length} produits</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="flex items-center gap-3">
                      <Switch 
                        checked={editData.applyCategory}
                        onCheckedChange={(v) => setEditData(d => ({ ...d, applyCategory: v }))}
                      />
                      <div className="flex-1 space-y-2">
                        <Label>Catégorie</Label>
                        <Input
                          placeholder="Nouvelle catégorie"
                          value={editData.category}
                          onChange={(e) => setEditData(d => ({ ...d, category: e.target.value }))}
                          disabled={!editData.applyCategory}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch 
                        checked={editData.applyStatus}
                        onCheckedChange={(v) => setEditData(d => ({ ...d, applyStatus: v }))}
                      />
                      <div className="flex-1 space-y-2">
                        <Label>Statut</Label>
                        <Select
                          value={editData.status}
                          onValueChange={(v) => setEditData(d => ({ ...d, status: v }))}
                          disabled={!editData.applyStatus}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Actif</SelectItem>
                            <SelectItem value="inactive">Inactif</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowEditDialog(false)}>Annuler</Button>
                    <Button onClick={handleBulkEdit}>Appliquer</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Ajustement prix */}
              <Dialog open={showPriceDialog} onOpenChange={setShowPriceDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-2">
                    <DollarSign className="h-4 w-4" />
                    Prix
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajustement des prix</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Type d'ajustement</Label>
                      <Select
                        value={priceData.adjustmentType}
                        onValueChange={(v: any) => setPriceData(d => ({ ...d, adjustmentType: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                          <SelectItem value="fixed">Montant fixe (€)</SelectItem>
                          <SelectItem value="margin">Marge sur coût (%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Valeur ({priceData.adjustmentType === 'fixed' ? '€' : '%'})
                      </Label>
                      <Input
                        type="number"
                        value={priceData.adjustmentValue}
                        onChange={(e) => setPriceData(d => ({ ...d, adjustmentValue: Number(e.target.value) }))}
                        placeholder={priceData.adjustmentType === 'fixed' ? '5.00' : '10'}
                      />
                      <p className="text-xs text-muted-foreground">
                        Valeur positive pour augmenter, négative pour diminuer
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Arrondi</Label>
                      <Select
                        value={priceData.roundTo}
                        onValueChange={(v: any) => setPriceData(d => ({ ...d, roundTo: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Aucun</SelectItem>
                          <SelectItem value="0.99">.99€</SelectItem>
                          <SelectItem value="0.95">.95€</SelectItem>
                          <SelectItem value="0.00">.00€</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowPriceDialog(false)}>Annuler</Button>
                    <Button onClick={handleBulkPriceAdjust}>Appliquer</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button size="sm" variant="outline" className="gap-2" onClick={handleBulkDuplicate}>
                <Copy className="h-4 w-4" />
                Dupliquer
              </Button>

              <Button size="sm" variant="outline" className="gap-2" onClick={handleBulkExport}>
                <Download className="h-4 w-4" />
                Exporter
              </Button>

              <Button size="sm" variant="destructive" className="gap-2" onClick={handleBulkDelete}>
                <Trash2 className="h-4 w-4" />
                Supprimer
              </Button>

              <div className="flex-1" />
              
              <Button size="sm" variant="ghost" onClick={onClearSelection}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Désélectionner
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog {...confirmState} onOpenChange={(open) => !open && confirmState.onCancel?.()} />
    </>
  );
}
