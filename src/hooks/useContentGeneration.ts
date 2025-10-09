import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { removeBackground, loadImage } from '@/utils/backgroundRemoval';

export interface VideoGenerationParams {
  productData: {
    name: string;
    description: string;
    price: string;
  };
  videoStyle?: string;
  duration?: number;
}

export interface SocialPostParams {
  productData: {
    name: string;
    description: string;
    price: string;
  };
  platforms: string[];
  tone?: string;
  includeHashtags?: boolean;
  generateImages?: boolean;
}

export interface ImageEnhancementParams {
  imageUrl: string;
  enhancementType: 'quality' | 'background' | 'lighting' | 'style' | 'upscale';
  productContext?: string;
}

export function useContentGeneration() {
  const { toast } = useToast();

  // Generate TikTok-style videos
  const generateVideo = useMutation({
    mutationFn: async (params: VideoGenerationParams) => {
      const { data, error } = await supabase.functions.invoke('ai-video-generator', {
        body: params,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Video generated successfully!' });
    },
    onError: (error: any) => {
      toast({
        title: 'Video generation failed',
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  // Generate social media posts
  const generateSocialPosts = useMutation({
    mutationFn: async (params: SocialPostParams) => {
      const { data, error } = await supabase.functions.invoke('ai-social-posts', {
        body: params,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({ title: `${data.generatedCount} posts generated successfully!` });
    },
    onError: (error: any) => {
      toast({
        title: 'Post generation failed',
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  // Enhance product images
  const enhanceImage = useMutation({
    mutationFn: async (params: ImageEnhancementParams) => {
      const { data, error } = await supabase.functions.invoke('ai-image-enhancer', {
        body: params,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Image enhanced successfully!' });
    },
    onError: (error: any) => {
      toast({
        title: 'Image enhancement failed',
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  // Remove background (client-side with Hugging Face Transformers)
  const removeImageBackground = useMutation({
    mutationFn: async ({ 
      file, 
      onProgress 
    }: { 
      file: File; 
      onProgress?: (progress: number) => void 
    }) => {
      const imageElement = await loadImage(file);
      const blob = await removeBackground(imageElement, onProgress);
      return blob;
    },
    onSuccess: () => {
      toast({ title: 'Background removed successfully!' });
    },
    onError: (error: any) => {
      toast({
        title: 'Background removal failed',
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  return {
    // Video generation
    generateVideo: generateVideo.mutate,
    generateVideoAsync: generateVideo.mutateAsync,
    isGeneratingVideo: generateVideo.isPending,
    videoData: generateVideo.data,

    // Social posts
    generateSocialPosts: generateSocialPosts.mutate,
    generateSocialPostsAsync: generateSocialPosts.mutateAsync,
    isGeneratingSocialPosts: generateSocialPosts.isPending,
    socialPostsData: generateSocialPosts.data,

    // Image enhancement
    enhanceImage: enhanceImage.mutate,
    enhanceImageAsync: enhanceImage.mutateAsync,
    isEnhancingImage: enhanceImage.isPending,
    enhancedImageData: enhanceImage.data,

    // Background removal
    removeImageBackground: removeImageBackground.mutate,
    removeImageBackgroundAsync: removeImageBackground.mutateAsync,
    isRemovingBackground: removeImageBackground.isPending,
    removedBackgroundBlob: removeImageBackground.data,
  };
}
