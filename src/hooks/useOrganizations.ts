import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const useOrganizations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user's organizations
  const {
    data: organizations = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['organizations', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Temporarily commented until migration is approved
      // const { data, error } = await supabase
      //   .from('organization_members')
      //   .select(`
      //     *,
      //     organizations (
      //       id,
      //       name,
      //       slug,
      //       settings,
      //       created_at,
      //       owner_id
      //     )
      //   `)
      //   .eq('user_id', user.id)
      //   .order('created_at', { ascending: false });
      const data: any[] = [];
      const error = null;

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Get current organization (first one for now)
  const currentOrganization = null; // Temporarily disabled

  // Get organization members
  const {
    data: members = [],
    isLoading: isLoadingMembers,
  } = useQuery({
    queryKey: ['organization-members', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return [];

      // Temporarily commented until migration is approved
      // const { data, error } = await supabase
      //   .from('organization_members')
      //   .select(`
      //     *,
      //     profiles (
      //       id,
      //       full_name,
      //       avatar_url,
      //       email
      //     )
      //   `)
      //   .eq('organization_id', currentOrganization.id)
      //   .order('joined_at', { ascending: false });
      const data: any[] = [];
      const error = null;

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrganization,
  });

  // Create organization
  const createOrganization = useMutation({
    mutationFn: async ({ name, slug }: { name: string; slug: string }) => {
      if (!user) throw new Error('User not authenticated');

      // Temporarily commented until migration is approved
      // Create organization
      // const { data: org, error: orgError } = await supabase
      //   .from('organizations')
      //   .insert([{
      //     name,
      //     slug,
      //     owner_id: user.id,
      //     settings: {},
      //   }])
      //   .select()
      //   .single();

      // if (orgError) throw orgError;

      // Add user as owner/admin
      // const { error: memberError } = await supabase
      //   .from('organization_members')
      //   .insert([{
      //     organization_id: org.id,
      //     user_id: user.id,
      //     role: 'admin',
      //     permissions: ['*'],
      //   }]);

      // if (memberError) throw memberError;

      const org = { id: 'temp', name, slug };
      return org;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast({
        title: "Organisation créée",
        description: "Votre organisation a été créée avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Invite member
  const inviteMember = useMutation({
    mutationFn: async ({ email, role = 'user' }: { email: string; role?: string }) => {
      if (!currentOrganization) throw new Error('No organization selected');

      // Temporarily commented until migration is approved
      // For now, we'll create a simple invitation
      // In a real app, you'd send an email invitation
      // const { data, error } = await supabase
      //   .from('organization_members')
      //   .insert([{
      //     organization_id: currentOrganization.id,
      //     user_id: user?.id, // This should be the invited user's ID
      //     role,
      //     permissions: role === 'admin' ? ['*'] : ['read'],
      //     invited_by: user?.id,
      //   }])
      //   .select()
      //   .single();
      const data = null;
      const error = null;

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
      toast({
        title: "Invitation envoyée",
        description: "L'invitation a été envoyée avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update member role
  const updateMemberRole = useMutation({
    mutationFn: async ({ memberId, role, permissions }: { 
      memberId: string; 
      role: string; 
      permissions: string[] 
    }) => {
      // Temporarily commented until migration is approved
      // const { data, error } = await supabase
      //   .from('organization_members')
      //   .update({ role, permissions })
      //   .eq('id', memberId)
      //   .select()
      //   .single();
      const data = null;
      const error = null;

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
      toast({
        title: "Rôle mis à jour",
        description: "Le rôle du membre a été modifié.",
      });
    },
  });

  // Remove member
  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      // Temporarily commented until migration is approved
      // const { error } = await supabase
      //   .from('organization_members')
      //   .delete()
      //   .eq('id', memberId);
      const error = null;

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
      toast({
        title: "Membre retiré",
        description: "Le membre a été retiré de l'organisation.",
      });
    },
  });

  return {
    organizations,
    currentOrganization,
    members,
    isLoading,
    isLoadingMembers,
    error,
    createOrganization: createOrganization.mutate,
    inviteMember: inviteMember.mutate,
    updateMemberRole: updateMemberRole.mutate,
    removeMember: removeMember.mutate,
    isCreating: createOrganization.isPending,
    isInviting: inviteMember.isPending,
    isUpdating: updateMemberRole.isPending,
    isRemoving: removeMember.isPending,
  };
};