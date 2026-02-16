/**
 * Sprint 22: Email Templates Management Page
 */
import { useState } from 'react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Mail, Plus, Edit, Eye, Copy, Trash2, CheckCircle2, Clock, 
  ShoppingCart, Truck, RotateCcw, Star, Tag, Megaphone 
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  category: 'transactional' | 'marketing' | 'retention';
  trigger: string;
  enabled: boolean;
  lastEdited: string;
  icon: React.ElementType;
  preview?: string;
}

const defaultTemplates: EmailTemplate[] = [
  { id: '1', name: 'Confirmation de commande', subject: 'Votre commande #{order_number} est confirmée', category: 'transactional', trigger: 'order.created', enabled: true, lastEdited: '2026-02-10', icon: ShoppingCart, preview: 'Merci pour votre commande ! Voici votre récapitulatif...' },
  { id: '2', name: 'Expédition en cours', subject: 'Votre commande #{order_number} est en route', category: 'transactional', trigger: 'order.shipped', enabled: true, lastEdited: '2026-02-08', icon: Truck, preview: 'Bonne nouvelle ! Votre colis a été expédié...' },
  { id: '3', name: 'Livraison confirmée', subject: 'Votre commande #{order_number} a été livrée', category: 'transactional', trigger: 'order.delivered', enabled: true, lastEdited: '2026-02-05', icon: CheckCircle2, preview: 'Votre commande a été livrée avec succès...' },
  { id: '4', name: 'Demande d\'avis', subject: 'Que pensez-vous de votre achat ?', category: 'retention', trigger: 'order.delivered+3d', enabled: false, lastEdited: '2026-02-01', icon: Star, preview: 'Nous espérons que vous appréciez votre achat...' },
  { id: '5', name: 'Retour accepté', subject: 'Votre retour #{return_id} est accepté', category: 'transactional', trigger: 'return.approved', enabled: true, lastEdited: '2026-01-28', icon: RotateCcw, preview: 'Votre demande de retour a été approuvée...' },
  { id: '6', name: 'Panier abandonné', subject: 'Vous avez oublié quelque chose 🛒', category: 'retention', trigger: 'cart.abandoned+1h', enabled: false, lastEdited: '2026-01-25', icon: ShoppingCart, preview: 'Des articles attendent dans votre panier...' },
  { id: '7', name: 'Promotion flash', subject: '⚡ Offre exclusive : -{discount}% aujourd\'hui', category: 'marketing', trigger: 'manual', enabled: false, lastEdited: '2026-01-20', icon: Tag, preview: 'Profitez de réductions exceptionnelles...' },
  { id: '8', name: 'Newsletter mensuelle', subject: 'Les nouveautés de {month}', category: 'marketing', trigger: 'schedule.monthly', enabled: true, lastEdited: '2026-02-01', icon: Megaphone, preview: 'Découvrez nos dernières nouveautés...' },
];

const CATEGORY_MAP = {
  transactional: { label: 'Transactionnel', color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400' },
  marketing: { label: 'Marketing', color: 'text-pink-600 bg-pink-50 dark:bg-pink-500/10 dark:text-pink-400' },
  retention: { label: 'Rétention', color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400' },
};

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState(defaultTemplates);
  const [activeTab, setActiveTab] = useState('all');
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  const filteredTemplates = activeTab === 'all' 
    ? templates 
    : templates.filter(t => t.category === activeTab);

  const toggleTemplate = (id: string) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t));
    const template = templates.find(t => t.id === id);
    toast.success(template?.enabled ? 'Template désactivé' : 'Template activé');
  };

  const duplicateTemplate = (template: EmailTemplate) => {
    const newTemplate = { 
      ...template, 
      id: Date.now().toString(), 
      name: `${template.name} (copie)`, 
      enabled: false 
    };
    setTemplates(prev => [...prev, newTemplate]);
    toast.success('Template dupliqué');
  };

  const deleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast.success('Template supprimé');
  };

  const enabledCount = templates.filter(t => t.enabled).length;

  return (
    <ChannablePageWrapper
      title="Templates Email"
      subtitle="Communication"
      description="Gérez vos emails transactionnels, marketing et de rétention"
      heroImage="marketing"
      badge={{ label: `${enabledCount} actifs`, icon: Mail }}
      actions={
        <Button className="gap-2" onClick={() => toast.info('Éditeur de template à venir')}>
          <Plus className="h-4 w-4" /> Nouveau template
        </Button>
      }
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">Tous ({templates.length})</TabsTrigger>
          <TabsTrigger value="transactional">Transactionnels</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="retention">Rétention</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredTemplates.map((template, index) => {
            const Icon = template.icon;
            const cat = CATEGORY_MAP[template.category];
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-border/50 hover:border-primary/20 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-lg ${cat.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate">{template.name}</h4>
                          <Badge variant="outline" className={`text-[10px] ${cat.color}`}>
                            {cat.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{template.subject}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Trigger: {template.trigger}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={template.enabled} onCheckedChange={() => toggleTemplate(template.id)} />
                        <Button variant="ghost" size="icon" onClick={() => setPreviewTemplate(template)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => duplicateTemplate(template)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteTemplate(template.id)}>
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" /> Aperçu du template
            </DialogTitle>
            <DialogDescription>{previewTemplate?.name}</DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">Objet :</p>
                <p className="font-medium text-sm">{previewTemplate.subject}</p>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <div className="text-center mb-4 pb-4 border-b">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">{previewTemplate.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{previewTemplate.preview}</p>
                <div className="mt-4 text-center">
                  <Button size="sm" variant="default">Voir ma commande</Button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">{CATEGORY_MAP[previewTemplate.category].label}</Badge>
                <span>Trigger: {previewTemplate.trigger}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ChannablePageWrapper>
  );
}
