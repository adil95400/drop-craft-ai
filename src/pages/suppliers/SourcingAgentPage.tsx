import { useState } from 'react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, Send, Clock, CheckCircle2, Package, DollarSign, FileText, Star, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const mockQuotes = [
  { id: 'QR-001', product: 'Écouteurs Bluetooth TWS', status: 'completed', suppliers: 5, bestPrice: '3,20 €', moq: 100, date: '2026-02-10' },
  { id: 'QR-002', product: 'Coque iPhone 16 Pro', status: 'in_progress', suppliers: 3, bestPrice: '-', moq: 200, date: '2026-02-11' },
  { id: 'QR-003', product: 'Lampe LED USB', status: 'pending', suppliers: 0, bestPrice: '-', moq: 50, date: '2026-02-11' },
];

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
  in_progress: { label: 'En cours', color: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Terminé', color: 'bg-green-100 text-green-800' },
};

export default function SourcingAgentPage() {
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [budget, setBudget] = useState('');

  const handleSubmit = () => {
    if (!productName.trim()) {
      toast.error('Veuillez entrer un nom de produit');
      return;
    }
    toast.success('Demande de sourcing soumise !', {
      description: `Notre agent IA va rechercher les meilleurs fournisseurs pour "${productName}".`,
    });
    setProductName('');
    setDescription('');
    setQuantity('');
    setBudget('');
  };

  return (
    <ChannablePageWrapper
      title="Agent de Sourcing IA"
      description="Trouvez automatiquement les meilleurs fournisseurs et prix grâce à notre agent IA"
      actions={
        <Badge variant="outline" className="gap-1">
          <Bot className="h-3 w-3" /> Agent automatisé
        </Badge>
      }
    >
      <Tabs defaultValue="new" className="space-y-4">
        <TabsList>
          <TabsTrigger value="new" className="gap-1"><Send className="h-3 w-3" /> Nouvelle demande</TabsTrigger>
          <TabsTrigger value="history" className="gap-1"><FileText className="h-3 w-3" /> Historique</TabsTrigger>
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
                <Textarea placeholder="Décrivez les spécifications, matériaux, couleurs, certifications requises..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Budget unitaire max</label>
                  <Input type="number" placeholder="Ex: 5.00" value={budget} onChange={(e) => setBudget(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priorité</label>
                  <Select defaultValue="normal">
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
          {mockQuotes.map((q) => (
            <Card key={q.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{q.id}</Badge>
                    <span className="font-medium text-sm">{q.product}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={statusMap[q.status]?.color}>{statusMap[q.status]?.label}</Badge>
                    {q.status === 'completed' && (
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1"><Star className="h-3 w-3 text-yellow-500" /> {q.suppliers} fournisseurs</span>
                        <span className="flex items-center gap-1"><DollarSign className="h-3 w-3 text-green-500" /> Best: {q.bestPrice}</span>
                        <span className="flex items-center gap-1"><Package className="h-3 w-3" /> MOQ: {q.moq}</span>
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{q.date}</span>
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-3 w-3 mr-1" /> Détails
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
}
