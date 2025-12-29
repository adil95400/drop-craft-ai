import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AIImage {
  id: string;
  user_id: string;
  prompt: string;
  image_url: string | null;
  image_base64: string | null;
  width: number;
  height: number;
  model: string;
  style: string | null;
  category: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface GenerateImageParams {
  prompt: string;
  width?: number;
  height?: number;
  style?: string;
  category?: string;
}

export function useMarketingAIImages() {
  const [images, setImages] = useState<AIImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const { toast } = useToast();

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchImages = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('marketing_ai_images')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImages((data || []) as AIImage[]);
    } catch (error) {
      console.error('Error fetching AI images:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchImages();
    }
  }, [user, fetchImages]);

  const generateImage = async (params: GenerateImageParams): Promise<AIImage | null> => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour générer des images",
        variant: "destructive"
      });
      return null;
    }

    setIsGenerating(true);
    try {
      const { data: funcData, error: funcError } = await supabase.functions.invoke('generate-marketing-image', {
        body: {
          prompt: params.prompt,
          width: params.width || 1024,
          height: params.height || 1024,
          style: params.style || 'marketing'
        }
      });

      if (funcError) throw funcError;

      if (!funcData?.image) {
        throw new Error("Aucune image générée");
      }

      // Save to database
      const { data: savedImage, error: saveError } = await supabase
        .from('marketing_ai_images')
        .insert({
          user_id: user.id,
          prompt: params.prompt,
          image_base64: funcData.image,
          width: params.width || 1024,
          height: params.height || 1024,
          model: 'google/gemini-2.5-flash-image-preview',
          style: params.style || null,
          category: params.category || 'general',
          metadata: { generation_time: funcData.generation_time }
        })
        .select()
        .single();

      if (saveError) throw saveError;

      const newImage = savedImage as AIImage;
      setImages(prev => [newImage, ...prev]);

      toast({
        title: "Image générée",
        description: "Votre image a été créée avec succès"
      });

      return newImage;
    } catch (error: any) {
      console.error('Error generating image:', error);
      toast({
        title: "Erreur de génération",
        description: error.message || "Impossible de générer l'image",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteImage = async (imageId: string) => {
    try {
      const { error } = await supabase
        .from('marketing_ai_images')
        .delete()
        .eq('id', imageId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setImages(prev => prev.filter(img => img.id !== imageId));
      toast({
        title: "Image supprimée",
        description: "L'image a été supprimée de votre bibliothèque"
      });
    } catch (error: any) {
      console.error('Error deleting image:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer l'image",
        variant: "destructive"
      });
    }
  };

  return {
    images,
    isLoading,
    isGenerating,
    generateImage,
    deleteImage,
    refetch: fetchImages
  };
}
