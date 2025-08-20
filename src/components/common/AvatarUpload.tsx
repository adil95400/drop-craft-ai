import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, User, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  userName?: string;
  size?: 'sm' | 'md' | 'lg';
  showUploadButton?: boolean;
}

const AvatarUpload = ({ 
  currentAvatarUrl, 
  userName = 'User', 
  size = 'md',
  showUploadButton = true 
}: AvatarUploadProps) => {
  const { user, updateProfile, refetchProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-20 w-20',
    lg: 'h-24 w-24'
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadAvatar(file);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) {
      toast.error('Vous devez être connecté pour uploader une photo');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner un fichier image');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La taille du fichier ne doit pas dépasser 5MB');
      return;
    }

    setUploading(true);

    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true // Replace existing file
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update user profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Refresh profile data
      await refetchProfile();

      toast.success('Photo de profil mise à jour avec succès');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error('Erreur lors de l\'upload de la photo: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="relative">
        <Avatar className={sizeClasses[size]}>
          <AvatarImage src={currentAvatarUrl || undefined} />
          <AvatarFallback className="bg-gradient-primary text-primary-foreground text-lg">
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>
        
        {!showUploadButton && (
          <Button
            size="icon"
            variant="outline"
            className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
            onClick={handleUploadClick}
            disabled={uploading}
          >
            <Camera className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showUploadButton && (
        <Button 
          variant="outline" 
          onClick={handleUploadClick}
          disabled={uploading}
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? 'Upload en cours...' : 'Changer la photo'}
        </Button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default AvatarUpload;