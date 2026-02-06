import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, AlertTriangle, Clock, Phone, Video, Headphones } from 'lucide-react';
import { useSupportTickets } from '@/hooks/useSupportTickets';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const ticketSchema = z.object({
  subject: z.string().min(5, 'Le sujet doit contenir au moins 5 caractères'),
  message: z.string().min(20, 'Le message doit contenir au moins 20 caractères'),
  category: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  preferredContact: z.enum(['chat', 'email', 'phone', 'video']).optional(),
  phone: z.string().optional(),
});

type TicketFormData = z.infer<typeof ticketSchema>;

interface VIPTicketFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function VIPTicketForm({ onSuccess, onCancel }: VIPTicketFormProps) {
  const { user } = useAuth();
  const { createTicket, isCreatingTicket } = useSupportTickets();
  const [showPhoneInput, setShowPhoneInput] = useState(false);

  const userPlan = (user?.user_metadata?.plan?.toLowerCase() || 'free') as string;
  const isVIP = ['business', 'enterprise'].includes(userPlan);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      priority: isVIP ? 'high' : 'medium',
      category: 'general',
      preferredContact: 'chat',
    }
  });

  const selectedPriority = watch('priority');
  const selectedContact = watch('preferredContact');

  const onSubmit = (data: TicketFormData) => {
    createTicket({
      subject: `${isVIP ? '[VIP] ' : ''}${data.subject}`,
      message: data.message,
      category: data.category,
      priority: data.priority,
      email: user?.email,
    }, {
      onSuccess: () => {
        toast.success(isVIP ? 'Ticket VIP créé - Réponse prioritaire sous 2h' : 'Ticket créé avec succès');
        onSuccess?.();
      }
    });
  };

  const priorityOptions = [
    { value: 'low', label: 'Faible', color: 'bg-slate-500', description: 'Réponse sous 48h' },
    { value: 'medium', label: 'Moyen', color: 'bg-blue-500', description: 'Réponse sous 24h' },
    { value: 'high', label: 'Élevée', color: 'bg-orange-500', description: 'Réponse sous 4h', vipOnly: !isVIP },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-500', description: 'Réponse sous 2h', vipOnly: !isVIP },
  ];

  const contactOptions = [
    { value: 'chat', label: 'Chat en direct', icon: Headphones },
    { value: 'email', label: 'Email', icon: Clock },
    { value: 'phone', label: 'Téléphone', icon: Phone, vipOnly: !isVIP },
    { value: 'video', label: 'Appel vidéo', icon: Video, vipOnly: !isVIP },
  ];

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isVIP && <Crown className="h-5 w-5 text-amber-500" />}
              Créer un ticket de support
            </CardTitle>
            <CardDescription>
              {isVIP 
                ? 'Support VIP prioritaire - Réponse garantie sous 2h' 
                : 'Notre équipe vous répondra dans les meilleurs délais'
              }
            </CardDescription>
          </div>
          {isVIP && (
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              <Crown className="h-3 w-3 mr-1" />
              Priorité VIP
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Sujet *</Label>
            <Input
              id="subject"
              placeholder="Décrivez brièvement votre problème"
              {...register('subject')}
            />
            {errors.subject && (
              <p className="text-sm text-destructive">{errors.subject.message}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Catégorie</Label>
            <Select 
              defaultValue="general"
              onValueChange={(value) => setValue('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">Général</SelectItem>
                <SelectItem value="technical">Technique</SelectItem>
                <SelectItem value="billing">Facturation</SelectItem>
                <SelectItem value="integration">Intégrations</SelectItem>
                <SelectItem value="import">Import produits</SelectItem>
                <SelectItem value="feature">Demande de fonctionnalité</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priorité</Label>
            <div className="grid grid-cols-2 gap-2">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  disabled={option.vipOnly}
                  onClick={() => !option.vipOnly && setValue('priority', option.value as TicketFormData['priority'])}
                  className={`relative p-3 rounded-lg border-2 transition-all text-left ${
                    selectedPriority === option.value 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  } ${option.vipOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${option.color}`} />
                    <span className="font-medium text-sm">{option.label}</span>
                    {option.vipOnly && (
                      <Crown className="h-3 w-3 text-amber-500 ml-auto" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Contact (VIP only shows all options) */}
          <div className="space-y-2">
            <Label>Mode de contact préféré</Label>
            <div className="grid grid-cols-2 gap-2">
              {contactOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={option.vipOnly}
                    onClick={() => {
                      if (!option.vipOnly) {
                        setValue('preferredContact', option.value as TicketFormData['preferredContact']);
                        setShowPhoneInput(option.value === 'phone' || option.value === 'video');
                      }
                    }}
                    className={`relative p-3 rounded-lg border-2 transition-all ${
                      selectedContact === option.value 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    } ${option.vipOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="text-sm">{option.label}</span>
                      {option.vipOnly && (
                        <Crown className="h-3 w-3 text-amber-500 ml-auto" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Phone number for callbacks */}
          {showPhoneInput && isVIP && (
            <div className="space-y-2">
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+33 6 12 34 56 78"
                {...register('phone')}
              />
            </div>
          )}

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              placeholder="Décrivez votre problème en détail..."
              rows={5}
              {...register('message')}
            />
            {errors.message && (
              <p className="text-sm text-destructive">{errors.message.message}</p>
            )}
          </div>

          {/* VIP Guarantee */}
          {isVIP && (
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <Crown className="h-4 w-4 text-amber-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-700 dark:text-amber-400">
                  Garantie VIP
                </p>
                <p className="text-muted-foreground">
                  Votre ticket sera traité en priorité. Temps de réponse garanti selon la priorité choisie.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Annuler
              </Button>
            )}
            <Button 
              type="submit" 
              className="flex-1"
              disabled={isCreatingTicket}
            >
              {isCreatingTicket ? 'Création...' : 'Créer le ticket'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
