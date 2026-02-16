import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface TeamMember {
  id: string;
  owner_user_id: string;
  member_email: string;
  member_user_id: string | null;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  status: 'pending' | 'active' | 'revoked';
  invited_at: string;
  accepted_at: string | null;
  permissions: Record<string, boolean>;
  created_at: string;
}

export function useTeamManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team-members', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('owner_user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as TeamMember[];
    },
    enabled: !!user?.id,
  });

  const inviteMember = useMutation({
    mutationFn: async ({ email, role, permissions }: { 
      email: string; 
      role: TeamMember['role']; 
      permissions?: Record<string, boolean>;
    }) => {
      if (!user?.id) throw new Error('Non authentifié');
      const { data, error } = await supabase
        .from('team_members')
        .insert({
          owner_user_id: user.id,
          member_email: email,
          role,
          permissions: permissions || { products: true, orders: true, analytics: false, settings: false },
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success('Invitation envoyée !');
    },
    onError: (e: Error) => {
      if (e.message.includes('duplicate')) {
        toast.error('Ce membre est déjà invité');
      } else {
        toast.error(`Erreur : ${e.message}`);
      }
    },
  });

  const updateMemberRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: TeamMember['role'] }) => {
      const { error } = await supabase
        .from('team_members')
        .update({ role })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success('Rôle mis à jour');
    },
  });

  const removeMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('team_members')
        .update({ status: 'revoked' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success('Membre révoqué');
    },
  });

  const activeMembers = members.filter(m => m.status !== 'revoked');
  const pendingInvites = members.filter(m => m.status === 'pending');

  return {
    members: activeMembers,
    pendingInvites,
    isLoading,
    inviteMember: inviteMember.mutate,
    isInviting: inviteMember.isPending,
    updateMemberRole: updateMemberRole.mutate,
    removeMember: removeMember.mutate,
  };
}
