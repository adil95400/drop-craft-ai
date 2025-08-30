import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Bell, Clock, Users, Mail, Smartphone, CalendarIcon, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface NotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notificationId?: string;
  onSave?: (notification: NotificationData) => void;
}

interface NotificationData {
  id?: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  channels: string[];
  recipients: 'all' | 'segment' | 'individual';
  recipientIds?: string[];
  segmentId?: string;
  scheduledFor?: Date;
  isRecurring: boolean;
  recurringPattern?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: Date;
  };
  actionUrl?: string;
  actionLabel?: string;
}

const notificationTypes = [
  { value: 'info', label: 'Information', color: 'bg-blue-100 text-blue-800' },
  { value: 'success', label: 'Succès', color: 'bg-green-100 text-green-800' },
  { value: 'warning', label: 'Avertissement', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'error', label: 'Erreur', color: 'bg-red-100 text-red-800' }
];

const priorityLevels = [
  { value: 'low', label: 'Basse', icon: '🔵' },
  { value: 'normal', label: 'Normale', icon: '🟡' },
  { value: 'high', label: 'Élevée', icon: '🟠' },
  { value: 'urgent', label: 'Urgente', icon: '🔴' }
];

const channels = [
  { id: 'email', label: 'Email', icon: <Mail className="h-4 w-4" /> },
  { id: 'push', label: 'Push', icon: <Bell className="h-4 w-4" /> },
  { id: 'sms', label: 'SMS', icon: <Smartphone className="h-4 w-4" /> },
  { id: 'in_app', label: 'In-App', icon: <Bell className="h-4 w-4" /> }
];

export const NotificationDialog: React.FC<NotificationDialogProps> = ({
  open,
  onOpenChange,
  notificationId,
  onSave
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<NotificationData>({
    title: '',
    message: '',
    type: 'info',
    priority: 'normal',
    channels: ['in_app'],
    recipients: 'all',
    isRecurring: false
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.message) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    if (formData.channels.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un canal de notification",
        variant: "destructive"
      });
      return;
    }

    onSave?.(formData);
    toast({
      title: "Succès",
      description: notificationId ? "Notification mise à jour" : "Notification créée avec succès"
    });
    onOpenChange(false);
  };

  const handleChannelToggle = (channelId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      channels: checked 
        ? [...prev.channels, channelId]
        : prev.channels.filter(id => id !== channelId)
    }));
  };

  const getTypeColor = (type: string) => {
    const typeConfig = notificationTypes.find(t => t.value === type);
    return typeConfig?.color || 'bg-gray-100 text-gray-800';
  };

  const getPriorityIcon = (priority: string) => {
    const priorityConfig = priorityLevels.find(p => p.value === priority);
    return priorityConfig?.icon || '🔵';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {notificationId ? 'Modifier la notification' : 'Créer une notification'}
          </DialogTitle>
          <DialogDescription>
            Configurez les paramètres de votre notification pour informer vos utilisateurs
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Titre de la notification"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {notificationTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Badge className={type.color}>{type.label}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Contenu de la notification"
                rows={4}
              />
              <div className="text-xs text-muted-foreground">
                {formData.message.length}/500 caractères
              </div>
            </div>
          </div>

          {/* Priority and Channels */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priorité</Label>
                <Select value={formData.priority} onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityLevels.map(priority => (
                      <SelectItem key={priority.value} value={priority.value}>
                        <div className="flex items-center gap-2">
                          <span>{priority.icon}</span>
                          {priority.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Canaux de notification</Label>
              <div className="grid grid-cols-2 gap-3">
                {channels.map(channel => (
                  <div key={channel.id} className="flex items-center space-x-2 p-2 border rounded-lg">
                    <Checkbox
                      id={channel.id}
                      checked={formData.channels.includes(channel.id)}
                      onCheckedChange={(checked) => handleChannelToggle(channel.id, checked as boolean)}
                    />
                    <Label htmlFor={channel.id} className="flex items-center gap-2 flex-1 cursor-pointer">
                      {channel.icon}
                      {channel.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recipients */}
          <div className="space-y-4">
            <Label>Destinataires</Label>
            <Select value={formData.recipients} onValueChange={(value: any) => setFormData(prev => ({ ...prev, recipients: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Tous les utilisateurs
                  </div>
                </SelectItem>
                <SelectItem value="segment">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Segment spécifique
                  </div>
                </SelectItem>
                <SelectItem value="individual">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Utilisateurs spécifiques
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {formData.recipients === 'segment' && (
              <div className="space-y-2">
                <Label>Segment</Label>
                <Select value={formData.segmentId} onValueChange={(value) => setFormData(prev => ({ ...prev, segmentId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un segment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vip">Clients VIP</SelectItem>
                    <SelectItem value="new">Nouveaux clients</SelectItem>
                    <SelectItem value="inactive">Clients inactifs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Advanced Options */}
          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full"
            >
              <Clock className="h-4 w-4 mr-2" />
              Options avancées
            </Button>

            {showAdvanced && (
              <div className="space-y-4 p-4 border rounded-lg">
                {/* Scheduling */}
                <div className="space-y-2">
                  <Label>Programmer l'envoi</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.scheduledFor ? formData.scheduledFor.toLocaleString() : "Envoyer maintenant"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.scheduledFor}
                        onSelect={(date) => setFormData(prev => ({ ...prev, scheduledFor: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Recurring */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="recurring"
                      checked={formData.isRecurring}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRecurring: checked as boolean }))}
                    />
                    <Label htmlFor="recurring">Notification récurrente</Label>
                  </div>

                  {formData.isRecurring && (
                    <div className="grid grid-cols-2 gap-2 ml-6">
                      <Select 
                        value={formData.recurringPattern?.type} 
                        onValueChange={(value: any) => setFormData(prev => ({ 
                          ...prev, 
                          recurringPattern: { ...prev.recurringPattern, type: value, interval: 1 } 
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Fréquence" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Quotidien</SelectItem>
                          <SelectItem value="weekly">Hebdomadaire</SelectItem>
                          <SelectItem value="monthly">Mensuel</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Input
                        type="number"
                        min={1}
                        placeholder="Intervalle"
                        value={formData.recurringPattern?.interval || 1}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          recurringPattern: { 
                            ...prev.recurringPattern, 
                            type: prev.recurringPattern?.type || 'daily',
                            interval: parseInt(e.target.value) || 1 
                          }
                        }))}
                      />
                    </div>
                  )}
                </div>

                <Separator />

                {/* Action Button */}
                <div className="space-y-2">
                  <Label>Bouton d'action (optionnel)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Texte du bouton"
                      value={formData.actionLabel || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, actionLabel: e.target.value }))}
                    />
                    <Input
                      placeholder="URL d'action"
                      value={formData.actionUrl || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, actionUrl: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Aperçu</Label>
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span>{getPriorityIcon(formData.priority)}</span>
                  <h4 className="font-semibold">{formData.title || 'Titre de la notification'}</h4>
                  <Badge className={getTypeColor(formData.type)}>
                    {notificationTypes.find(t => t.value === formData.type)?.label}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formData.scheduledFor ? formData.scheduledFor.toLocaleString() : 'Maintenant'}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {formData.message || 'Message de la notification'}
              </p>
              {formData.actionLabel && (
                <Button size="sm" variant="outline">
                  {formData.actionLabel}
                </Button>
              )}
              <div className="flex gap-1 mt-2">
                {formData.channels.map(channelId => {
                  const channel = channels.find(c => c.id === channelId);
                  return channel ? (
                    <Badge key={channelId} variant="secondary" className="text-xs">
                      {channel.label}
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">
              {notificationId ? 'Mettre à jour' : 'Créer la notification'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};