import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, Shield, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEnhancedAuth } from "@/hooks/useEnhancedAuth";
import { useMFA } from "@/hooks/useMFA";
import AvatarUpload from '@/components/common/AvatarUpload';
import { RefreshProfileButton } from '@/components/auth/RefreshProfileButton';
import { ProfileCompletionCard } from './ProfileCompletionCard';
import { DangerZoneCard } from './DangerZoneCard';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  company: string;
  website: string;
  bio: string;
}

interface ProfileTabProps {
  profileData: ProfileData;
  setProfileData: (data: ProfileData) => void;
  onSave: () => Promise<void>;
}

export function ProfileTab({ profileData, setProfileData, onSave }: ProfileTabProps) {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { isAdmin, role } = useEnhancedAuth();
  const { isEnabled: is2FAEnabled } = useMFA();

  const handleCompletionAction = (action: string) => {
    switch (action) {
      case 'avatar':
        // Scroll to avatar section
        document.getElementById('avatar-section')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case '2fa':
        navigate('/settings?tab=security');
        break;
      case 'company':
        document.getElementById('company')?.focus();
        break;
      case 'website':
        document.getElementById('website')?.focus();
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Completion Card */}
      <ProfileCompletionCard
        hasAvatar={!!profile?.avatar_url}
        isEmailVerified={!!user?.email_confirmed_at}
        has2FA={is2FAEnabled}
        hasCompany={!!profileData.company}
        hasWebsite={!!profileData.website}
        hasBio={!!profileData.bio}
        onAction={handleCompletionAction}
      />

      {/* Personal Info Card */}
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-primary text-lg">👤</span>
            </div>
            Informations Personnelles
          </CardTitle>
          <CardDescription>Gérez vos informations de profil et votre identité</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div id="avatar-section">
            <AvatarUpload 
              currentAvatarUrl={profile?.avatar_url}
              userName={profileData.name}
              size="lg"
              showUploadButton={true}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input 
                id="name" 
                value={profileData.name} 
                onChange={e => setProfileData({
                  ...profileData,
                  name: e.target.value
                })} 
                placeholder="Votre nom complet"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={profileData.email} 
                disabled
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input 
                id="phone" 
                value={profileData.phone} 
                onChange={e => setProfileData({
                  ...profileData,
                  phone: e.target.value
                })}
                placeholder="+33 6 12 34 56 78"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Entreprise</Label>
              <Input 
                id="company" 
                value={profileData.company} 
                onChange={e => setProfileData({
                  ...profileData,
                  company: e.target.value
                })}
                placeholder="Nom de votre entreprise"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Site web</Label>
            <Input 
              id="website" 
              value={profileData.website} 
              onChange={e => setProfileData({
                ...profileData,
                website: e.target.value
              })}
              placeholder="https://votresite.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea 
              id="bio" 
              value={profileData.bio} 
              onChange={e => setProfileData({
                ...profileData,
                bio: e.target.value
              })} 
              placeholder="Parlez-nous de vous et de votre activité..."
              rows={4}
              className="resize-none"
            />
          </div>

          <Button onClick={onSave} className="w-full sm:w-auto">
            <Save className="mr-2 h-4 w-4" />
            Sauvegarder le Profil
          </Button>
        </CardContent>
      </Card>

      {/* Sync Profile Card */}
      {profile && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <RefreshCw className="h-4 w-4 text-primary" />
              Synchronisation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Admin:</span>
                  <Badge variant={profile?.is_admin ? "default" : "secondary"} className="ml-2">
                    {profile?.is_admin ? 'Oui' : 'Non'}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Mode:</span>
                  <span className="font-medium ml-2">{profile?.admin_mode || 'Standard'}</span>
                </div>
              </div>
              <RefreshProfileButton />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Section */}
      {isAdmin && (
        <Card className="border-destructive/30 bg-gradient-to-br from-destructive/5 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Shield className="h-5 w-5" />
              Administration Système
            </CardTitle>
            <CardDescription>Accès aux outils d'administration avancés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex gap-4">
                <Badge variant="destructive">{role?.toUpperCase()}</Badge>
                <span className="text-sm text-muted-foreground">Privilèges complets</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/admin')}
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                <Shield className="mr-2 h-4 w-4" />
                Panneau Admin
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Danger Zone */}
      <DangerZoneCard />
    </div>
  );
}
