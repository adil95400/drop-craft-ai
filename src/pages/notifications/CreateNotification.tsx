import { useState } from 'react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  ArrowLeft, Bell, Mail, MessageSquare, Smartphone,
  Users, Calendar, Clock, Zap, Target, BarChart3,
  Eye, Send, Info
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale';
import { cn } from '@/lib/utils';

const notificationTemplates = [
  { id: 'order-confirmed', name: 'Commande confirmée', category: 'transactional' },
  { id: 'order-shipped', name: 'Commande expédiée', category: 'transactional' },
  { id: 'promo-flash', name: 'Promotion éclair', category: 'marketing' },
  { id: 'welcome', name: 'Bienvenue', category: 'marketing' },
  { id: 'cart-reminder', name: 'Rappel panier abandonné', category: 'retention' },
];

export default function CreateNotification() {
  const navigate = useNavigate();
  const locale = useDateFnsLocale();
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [scheduleTime, setScheduleTime] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: '',
    priority: 'medium',
    targetUsers: 'all',
    customSegment: '',
    pushNotification: true,
    emailNotification: false,
    smsNotification: false,
    scheduleType: 'now',
    actionUrl: '',
    actionLabel: '',
    imageUrl: ''
  });

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = notificationTemplates.find(t => t.id === templateId);
    if (template) {
      // Pré-remplir avec des données de template
      setFormData(prev => ({
        ...prev,
        title: template.name,
        type: template.category === 'transactional' ? 'info' : 'promotion'
      }));
    }
  };

  const getEstimatedReach = () => {
    switch (formData.targetUsers) {
      case 'all': return '5,234';
      case 'active': return '3,891';
      case 'vip': return '156';
      case 'new': return '1,023';
      default: return '0';
    }
  };

  const getChannelCost = () => {
    let cost = 0;
    if (formData.pushNotification) cost += 0;
    if (formData.emailNotification) cost += parseFloat(getEstimatedReach().replace(',', '')) * 0.001;
    if (formData.smsNotification) cost += parseFloat(getEstimatedReach().replace(',', '')) * 0.05;
    return cost.toFixed(2);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.message || !formData.type) {
      toast.error('Titre, message et type sont requis');
      return;
    }
    
    if (formData.scheduleType === 'scheduled' && !scheduleDate) {
      toast.error('Date de programmation requise');
      return;
    }

    setIsSubmitting(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Vous devez être connecté');
        return;
      }

      const scheduledAt = formData.scheduleType === 'scheduled' && scheduleDate
        ? new Date(`${format(scheduleDate, 'yyyy-MM-dd')}T${scheduleTime || '09:00'}:00`).toISOString()
        : new Date().toISOString();

      const { error } = await supabase.from('notifications').insert({
        user_id: user.id,
        title: formData.title,
        message: formData.message,
        type: formData.type,
        is_read: false,
        metadata: {
          priority: formData.priority,
          target_users: formData.targetUsers,
          channels: {
            push: formData.pushNotification,
            email: formData.emailNotification,
            sms: formData.smsNotification,
          },
          action_url: formData.actionUrl || null,
          action_label: formData.actionLabel || null,
          image_url: formData.imageUrl || null,
          scheduled_at: scheduledAt,
          template_id: selectedTemplate || null,
        },
      });

      if (error) throw error;

      toast.success(
        formData.scheduleType === 'now'
          ? 'Notification envoyée avec succès'
          : `Notification programmée pour le ${format(scheduleDate!, 'dd/MM/yyyy', { locale })} à ${scheduleTime || '09:00'}`
      );
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Erreur création notification:', error);
      toast.error(error.message || 'Erreur lors de la création de la notification');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Créer une Notification - ShopOpti</title>
        <meta name="description" content="Créez et programmez une notification multicanale pour vos utilisateurs" />
      </Helmet>

      <ChannablePageWrapper
        title="Créer une Notification"
        description="Créez et programmez une notification multicanale"
        heroImage="notifications"
        badge={{ label: 'Notification', icon: Bell }}
      >
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au tableau de bord
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={async () => {
                if (!formData.title || !formData.message) {
                  toast.error('Titre et message requis pour la prévisualisation');
                  return;
                }
                try {
                  const { supabase } = await import('@/integrations/supabase/client');
                  const { data: { user } } = await supabase.auth.getUser();
                  if (!user?.email) {
                    toast.error('Email utilisateur non disponible');
                    return;
                  }
                  // Envoyer la prévisualisation à l'utilisateur connecté
                  const { error } = await supabase.from('notifications').insert({
                    user_id: user.id,
                    title: `[PREVIEW] ${formData.title}`,
                    message: formData.message,
                    type: formData.type || 'info',
                    is_read: false
                  });
                  if (error) throw error;
                  toast.success(`Prévisualisation envoyée à ${user.email}`);
                } catch (error) {
                  toast.error('Erreur lors de l\'envoi de la prévisualisation');
                }
              }}>
                <Eye className="mr-2 h-4 w-4" />
                Tester
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                <Send className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Envoi en cours...' : (formData.scheduleType === 'now' ? 'Envoyer maintenant' : 'Programmer')}
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Colonne principale */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-primary" />
                      Modèles de notification
                    </CardTitle>
                    <CardDescription>
                      Commencez avec un modèle prédéfini ou créez depuis zéro
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {notificationTemplates.map((template) => (
                        <Button
                          key={template.id}
                          type="button"
                          variant={selectedTemplate === template.id ? 'default' : 'outline'}
                          className="h-auto flex-col items-start p-4"
                          onClick={() => handleTemplateSelect(template.id)}
                        >
                          <div className="font-medium text-sm">{template.name}</div>
                          <Badge variant="secondary" className="mt-2 text-xs">
                            {template.category}
                          </Badge>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Contenu de la notification</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="type">Type *</Label>
                        <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="info">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                                Information
                              </div>
                            </SelectItem>
                            <SelectItem value="warning">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                                Avertissement
                              </div>
                            </SelectItem>
                            <SelectItem value="success">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                Succès
                              </div>
                            </SelectItem>
                            <SelectItem value="error">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-red-500" />
                                Erreur
                              </div>
                            </SelectItem>
                            <SelectItem value="promotion">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-purple-500" />
                                Promotion
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="priority">Priorité</Label>
                        <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Faible</SelectItem>
                            <SelectItem value="medium">Moyenne</SelectItem>
                            <SelectItem value="high">Élevée</SelectItem>
                            <SelectItem value="urgent">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="title">Titre *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Titre accrocheur de votre notification"
                        maxLength={60}
                        required
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {formData.title.length}/60
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Votre message complet..."
                        rows={6}
                        maxLength={500}
                        required
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {formData.message.length}/500
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="actionLabel">Texte du bouton</Label>
                        <Input
                          id="actionLabel"
                          value={formData.actionLabel}
                          onChange={(e) => setFormData({ ...formData, actionLabel: e.target.value })}
                          placeholder="Ex: Voir l'offre"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="actionUrl">Lien du bouton</Label>
                        <Input
                          id="actionUrl"
                          type="url"
                          value={formData.actionUrl}
                          onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="imageUrl">Image (URL)</Label>
                      <Input
                        id="imageUrl"
                        type="url"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                      />
                      <p className="text-xs text-muted-foreground">
                        Recommandé: 1200x630px pour les emails, 512x512px pour les notifications push
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Audience cible
                    </CardTitle>
                    <CardDescription>
                      Sélectionnez qui recevra cette notification
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="targetUsers">Segment</Label>
                      <Select value={formData.targetUsers} onValueChange={(value) => setFormData({ ...formData, targetUsers: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            <div className="flex items-center justify-between w-full">
                              <span>Tous les utilisateurs</span>
                              <Badge variant="secondary" className="ml-2">5,234</Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="active">
                            <div className="flex items-center justify-between w-full">
                              <span>Utilisateurs actifs (30j)</span>
                              <Badge variant="secondary" className="ml-2">3,891</Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="vip">
                            <div className="flex items-center justify-between w-full">
                              <span>Clients VIP</span>
                              <Badge variant="secondary" className="ml-2">156</Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="new">
                            <div className="flex items-center justify-between w-full">
                              <span>Nouveaux clients (7j)</span>
                              <Badge variant="secondary" className="ml-2">1,023</Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="custom">
                            <span>Segment personnalisé</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.targetUsers === 'custom' && (
                      <div className="space-y-2">
                        <Label htmlFor="customSegment">Critères personnalisés</Label>
                        <Input
                          id="customSegment"
                          value={formData.customSegment}
                          onChange={(e) => setFormData({ ...formData, customSegment: e.target.value })}
                          placeholder="Ex: tag:premium AND last_purchase:<30d"
                        />
                        <p className="text-xs text-muted-foreground">
                          Utilisez des opérateurs: AND, OR, NOT
                        </p>
                      </div>
                    )}

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Portée estimée</span>
                        </div>
                        <span className="text-2xl font-bold">{getEstimatedReach()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      Programmation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Tabs value={formData.scheduleType} onValueChange={(value) => setFormData({ ...formData, scheduleType: value })}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="now">
                          <Zap className="h-4 w-4 mr-2" />
                          Maintenant
                        </TabsTrigger>
                        <TabsTrigger value="scheduled">
                          <Clock className="h-4 w-4 mr-2" />
                          Programmer
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="now" className="space-y-3">
                        <div className="p-4 border rounded-lg bg-blue-50/50 dark:bg-blue-950/20">
                          <p className="text-sm text-blue-900 dark:text-blue-100">
                            La notification sera envoyée immédiatement après validation
                          </p>
                        </div>
                      </TabsContent>

                      <TabsContent value="scheduled" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Date</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    'w-full justify-start text-left font-normal',
                                    !scheduleDate && 'text-muted-foreground'
                                  )}
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  {scheduleDate ? format(scheduleDate, 'PPP', { locale }) : 'Sélectionner'}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={scheduleDate}
                                  onSelect={setScheduleDate}
                                  disabled={(date) => date < new Date()}
                                  initialFocus
                                  className={cn('p-3 pointer-events-auto')}
                                />
                              </PopoverContent>
                            </Popover>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="scheduleTime">Heure</Label>
                            <Input
                              id="scheduleTime"
                              type="time"
                              value={scheduleTime}
                              onChange={(e) => setScheduleTime(e.target.value)}
                            />
                          </div>
                        </div>

                        {scheduleDate && scheduleTime && (
                          <div className="p-4 border rounded-lg bg-green-50/50 dark:bg-green-950/20">
                            <p className="text-sm text-green-900 dark:text-green-100">
                              Envoi prévu: {format(scheduleDate, 'EEEE d MMMM yyyy', { locale })} à {scheduleTime}
                            </p>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>

              {/* Colonne latérale */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Canaux de diffusion</CardTitle>
                    <CardDescription>
                      Sélectionnez les canaux pour cette notification
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Smartphone className="h-5 w-5 text-primary" />
                        <div>
                          <Label htmlFor="pushNotif" className="cursor-pointer font-medium">
                            Notification push
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Dans l'application
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="pushNotif"
                        checked={formData.pushNotification}
                        onCheckedChange={(checked) => setFormData({ ...formData, pushNotification: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-primary" />
                        <div>
                          <Label htmlFor="emailNotif" className="cursor-pointer font-medium">
                            Email
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            ~0.001€ par email
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="emailNotif"
                        checked={formData.emailNotification}
                        onCheckedChange={(checked) => setFormData({ ...formData, emailNotification: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        <div>
                          <Label htmlFor="smsNotif" className="cursor-pointer font-medium">
                            SMS
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            ~0.05€ par SMS
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="smsNotif"
                        checked={formData.smsNotification}
                        onCheckedChange={(checked) => setFormData({ ...formData, smsNotification: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Estimation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Destinataires</span>
                        <span className="font-medium">{getEstimatedReach()}</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Coût estimé</span>
                        <span className="font-medium">{getChannelCost()}€</span>
                      </div>

                      <Separator />

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Taux d'ouverture estimé</span>
                          <span className="font-medium">~35%</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Taux de clic estimé</span>
                          <span className="font-medium">~8%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Prévisualisation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg bg-card">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Bell className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {formData.title || 'Titre de la notification'}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {formData.message || 'Votre message apparaîtra ici...'}
                            </p>
                            {formData.actionLabel && (
                              <Button size="sm" variant="outline" className="mt-2">
                                {formData.actionLabel}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        Aperçu notification push
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20">
                  <CardContent className="pt-6">
                    <div className="flex gap-3">
                      <Info className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                          Bonnes pratiques
                        </p>
                        <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                          <li>• Soyez concis et clair</li>
                          <li>• Ajoutez un appel à l'action</li>
                          <li>• Testez avant l'envoi</li>
                          <li>• Respectez les fuseaux horaires</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
      </ChannablePageWrapper>
    </>
  );
}
