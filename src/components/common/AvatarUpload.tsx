import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, User, Camera } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileActions } from '@/hooks/useProfileActions';
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
  const { user } = useAuth();
  const { uploadAvatar, loading } = useProfileActions();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-20 w-20',
    lg: 'h-24 w-24'
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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

      const success = await uploadAvatar(file);
      if (success) {
        // Clear the input to allow re-uploading the same file
        event.target.value = '';
      }
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
            disabled={loading}
          >
            <Camera className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showUploadButton && (
        <Button 
          variant="outline" 
          onClick={handleUploadClick}
          disabled={loading}
        >
          <Upload className="mr-2 h-4 w-4" />
          {loading ? 'Upload en cours...' : 'Changer la photo'}
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