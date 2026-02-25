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
  store_ids: string[] | null;
  created_at: string;
}

export const DEFAULT_PERMISSIONS: Record<TeamMember['role'], Record<string, boolean>> = {
  owner: { products: true, orders: true, analytics: true, settings: true, billing: true, team: true },
  admin: { products: true, orders: true, analytics: true, settings: true, billing: false, team: true },
  editor: { products: true, orders: true, analytics: false, settings: false, billing: false, team: false },
  viewer: { products: false, orders: false, analytics: true, settings: false, billing: false, team: false },
};

export const PERMISSION_LABELS: Record<string, string> = {
  products: 'Produits',
  orders: 'Commandes',
  analytics: 'Analytics',
  settings: 'Paramètres',
  billing: 'Facturation',
  team: 'Équipe',
};

export function useTeamManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch members I own
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

  // Fetch invitations addressed to me
  const { data: myInvitations = [] } = useQuery({
    queryKey: ['my-invitations', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('member_email', user.email)
        .eq('status', 'pending')
        .order('invited_at', { ascending: false });
      if (error) throw error;
      return data as TeamMember[];
    },
    enabled: !!user?.email,
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
          permissions: permissions || DEFAULT_PERMISSIONS[role],
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

  const acceptInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      if (!user?.id) throw new Error('Non authentifié');
      const { error } = await supabase
        .from('team_members')
        .update({ status: 'active', member_user_id: user.id, accepted_at: new Date().toISOString() })
        .eq('id', invitationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success('Invitation acceptée !');
    },
  });

  const declineInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('team_members')
        .update({ status: 'revoked' })
        .eq('id', invitationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-invitations'] });
      toast.success('Invitation déclinée');
    },
  });

  const updateMemberRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: TeamMember['role'] }) => {
      const { error } = await supabase
        .from('team_members')
        .update({ role, permissions: DEFAULT_PERMISSIONS[role] })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success('Rôle mis à jour');
    },
  });

  const updateMemberPermissions = useMutation({
    mutationFn: async ({ id, permissions }: { id: string; permissions: Record<string, boolean> }) => {
      const { error } = await supabase
        .from('team_members')
        .update({ permissions })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success('Permissions mises à jour');
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
    myInvitations,
    isLoading,
    inviteMember: inviteMember.mutate,
    isInviting: inviteMember.isPending,
    acceptInvitation: acceptInvitation.mutate,
    declineInvitation: declineInvitation.mutate,
    updateMemberRole: updateMemberRole.mutate,
    updateMemberPermissions: updateMemberPermissions.mutate,
    removeMember: removeMember.mutate,
  };
}
