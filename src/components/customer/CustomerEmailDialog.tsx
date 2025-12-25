import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Send, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Customer {
  id: string;
  name: string;
  email: string;
}

interface CustomerEmailDialogProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMAIL_TEMPLATES = [
  { id: 'welcome', name: 'Bienvenue', subject: 'Bienvenue chez nous !', body: 'Cher(e) {{name}},\n\nNous sommes ravis de vous compter parmi nos clients.\n\nCordialement,\nL\'équipe' },
  { id: 'followup', name: 'Suivi commande', subject: 'Suivi de votre commande', body: 'Cher(e) {{name}},\n\nNous espérons que vous êtes satisfait(e) de votre dernière commande.\n\nN\'hésitez pas à nous contacter si vous avez des questions.\n\nCordialement,\nL\'équipe' },
  { id: 'promo', name: 'Promotion', subject: 'Offre exclusive pour vous !', body: 'Cher(e) {{name}},\n\nEn tant que client fidèle, nous avons le plaisir de vous offrir une remise exclusive.\n\nCordialement,\nL\'équipe' },
  { id: 'custom', name: 'Personnalisé', subject: '', body: '' },
];

export function CustomerEmailDialog({ customer, open, onOpenChange }: CustomerEmailDialogProps) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [template, setTemplate] = useState('custom');
  const [formData, setFormData] = useState({
    subject: '',
    body: ''
  });

  const handleTemplateChange = (templateId: string) => {
    setTemplate(templateId);
    const selectedTemplate = EMAIL_TEMPLATES.find(t => t.id === templateId);
    if (selectedTemplate) {
      const personalizedBody = selectedTemplate.body.replace('{{name}}', customer?.name || 'Client');
      setFormData({
        subject: selectedTemplate.subject,
        body: personalizedBody
      });
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    setSending(true);
    try {
      // Simulate email sending - in production, this would call an edge function
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Email envoyé",
        description: `Email envoyé avec succès à ${customer.email}`
      });
      
      onOpenChange(false);
      setFormData({ subject: '', body: '' });
      setTemplate('custom');
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer l'email",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Envoyer un email</DialogTitle>
          <DialogDescription>
            Envoyer un email à <strong>{customer?.name}</strong> ({customer?.email})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSend} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-template">Modèle</Label>
            <Select value={template} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un modèle" />
              </SelectTrigger>
              <SelectContent>
                {EMAIL_TEMPLATES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <div className="flex items-center gap-2">
                      {t.id !== 'custom' && <Sparkles className="h-3 w-3 text-primary" />}
                      {t.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-subject">Objet</Label>
            <Input
              id="email-subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Objet de l'email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-body">Message</Label>
            <Textarea
              id="email-body"
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              placeholder="Contenu de l'email..."
              rows={8}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={sending}>
              {sending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Envoyer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
