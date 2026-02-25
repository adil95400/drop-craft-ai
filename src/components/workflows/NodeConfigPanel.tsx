/**
 * Node Configuration Panel - Configure individual workflow steps
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Settings, X } from 'lucide-react';
import type { WorkflowNode } from './VisualWorkflowCanvas';

interface NodeConfigPanelProps {
  node: WorkflowNode;
  onUpdate: (node: WorkflowNode) => void;
  onClose: () => void;
}

const TRIGGER_FIELDS: Record<string, { label: string; fields: { key: string; label: string; type: string; options?: string[]; placeholder?: string }[] }> = {
  'Nouvelle commande': { label: 'Config commande', fields: [
    { key: 'min_amount', label: 'Montant minimum (€)', type: 'number', placeholder: '0' },
    { key: 'status_filter', label: 'Statut', type: 'select', options: ['all', 'paid', 'pending', 'shipped'] },
  ]},
  'Stock bas': { label: 'Config stock', fields: [
    { key: 'threshold', label: 'Seuil stock', type: 'number', placeholder: '5' },
    { key: 'check_interval', label: 'Vérification (min)', type: 'number', placeholder: '15' },
  ]},
  'Planification': { label: 'Planification', fields: [
    { key: 'cron', label: 'Expression Cron', type: 'text', placeholder: '0 */6 * * *' },
    { key: 'timezone', label: 'Fuseau horaire', type: 'select', options: ['Europe/Paris', 'UTC', 'America/New_York'] },
  ]},
  'Changement de prix': { label: 'Config prix', fields: [
    { key: 'change_percent', label: 'Variation min (%)', type: 'number', placeholder: '5' },
    { key: 'direction', label: 'Direction', type: 'select', options: ['both', 'increase', 'decrease'] },
  ]},
};

const ACTION_FIELDS: Record<string, { label: string; fields: { key: string; label: string; type: string; options?: string[]; placeholder?: string }[] }> = {
  'Envoyer un email': { label: 'Email', fields: [
    { key: 'to', label: 'Destinataire', type: 'text', placeholder: 'email@example.com ou {{customer.email}}' },
    { key: 'subject', label: 'Objet', type: 'text', placeholder: 'Notification : {{event}}' },
    { key: 'template', label: 'Template', type: 'select', options: ['default', 'alert', 'order-confirm', 'cart-recovery'] },
  ]},
  'Appel Webhook': { label: 'Webhook', fields: [
    { key: 'url', label: 'URL', type: 'text', placeholder: 'https://...' },
    { key: 'method', label: 'Méthode', type: 'select', options: ['POST', 'PUT', 'PATCH'] },
    { key: 'headers', label: 'Headers (JSON)', type: 'textarea', placeholder: '{"Authorization": "Bearer ..."}' },
  ]},
  'Notification': { label: 'Notification', fields: [
    { key: 'title', label: 'Titre', type: 'text', placeholder: 'Alerte stock' },
    { key: 'priority', label: 'Priorité', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
    { key: 'channel', label: 'Canal', type: 'select', options: ['in-app', 'email', 'push', 'slack'] },
  ]},
  'Enrichissement IA': { label: 'IA', fields: [
    { key: 'task', label: 'Tâche', type: 'select', options: ['optimize_title', 'generate_description', 'seo_tags', 'translate'] },
    { key: 'language', label: 'Langue cible', type: 'select', options: ['fr', 'en', 'es', 'de'] },
    { key: 'tone', label: 'Ton', type: 'select', options: ['professional', 'casual', 'luxury', 'technical'] },
  ]},
  'Modifier stock': { label: 'Stock', fields: [
    { key: 'operation', label: 'Opération', type: 'select', options: ['set', 'increment', 'decrement'] },
    { key: 'value', label: 'Valeur', type: 'number', placeholder: '10' },
  ]},
  'Appel API': { label: 'API', fields: [
    { key: 'url', label: 'URL', type: 'text', placeholder: 'https://api.example.com/...' },
    { key: 'method', label: 'Méthode', type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE'] },
    { key: 'body', label: 'Body (JSON)', type: 'textarea', placeholder: '{}' },
  ]},
};

const CONDITION_FIELDS = {
  fields: [
    { key: 'field', label: 'Champ', type: 'text', placeholder: 'order.total' },
    { key: 'operator', label: 'Opérateur', type: 'select', options: ['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'starts_with'] },
    { key: 'value', label: 'Valeur', type: 'text', placeholder: '30' },
  ],
};

const DELAY_FIELDS = {
  fields: [
    { key: 'duration', label: 'Durée', type: 'number', placeholder: '30' },
    { key: 'unit', label: 'Unité', type: 'select', options: ['minutes', 'hours', 'days'] },
  ],
};

export function NodeConfigPanel({ node, onUpdate, onClose }: NodeConfigPanelProps) {
  const [config, setConfig] = useState(node.config);
  const [name, setName] = useState(node.name);

  useEffect(() => {
    setConfig(node.config);
    setName(node.name);
  }, [node.id]);

  const getFields = () => {
    if (node.type === 'trigger') return TRIGGER_FIELDS[node.name]?.fields || [];
    if (node.type === 'action') return ACTION_FIELDS[node.name]?.fields || [];
    if (node.type === 'condition') return CONDITION_FIELDS.fields;
    if (node.type === 'delay' || node.type === 'loop') return DELAY_FIELDS.fields;
    return [];
  };

  const handleSave = () => {
    const fields = getFields();
    const hasRequiredFields = fields.length === 0 || fields.some(f => config[f.key]);
    onUpdate({ ...node, name, config, isConfigured: hasRequiredFields });
  };

  const fields = getFields();

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="h-4 w-4" /> Configuration
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs">Nom de l'étape</Label>
          <Input value={name} onChange={e => setName(e.target.value)} className="mt-1" />
        </div>

        <Separator />

        {fields.length > 0 ? (
          <div className="space-y-3">
            {fields.map(field => (
              <div key={field.key}>
                <Label className="text-xs">{field.label}</Label>
                {field.type === 'select' ? (
                  <Select value={config[field.key] || ''} onValueChange={v => setConfig(prev => ({ ...prev, [field.key]: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Choisir..." /></SelectTrigger>
                    <SelectContent>
                      {field.options?.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : field.type === 'textarea' ? (
                  <Textarea
                    value={config[field.key] || ''}
                    onChange={e => setConfig(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="mt-1 font-mono text-xs"
                    rows={3}
                  />
                ) : (
                  <Input
                    type={field.type}
                    value={config[field.key] || ''}
                    onChange={e => setConfig(prev => ({ ...prev, [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value }))}
                    placeholder={field.placeholder}
                    className="mt-1"
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune configuration supplémentaire requise
          </p>
        )}

        <Button onClick={handleSave} className="w-full gap-2">
          <CheckCircle2 className="h-4 w-4" /> Appliquer
        </Button>
      </CardContent>
    </Card>
  );
}
