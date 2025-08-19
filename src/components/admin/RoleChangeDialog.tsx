import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { roleService } from '@/lib/roleService';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/hooks/useUserRole';

interface RoleChangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  currentRole: UserRole;
  onRoleChanged?: () => void;
}

export const RoleChangeDialog = ({ 
  isOpen, 
  onClose, 
  userId, 
  userName, 
  currentRole,
  onRoleChanged 
}: RoleChangeDialogProps) => {
  const [newRole, setNewRole] = useState<UserRole>(currentRole);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleRoleChange = async () => {
    if (newRole === currentRole) {
      onClose();
      return;
    }

    setIsLoading(true);
    try {
      const result = await roleService.setUserRole(userId, newRole);
      
      if (result.success) {
        toast({
          title: "Rôle mis à jour",
          description: `${userName} est maintenant ${newRole === 'admin' ? 'administrateur' : 'utilisateur'}`,
        });
        onRoleChanged?.();
        onClose();
      } else {
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le rôle",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier le rôle utilisateur</DialogTitle>
          <DialogDescription>
            Changer le rôle de {userName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nouveau rôle</label>
            <Select value={newRole} onValueChange={(value: UserRole) => setNewRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Utilisateur</SelectItem>
                <SelectItem value="admin">Administrateur</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button onClick={handleRoleChange} disabled={isLoading}>
            {isLoading ? "Mise à jour..." : "Confirmer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};