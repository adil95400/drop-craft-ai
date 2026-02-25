/**
 * Sourcing Agent Page - Real data from support_tickets for sourcing requests
 */
import { useState } from 'react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot, Send, Clock, Package, DollarSign, FileText, Star, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  open: { label: 'En attente', variant: 'secondary' },
  in_progress: { label: 'En cours', variant: 'default' },
  resolved: { label: 'Terminé', variant: 'outline' },
};

export default function SourcingAgentPage() {
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [budget, setBudget] = useState('');
  const [priority, setPriority] = useState('normal');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ['sourcing-quotes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .eq('category', 'sourcing')
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const handleSubmit = async () => {
    if (!productName.trim()) {
      toast.error('Veuillez entrer un nom de produit');
      return;
    }
    try {
      await supabase.from('support_tickets').insert({
        user_id: user?.id!,
        subject: `Sourcing: ${productName}`,
        message: `Produit: ${productName}\nQuantité: ${quantity || 'Non spécifiée'}\nBudget max: ${budget || 'Non spécifié'}\nPriorité: ${priority}\n\n${description}`,
        category: 'sourcing',
        priority: priority === 'urgent' ? 'urgent' : priority === 'high' ? 'high' : 'medium',
        status: 'open',
      });
      toast.success('Demande de sourcing soumise !', {
        description: `Notre agent IA va rechercher les meilleurs fournisseurs pour "${productName}".`,
      });
      setProductName('');
      setDescription('');
      setQuantity('');
      setBudget('');
      queryClient.invalidateQueries({ queryKey: ['sourcing-quotes'] });
    } catch {
      toast.error('Erreur lors de la soumission');
    }
  };

  return (
    <ChannablePageWrapper
      title="Agent de Sourcing IA"
      description="Trouvez automatiquement les meilleurs fournisseurs et prix grâce à notre agent IA"
      actions={<Badge variant="outline" className="gap-1"><Bot className="h-3 w-3" /> Agent automatisé</Badge>}
    >
      <Tabs defaultValue="new" className="space-y-4">
        <TabsList>
          <TabsTrigger value="new" className="gap-1"><Send className="h-3 w-3" /> Nouvelle demande</TabsTrigger>
          <TabsTrigger value="history" className="gap-1"><FileText className="h-3 w-3" /> Historique ({quotes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" /> Décrivez le produit recherché
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nom du produit *</label>
                  <Input placeholder="Ex: Écouteurs Bluetooth sans fil" value={productName} onChange={(e) => setProductName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantité souhaitée</label>
                  <Input type="number" placeholder="Ex: 500" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description détaillée</label>
                <Textarea placeholder="Décrivez les spécifications, matériaux, couleurs..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Budget unitaire max</label>
                  <Input type="number" placeholder="Ex: 5.00" value={budget} onChange={(e) => setBudget(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priorité</label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Basse</SelectItem>
                      <SelectItem value="normal">Normale</SelectItem>
                      <SelectItem value="high">Haute - 24h</SelectItem>
                      <SelectItem value="urgent">Urgente - 4h</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSubmit} className="w-full md:w-auto">
                <Bot className="h-4 w-4 mr-2" /> Lancer la recherche IA
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-3">
          {isLoading ? (
            [1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)
          ) : quotes.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Aucune demande de sourcing</p>
            </Card>
          ) : (
            quotes.map((q: any) => (
              <Card key={q.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{q.id.slice(0, 8)}</Badge>
                      <span className="font-medium text-sm">{q.subject}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={statusMap[q.status]?.variant || 'outline'}>
                        {statusMap[q.status]?.label || q.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(q.created_at).toLocaleDateString('fr-FR')}
                      </span>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="h-3 w-3 mr-1" /> Détails
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
}
