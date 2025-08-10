import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  status: 'draft' | 'published' | 'scheduled';
  category: string;
  publish_date: string;
  views: number;
  ai_generated: boolean;
  tags?: string[];
  seo_title?: string;
  seo_description?: string;
  image_url?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBlogPost {
  title: string;
  content: string;
  excerpt?: string;
  status: 'draft' | 'published' | 'scheduled';
  category: string;
  publish_date?: string;
  views?: number;
  ai_generated?: boolean;
  tags?: string[];
  seo_title?: string;
  seo_description?: string;
  image_url?: string;
}

export interface BlogConfig {
  subject: string;
  category: string;
  keywords: string;
  length: 'short' | 'medium' | 'long';
  tone: 'professional' | 'casual' | 'expert' | 'beginner';
  instructions: string;
  includeImages: boolean;
  autoPublish: boolean;
}

export const useBlog = () => {
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch blog posts
  const { data: posts = [], isLoading: loading, error } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BlogPost[];
    }
  });

  // Create blog post mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: CreateBlogPost) => {
      const { data, error } = await supabase
        .from('blog_posts')
        .insert({
          ...postData,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast({
        title: "Article créé",
        description: "L'article a été créé avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer l'article",
        variant: "destructive"
      });
    }
  });

  // Update blog post mutation
  const updatePostMutation = useMutation({
    mutationFn: async ({ id, ...postData }: Partial<BlogPost> & { id: string }) => {
      const { data, error } = await supabase
        .from('blog_posts')
        .update(postData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast({
        title: "Article mis à jour",
        description: "L'article a été mis à jour avec succès",
      });
    }
  });

  // Delete blog post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast({
        title: "Article supprimé",
        description: "L'article a été supprimé avec succès",
      });
    }
  });

  const generatePost = async (config: BlogConfig) => {
    setGenerating(true);
    
    toast({
      title: "Génération IA",
      description: "L'IA travaille sur votre article...",
    });
    
    // Simulate AI generation for now
    setTimeout(async () => {
      const content = `# ${config.subject}

## Introduction

${config.subject} est un sujet essentiel dans le monde du dropshipping moderne. Découvrez dans cet article les stratégies les plus efficaces pour réussir.

## Points clés à retenir

- **Analyse de marché** : Comprendre les tendances actuelles
- **Sélection de produits** : Choisir les bons produits au bon moment  
- **Optimisation** : Maximiser les conversions et la rentabilité

## Stratégies recommandées

### 1. Recherche approfondie
Utilisez des outils d'analyse pour identifier les opportunités de marché.

### 2. Test et validation
Testez vos hypothèses avant de vous lancer à grande échelle.

### 3. Optimisation continue
Surveillez les performances et ajustez votre stratégie en conséquence.

## Conclusion

En suivant ces conseils et en restant à l'écoute des tendances, vous pourrez développer une activité rentable et durable dans le dropshipping.`;

      const newPost = {
        title: `${config.subject} - Guide Complet 2024`,
        content,
        excerpt: `Découvrez tout ce qu'il faut savoir sur ${config.subject.toLowerCase()} dans ce guide complet basé sur l'analyse de données IA.`,
        status: config.autoPublish ? 'published' as const : 'draft' as const,
        category: config.category,
        publish_date: new Date().toISOString(),
        views: 0,
        ai_generated: true,
        tags: config.keywords.split(',').map(k => k.trim()).filter(Boolean),
        seo_title: `${config.subject} - Guide 2024 | Expert Dropshipping`,
        seo_description: `Guide complet sur ${config.subject}. Stratégies, conseils d'experts et analyses IA pour maximiser vos résultats.`,
        image_url: ''
      };
      
      await createPostMutation.mutateAsync(newPost);
      setGenerating(false);
      
      toast({
        title: "Article généré !",
        description: "Votre article est prêt à être publié",
      });
    }, 4000);
  };

  const editPost = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    toast({
      title: "Édition",
      description: `Ouverture de l'éditeur pour "${post?.title}"`,
    });
  };

  const previewPost = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    toast({
      title: "Aperçu",
      description: `Génération de l'aperçu pour "${post?.title}"`,
    });
  };

  const publishPost = async (postId: string) => {
    await updatePostMutation.mutateAsync({
      id: postId,
      status: 'published',
      publish_date: new Date().toISOString()
    });
  };

  const deletePost = async (postId: string) => {
    await deletePostMutation.mutateAsync(postId);
  };

  const stats = {
    published: posts.filter(p => p.status === 'published').length,
    drafts: posts.filter(p => p.status === 'draft').length,
    scheduled: posts.filter(p => p.status === 'scheduled').length,
    totalViews: posts.reduce((sum, post) => sum + post.views, 0),
    aiGenerated: posts.filter(p => p.ai_generated).length
  };

  return {
    posts,
    stats,
    loading,
    generating,
    generatePost,
    editPost,
    previewPost,
    publishPost,
    deletePost,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['blog-posts'] })
  };
};