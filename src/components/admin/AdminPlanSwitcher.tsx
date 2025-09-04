import { useState } from 'react';
import { Crown, Eye, Zap } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ADMIN_MODE_CONFIG, 
  getAdminModeLabel, 
  isAdmin,
  type AdminMode 
} from '@/utils/adminUtils';

export const AdminPlanSwitcher = () => {
  const { user, profile, refetchProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Only show for admins
  if (!isAdmin(profile)) {
    return null;
  }

  const currentAdminMode = profile?.admin_mode || null;

  const handleModeChange = async (newMode: string) => {
    if (!user || !profile) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          admin_mode: newMode === 'normal' ? null : newMode as AdminMode 
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update localStorage for instant UI feedback
      localStorage.setItem('admin_mode', newMode === 'normal' ? '' : newMode);

      await refetchProfile();

      toast({
        title: "Mode administrateur mis à jour",
        description: `Vous êtes maintenant en mode : ${getAdminModeLabel(newMode === 'normal' ? null : newMode as AdminMode)}`,
      });

    } catch (error) {
      console.error('Error updating admin mode:', error);
      toast({
        title: "Erreur",
        description: "Impossible de changer le mode administrateur",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-accent bg-gradient-to-r from-accent/5 to-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Crown className="h-5 w-5 text-accent" />
          <span className="font-semibold text-foreground">Mode Administrateur</span>
          <Badge variant="secondary" className="bg-accent/20 text-accent">
            <Zap className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        </div>
        
        <div className="flex items-center gap-3">
          <Select
            value={currentAdminMode || 'normal'}
            onValueChange={handleModeChange}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[240px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">
                <div className="flex items-center gap-2">
                  <span>Mode normal (plan : {profile.plan})</span>
                </div>
              </SelectItem>
              {ADMIN_MODE_CONFIG.filter(option => option.value !== null).map((option) => (
                <SelectItem key={option.value} value={option.value as string}>
                  <div className="flex items-center gap-2">
                    {option.value === 'bypass' ? (
                      <Crown className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {currentAdminMode && (
            <Badge 
              variant={currentAdminMode === 'bypass' ? 'default' : 'outline'}
              className={currentAdminMode === 'bypass' ? 'bg-accent text-accent-foreground' : ''}
            >
              {getAdminModeLabel(currentAdminMode)}
            </Badge>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          {currentAdminMode === 'bypass' && "🚀 Accès illimité à toutes les fonctionnalités"}
          {currentAdminMode?.startsWith('preview:') && "👁️ Vous voyez l'app comme un utilisateur de ce plan"}
          {!currentAdminMode && "🔒 Vous utilisez votre plan personnel"}
        </p>
      </CardContent>
    </Card>
  );
};