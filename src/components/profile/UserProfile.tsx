import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useActivityLogs } from '@/hooks/useActivityLogs';
import AvatarUpload from '@/components/common/AvatarUpload';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Globe, 
  Shield, 
  Activity, 
  Bell,
  Save,
  Upload,
  Key,
  LogOut
} from 'lucide-react';

const UserProfile = () => {
  const { user, profile, updateProfile, signOut } = useAuth();
  const { logs, isLoading: isLoadingLogs } = useActivityLogs();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    company: profile?.company || '',
    phone: profile?.phone || '',
    website: profile?.website || '',
    bio: profile?.bio || '',
  });

  const [preferences, setPreferences] = useState({
    email_notifications: true,
    push_notifications: true,
    marketing_emails: false,
    security_alerts: true,
  });

  const handleSave = async () => {
    await updateProfile(formData);
    setIsEditing(false);
  };

  const handleLogout = () => {
    signOut();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Mon Profil
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos informations personnelles et préférences
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Déconnexion
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="border-border bg-card shadow-card">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AvatarUpload 
                currentAvatarUrl={profile?.avatar_url}
                userName={profile?.full_name || user?.email || 'User'}
                size="lg"
                showUploadButton={false}
              />
            </div>
            <CardTitle>{profile?.full_name || 'Nom non défini'}</CardTitle>
            <CardDescription>{user?.email}</CardDescription>
            <Badge variant="secondary" className="w-fit mx-auto">
              {profile?.role || 'Utilisateur'}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{user?.email}</span>
              </div>
              {profile?.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.phone}</span>
                </div>
              )}
              {profile?.company && (
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.company}</span>
                </div>
              )}
              {profile?.website && (
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.website}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="profile">Profil</TabsTrigger>
              <TabsTrigger value="security">Sécurité</TabsTrigger>
              <TabsTrigger value="preferences">Préférences</TabsTrigger>
              <TabsTrigger value="activity">Activité</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card className="border-border bg-card shadow-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Informations Personnelles</CardTitle>
                      <CardDescription>Mettez à jour vos informations de profil</CardDescription>
                    </div>
                    {!isEditing ? (
                      <Button variant="outline" onClick={() => setIsEditing(true)}>
                        Modifier
                      </Button>
                    ) : (
                      <div className="space-x-2">
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          Annuler
                        </Button>
                        <Button variant="hero" onClick={handleSave}>
                          <Save className="mr-2 h-4 w-4" />
                          Sauvegarder
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nom complet</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Entreprise</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Site web</Label>
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Input
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Parlez-nous de vous..."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <Card className="border-border bg-card shadow-card">
                <CardHeader>
                  <CardTitle>Sécurité</CardTitle>
                  <CardDescription>Gérez la sécurité de votre compte</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center">
                      <Shield className="mr-2 h-4 w-4" />
                      Mot de passe
                    </h4>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Mot de passe actuel</Label>
                        <Input type="password" placeholder="••••••••" />
                      </div>
                      <div className="space-y-2">
                        <Label>Nouveau mot de passe</Label>
                        <Input type="password" placeholder="••••••••" />
                      </div>
                      <div className="space-y-2">
                        <Label>Confirmer nouveau mot de passe</Label>
                        <Input type="password" placeholder="••••••••" />
                      </div>
                    </div>
                    <Button variant="outline">
                      Changer le Mot de Passe
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center">
                      <Key className="mr-2 h-4 w-4" />
                      Authentification à deux facteurs
                    </h4>
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div>
                        <div className="font-medium">2FA</div>
                        <div className="text-sm text-muted-foreground">
                          Ajoutez une couche de sécurité supplémentaire
                        </div>
                      </div>
                      <Button variant="outline">
                        Activer 2FA
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Sessions actives</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <div className="font-medium">Session actuelle</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date().toLocaleString('fr-FR')}
                          </div>
                        </div>
                        <Badge variant="secondary">Actuelle</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences">
              <Card className="border-border bg-card shadow-card">
                <CardHeader>
                  <CardTitle>Préférences</CardTitle>
                  <CardDescription>Configurez vos notifications et préférences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center">
                      <Bell className="mr-2 h-4 w-4" />
                      Notifications
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Notifications email</div>
                          <div className="text-sm text-muted-foreground">
                            Recevez des notifications par email
                          </div>
                        </div>
                        <Switch
                          checked={preferences.email_notifications}
                          onCheckedChange={(checked) => 
                            setPreferences({ ...preferences, email_notifications: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Notifications push</div>
                          <div className="text-sm text-muted-foreground">
                            Notifications dans le navigateur
                          </div>
                        </div>
                        <Switch
                          checked={preferences.push_notifications}
                          onCheckedChange={(checked) => 
                            setPreferences({ ...preferences, push_notifications: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Emails marketing</div>
                          <div className="text-sm text-muted-foreground">
                            Conseils et nouvelles fonctionnalités
                          </div>
                        </div>
                        <Switch
                          checked={preferences.marketing_emails}
                          onCheckedChange={(checked) => 
                            setPreferences({ ...preferences, marketing_emails: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Alertes sécurité</div>
                          <div className="text-sm text-muted-foreground">
                            Connexions et activités suspectes
                          </div>
                        </div>
                        <Switch
                          checked={preferences.security_alerts}
                          onCheckedChange={(checked) => 
                            setPreferences({ ...preferences, security_alerts: checked })
                          }
                        />
                      </div>
                    </div>

                    <Button variant="hero">
                      Sauvegarder les Préférences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity">
              <Card className="border-border bg-card shadow-card">
                <CardHeader>
                  <CardTitle>Activité Récente</CardTitle>
                  <CardDescription>Historique de vos actions sur la plateforme</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingLogs ? (
                    <p className="text-muted-foreground">Chargement de l'activité...</p>
                  ) : (
                    <div className="space-y-3">
                      {logs.slice(0, 10).map((log: any) => (
                        <div key={log.id} className="flex items-start space-x-3 p-3 border border-border rounded-lg">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <Activity className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{log.action}</span>
                              <Badge variant="outline" className="text-xs">
                                {log.resource}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {new Date(log.created_at).toLocaleString('fr-FR')}
                            </p>
                          </div>
                        </div>
                      ))}
                      {logs.length === 0 && (
                        <p className="text-muted-foreground text-center py-8">
                          Aucune activité récente
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;