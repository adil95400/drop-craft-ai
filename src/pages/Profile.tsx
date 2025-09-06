import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useEnhancedAuth } from "@/hooks/useEnhancedAuth";
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Globe, 
  Save, 
  Crown,
  Shield,
  Calendar,
  MapPin,
  Edit3
} from "lucide-react";
import AvatarUpload from '@/components/common/AvatarUpload';

const Profile = () => {
  const { user, profile, updateProfile } = useAuth();
  const { isAdmin, role } = useEnhancedAuth();

  const [profileData, setProfileData] = useState({
    name: profile?.full_name || user?.email?.split('@')[0] || "Utilisateur",
    email: user?.email || "",
    phone: profile?.phone || "",
    company: profile?.company || "",
    website: profile?.website || "",
    bio: profile?.bio || "",
    location: profile?.location || "",
    timezone: profile?.timezone || "Europe/Paris"
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        full_name: profileData.name,
        phone: profileData.phone,
        company: profileData.company,
        website: profileData.website,
        bio: profileData.bio,
        location: profileData.location,
        timezone: profileData.timezone
      });
      
      toast.success('Profil sauvegardé avec succès');
      setIsEditing(false);
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde du profil');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-3 w-3" />;
      case 'manager':
        return <Shield className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Mon Profil
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos informations personnelles et préférences de compte
          </p>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              <Edit3 className="mr-2 h-4 w-4" />
              Modifier
            </Button>
          ) : (
            <>
              <Button onClick={() => setIsEditing(false)} variant="outline">
                Annuler
              </Button>
              <Button onClick={handleSaveProfile} variant="default">
                <Save className="mr-2 h-4 w-4" />
                Sauvegarder
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AvatarUpload 
                currentAvatarUrl={profile?.avatar_url}
                userName={profileData.name}
                size="lg"
                showUploadButton={isEditing}
              />
            </div>
            <CardTitle className="text-xl">{profileData.name}</CardTitle>
            <CardDescription className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Mail className="h-3 w-3" />
                {profileData.email}
              </div>
              <div className="flex justify-center">
                <Badge 
                  className={`${getRoleBadgeColor(role)} flex items-center gap-1`}
                >
                  {getRoleIcon(role)}
                  {role === 'admin' ? 'Administrateur' : 
                   role === 'manager' ? 'Manager' : 'Utilisateur'}
                </Badge>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-primary">
                  {new Date(user?.created_at || '').toLocaleDateString('fr-FR', { 
                    year: 'numeric', 
                    month: 'short' 
                  })}
                </div>
                <div className="text-xs text-muted-foreground">Membre depuis</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-primary">
                  {isAdmin ? 'Illimité' : profile?.plan || 'Standard'}
                </div>
                <div className="text-xs text-muted-foreground">Plan actuel</div>
              </div>
            </div>

            {/* Role Permissions for Admin */}
            {isAdmin && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800 font-medium text-sm">
                  <Crown className="h-4 w-4" />
                  Privilèges Administrateur
                </div>
                <ul className="text-xs text-red-700 mt-2 space-y-1">
                  <li>• Accès complet à toutes les fonctionnalités</li>
                  <li>• Gestion des utilisateurs et plans</li>
                  <li>• Configuration système avancée</li>
                  <li>• Analytics et rapports détaillés</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Profile Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Informations personnelles
            </CardTitle>
            <CardDescription>
              Votre profil public et informations de base
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nom complet
                </Label>
                <Input 
                  id="name" 
                  value={profileData.name} 
                  onChange={e => setProfileData({
                    ...profileData,
                    name: e.target.value
                  })} 
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Adresse e-mail
                </Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={profileData.email} 
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  L'adresse e-mail ne peut pas être modifiée
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Téléphone
                </Label>
                <Input 
                  id="phone" 
                  value={profileData.phone} 
                  onChange={e => setProfileData({
                    ...profileData,
                    phone: e.target.value
                  })} 
                  disabled={!isEditing}
                  placeholder="+33 1 23 45 67 89"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Entreprise
                </Label>
                <Input 
                  id="company" 
                  value={profileData.company} 
                  onChange={e => setProfileData({
                    ...profileData,
                    company: e.target.value
                  })} 
                  disabled={!isEditing}
                  placeholder="Nom de votre entreprise"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Localisation
                </Label>
                <Input 
                  id="location" 
                  value={profileData.location} 
                  onChange={e => setProfileData({
                    ...profileData,
                    location: e.target.value
                  })} 
                  disabled={!isEditing}
                  placeholder="Ville, Pays"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Site web
                </Label>
                <Input 
                  id="website" 
                  value={profileData.website} 
                  onChange={e => setProfileData({
                    ...profileData,
                    website: e.target.value
                  })} 
                  disabled={!isEditing}
                  placeholder="https://votre-site.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Biographie</Label>
              <Textarea 
                id="bio" 
                value={profileData.bio} 
                onChange={e => setProfileData({
                  ...profileData,
                  bio: e.target.value
                })} 
                disabled={!isEditing}
                placeholder="Parlez-nous de vous..."
                rows={4}
              />
            </div>

            {/* Role Information */}
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Informations du rôle
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Rôle</Label>
                  <div className="flex items-center gap-2">
                    {getRoleIcon(role)}
                    <span className="font-medium">
                      {role === 'admin' ? 'Administrateur' : 
                       role === 'manager' ? 'Manager' : 'Utilisateur'}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Plan</Label>
                  <div className="font-medium">
                    {isAdmin ? 'Ultra Pro (Admin)' : profile?.plan || 'Standard'}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Membre depuis</Label>
                  <div className="font-medium flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    {new Date(user?.created_at || '').toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;