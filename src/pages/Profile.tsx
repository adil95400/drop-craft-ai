import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useEnhancedAuth } from "@/hooks/useEnhancedAuth";
import { useUnifiedPlan } from '@/lib/unified-plan-system';
import { useProfileRefresh } from '@/hooks/useProfileRefresh';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
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
  const { effectivePlan } = useUnifiedPlan();
  
  useProfileRefresh();

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
    <ChannablePageWrapper
      title="Mon Profil"
      subtitle="Compte"
      description="Gérez vos informations personnelles et paramètres de compte."
      heroImage="settings"
      badge={{ label: role === 'admin' ? 'Admin' : 'Utilisateur', icon: User }}
      actions={
        !isEditing ? (
          <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className="text-xs sm:text-sm">
            <Edit3 className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Modifier
          </Button>
        ) : (
          <>
            <Button onClick={() => setIsEditing(false)} variant="outline" size="sm" className="text-xs sm:text-sm">
              Annuler
            </Button>
            <Button onClick={handleSaveProfile} variant="default" size="sm" className="text-xs sm:text-sm">
              <Save className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Sauvegarder
            </Button>
          </>
        )
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center p-4 sm:p-6">
            <div className="flex justify-center mb-3 sm:mb-4">
              <AvatarUpload 
                currentAvatarUrl={profile?.avatar_url}
                userName={profileData.name}
                size="lg"
                showUploadButton={isEditing}
              />
            </div>
            <CardTitle className="text-lg sm:text-xl">{profileData.name}</CardTitle>
            <CardDescription>
              <div className="flex items-center justify-center gap-2 mb-2 text-xs sm:text-sm">
                <Mail className="h-3 w-3" />
                <span className="truncate max-w-[200px]">{profileData.email}</span>
              </div>
              <div className="flex justify-center">
                <Badge 
                  className={`${getRoleBadgeColor(role)} flex items-center gap-1 text-xs`}
                >
                  {getRoleIcon(role)}
                  {role === 'admin' ? 'Admin' : 
                   role === 'manager' ? 'Manager' : 'User'}
                </Badge>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 text-center">
              <div className="space-y-1">
                <div className="text-lg sm:text-2xl font-bold text-primary">
                  {new Date(user?.created_at || '').toLocaleDateString('fr-FR', { 
                    year: 'numeric', 
                    month: 'short' 
                  })}
                </div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Membre depuis</div>
              </div>
              <div className="space-y-1">
                <div className="text-lg sm:text-2xl font-bold text-primary truncate">
                  {isAdmin ? 'Illimité' : effectivePlan || 'Standard'}
                </div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Plan actuel</div>
              </div>
            </div>

            {/* Role Permissions for Admin */}
            {isAdmin && (
              <div className="p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800 font-medium text-xs sm:text-sm">
                  <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Privilèges Admin
                </div>
                <ul className="text-[10px] sm:text-xs text-red-700 mt-2 space-y-0.5 sm:space-y-1">
                  <li>• Accès complet</li>
                  <li>• Gestion utilisateurs</li>
                  <li>• Configuration système</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Profile Information */}
        <Card className="lg:col-span-2">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Informations personnelles
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Votre profil public et informations de base
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2 text-xs sm:text-sm">
                  <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-xs sm:text-sm">
                  <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  E-mail
                </Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={profileData.email} 
                  disabled
                  className="bg-muted text-sm"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2 text-xs sm:text-sm">
                  <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="company" className="flex items-center gap-2 text-xs sm:text-sm">
                  <Building className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2 text-xs sm:text-sm">
                  <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="website" className="flex items-center gap-2 text-xs sm:text-sm">
                  <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
                  className="text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="bio" className="text-xs sm:text-sm">Biographie</Label>
              <Textarea 
                id="bio" 
                value={profileData.bio} 
                onChange={e => setProfileData({
                  ...profileData,
                  bio: e.target.value
                })} 
                disabled={!isEditing}
                placeholder="Parlez-nous de vous..."
                rows={3}
                className="text-sm"
              />
            </div>

            {/* Role Information */}
            <div className="border-t pt-4 sm:pt-6">
              <h3 className="font-semibold mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Informations du rôle
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] sm:text-xs text-muted-foreground">Rôle</Label>
                  <div className="flex items-center gap-2 text-sm">
                    {getRoleIcon(role)}
                    <span className="font-medium">
                      {role === 'admin' ? 'Admin' : 
                       role === 'manager' ? 'Manager' : 'User'}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] sm:text-xs text-muted-foreground">Plan</Label>
                  <div className="font-medium text-sm truncate">
                    {isAdmin ? `${effectivePlan} (Admin)` : effectivePlan || 'Standard'}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] sm:text-xs text-muted-foreground">Membre depuis</Label>
                  <div className="font-medium flex items-center gap-2 text-sm">
                    <Calendar className="h-3 w-3" />
                    {new Date(user?.created_at || '').toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ChannablePageWrapper>
  );
};

export default Profile;
