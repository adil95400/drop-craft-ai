import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, Camera, Trash2, X, Check, ImageIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileActions } from '@/hooks/useProfileActions';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';

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
  const { user, refetchProfile } = useAuth();
  const { uploadAvatar, loading } = useProfileActions();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-20 w-20',
    lg: 'h-24 w-24'
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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

      // Create preview URL
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setSelectedFile(file);
      setShowPreviewModal(true);
      
      // Clear input to allow re-selecting the same file
      event.target.value = '';
    }
  };

  const handleConfirmUpload = async () => {
    if (selectedFile) {
      const success = await uploadAvatar(selectedFile);
      if (success) {
        setShowPreviewModal(false);
        setPreviewUrl(null);
        setSelectedFile(null);
        toast.success('Photo de profil mise à jour');
      }
    }
  };

  const handleCancelPreview = () => {
    setShowPreviewModal(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
  };

  const handleDeleteAvatar = async () => {
    if (!user || !currentAvatarUrl) return;
    
    setIsDeleting(true);
    try {
      // Extract file path from URL
      const urlParts = currentAvatarUrl.split('/avatars/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('avatars').remove([filePath]);
      }
      
      // Update profile to remove avatar URL
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);
      
      if (error) throw error;
      
      await refetchProfile();
      toast.success('Photo de profil supprimée');
      setShowDeleteDialog(false);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
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
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleUploadClick}
              disabled={loading}
              size="sm"
            >
              <Upload className="mr-2 h-4 w-4" />
              {loading ? 'Upload...' : 'Changer'}
            </Button>
            
            {currentAvatarUrl && (
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteDialog(true)}
                disabled={loading || isDeleting}
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Specs */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <ImageIcon className="h-3 w-3" />
          <span>JPG, PNG, GIF, WebP</span>
        </div>
        <span>•</span>
        <span>Max 5 MB</span>
        <span>•</span>
        <span>200×200px recommandé</span>
      </div>

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={(open) => !open && handleCancelPreview()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Aperçu de la photo</DialogTitle>
            <DialogDescription>
              Vérifiez votre nouvelle photo de profil avant de confirmer
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center gap-4 py-4">
            {previewUrl && (
              <div className="relative">
                <img 
                  src={previewUrl} 
                  alt="Aperçu" 
                  className="h-32 w-32 rounded-full object-cover border-4 border-primary/20"
                />
                <div className="absolute inset-0 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-background" />
              </div>
            )}
            
            {selectedFile && (
              <div className="text-center text-sm text-muted-foreground">
                <p className="font-medium">{selectedFile.name}</p>
                <p>{formatFileSize(selectedFile.size)}</p>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCancelPreview} disabled={loading}>
              <X className="mr-2 h-4 w-4" />
              Annuler
            </Button>
            <Button onClick={handleConfirmUpload} disabled={loading}>
              {loading ? (
                <>Téléchargement...</>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Confirmer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la photo de profil ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Votre photo de profil actuelle sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAvatar}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AvatarUpload;
