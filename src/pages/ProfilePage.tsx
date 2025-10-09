import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileActions } from '@/hooks/useProfileActions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Shield, Crown, Camera, Save, Calendar, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const ProfilePage = () => {
  const { user, profile } = useAuth();
  const { updateProfile, uploadAvatar, loading } = useProfileActions();
  const [isEditing, setIsEditing] = useState(false);
  
  // Check admin status directly from profile
  const isAdmin = profile?.is_admin === true;
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    bio: profile?.bio || '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const getUserInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
    }
    return user.email?.charAt(0).toUpperCase() || 'U';
  };

  const getRoleBadge = () => {
    if (isAdmin) {
      return (
        <Badge variant="destructive" className="text-xs">
          <Crown className="w-3 h-3 mr-1" />
          Administrateur
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-xs">
        <User className="w-3 h-3 mr-1" />
        Utilisateur
      </Badge>
    );
  };

  const handleSave = async () => {
    const success = await updateProfile(formData);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return;
      }
      await uploadAvatar(file);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <Helmet>
        <title>Mon Profil - DropCraft</title>
        <meta name="description" content="Gérez vos informations personnelles et préférences de compte" />
      </Helmet>

      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Mon Profil</h1>
            <p className="text-muted-foreground">
              Gérez vos informations personnelles et préférences de compte
            </p>
          </div>

          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations personnelles
              </CardTitle>
              <CardDescription>
                Votre profil public et informations de base
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                    onClick={handleAvatarClick}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">
                    {profile?.full_name || 'Nom non défini'}
                  </h3>
                  <div className="flex items-center gap-2">
                    {getRoleBadge()}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse e-mail</Label>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={user.email || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    L'adresse e-mail ne peut pas être modifiée
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Rôle</Label>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="role"
                      value={isAdmin ? 'Administrateur' : 'Utilisateur'}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name">Nom complet</Label>
                  <Input
                    id="full_name"
                    value={isEditing ? formData.full_name : (profile?.full_name || '')}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Votre nom complet"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="created_at">Membre depuis</Label>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="created_at"
                      value={user.created_at ? formatDate(user.created_at) : 'Non disponible'}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Biographie</Label>
                <textarea
                  id="bio"
                  className="w-full min-h-[100px] px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md resize-none"
                  value={isEditing ? formData.bio : (profile?.bio || '')}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Parlez-nous de vous..."
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2">
                {isEditing ? (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                    >
                      Annuler
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                      {loading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Sauvegarder
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>
                    Modifier le profil
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;