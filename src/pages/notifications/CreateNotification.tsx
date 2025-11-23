import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ArrowLeft, Bell } from 'lucide-react';

export default function CreateNotification() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: '',
    priority: '',
    targetUsers: '',
    scheduleDate: '',
    pushNotification: true,
    emailNotification: false,
    smsNotification: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.message || !formData.type) {
      toast.error('Titre, message et type sont requis');
      return;
    }
    
    toast.success('Notification créée avec succès');
    navigate('/dashboard');
  };

  return (
    <>
      <Helmet>
        <title>Créer une Notification - ShopOpti</title>
        <meta name="description" content="Envoyez une notification à vos utilisateurs depuis ShopOpti" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4 max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au tableau de bord
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl">Créer une notification</CardTitle>
              </div>
              <CardDescription>
                Envoyez une notification à vos utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Titre *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Titre de la notification"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Type *</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Information</SelectItem>
                        <SelectItem value="warning">Avertissement</SelectItem>
                        <SelectItem value="success">Succès</SelectItem>
                        <SelectItem value="error">Erreur</SelectItem>
                        <SelectItem value="promotion">Promotion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Votre message..."
                    rows={5}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priorité</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner la priorité" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Faible</SelectItem>
                        <SelectItem value="medium">Moyenne</SelectItem>
                        <SelectItem value="high">Élevée</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetUsers">Utilisateurs cibles</Label>
                    <Input
                      id="targetUsers"
                      value={formData.targetUsers}
                      onChange={(e) => setFormData({ ...formData, targetUsers: e.target.value })}
                      placeholder="Tous, Admin, Clients..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduleDate">Programmer pour une date (optionnel)</Label>
                  <Input
                    id="scheduleDate"
                    type="datetime-local"
                    value={formData.scheduleDate}
                    onChange={(e) => setFormData({ ...formData, scheduleDate: e.target.value })}
                  />
                </div>

                <div className="space-y-4">
                  <Label>Canaux de notification</Label>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="pushNotification" className="cursor-pointer">
                        Notification push
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Notification dans l'application
                      </p>
                    </div>
                    <Switch
                      id="pushNotification"
                      checked={formData.pushNotification}
                      onCheckedChange={(checked) => setFormData({ ...formData, pushNotification: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="emailNotification" className="cursor-pointer">
                        Email
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Notification par email
                      </p>
                    </div>
                    <Switch
                      id="emailNotification"
                      checked={formData.emailNotification}
                      onCheckedChange={(checked) => setFormData({ ...formData, emailNotification: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="smsNotification" className="cursor-pointer">
                        SMS
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Notification par SMS
                      </p>
                    </div>
                    <Switch
                      id="smsNotification"
                      checked={formData.smsNotification}
                      onCheckedChange={(checked) => setFormData({ ...formData, smsNotification: checked })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/dashboard')}
                  >
                    Annuler
                  </Button>
                  <Button type="submit">
                    Envoyer la notification
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
