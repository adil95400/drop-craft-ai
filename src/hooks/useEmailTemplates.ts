import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content: string | null;
  category: string | null;
  is_active: boolean | null;
  thumbnail_url: string | null;
  variables: any;
  created_at: string | null;
  updated_at: string | null;
  user_id: string;
}

export type EmailTemplateInsert = Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>;
export type EmailTemplateUpdate = Partial<EmailTemplateInsert> & { id: string };

export function useEmailTemplates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['email-templates', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EmailTemplate[];
    },
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (template: Omit<EmailTemplateInsert, 'user_id'>) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('email_templates')
        .insert({ ...template, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Template créé avec succès');
    },
    onError: (error) => {
      console.error('Error creating template:', error);
      toast.error('Erreur lors de la création du template');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: EmailTemplateUpdate) => {
      const { data, error } = await supabase
        .from('email_templates')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Template mis à jour');
    },
    onError: (error) => {
      console.error('Error updating template:', error);
      toast.error('Erreur lors de la mise à jour');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Template supprimé');
    },
    onError: (error) => {
      console.error('Error deleting template:', error);
      toast.error('Erreur lors de la suppression');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (template: EmailTemplate) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('email_templates')
        .insert({
          name: `${template.name} (copie)`,
          subject: template.subject,
          html_content: template.html_content,
          text_content: template.text_content,
          category: template.category,
          is_active: false,
          variables: template.variables,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Template dupliqué');
    },
    onError: (error) => {
      console.error('Error duplicating template:', error);
      toast.error('Erreur lors de la duplication');
    },
  });

  return {
    templates,
    isLoading,
    createTemplate: createMutation.mutate,
    updateTemplate: updateMutation.mutate,
    deleteTemplate: deleteMutation.mutate,
    duplicateTemplate: duplicateMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
