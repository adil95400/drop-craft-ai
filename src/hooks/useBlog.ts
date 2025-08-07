import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'

export interface BlogPost {
  id: string
  title: string
  excerpt: string
  content?: string
  status: 'published' | 'draft' | 'scheduled'
  category: string
  views: number
  publishDate: string
  aiGenerated: boolean
  keywords: string[]
  seoScore?: number
}

export interface BlogConfig {
  subject: string
  category: string
  keywords: string
  length: 'short' | 'medium' | 'long'
  tone: 'professional' | 'casual' | 'expert' | 'beginner'
  instructions: string
  includeImages: boolean
  autoPublish: boolean
}

export const useBlog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([
    {
      id: "1",
      title: "10 Produits Tendance à Dropshipper en 2024",
      excerpt: "Découvrez les produits les plus rentables identifiés par notre IA...",
      status: "published",
      category: "Tendances",
      views: 1250,
      publishDate: "2024-01-15",
      aiGenerated: true,
      keywords: ["dropshipping", "tendances", "2024"],
      seoScore: 92
    },
    {
      id: "2", 
      title: "Comment Optimiser ses Conversions avec l'IA",
      excerpt: "Guide complet pour utiliser l'intelligence artificielle...",
      status: "draft",
      category: "Marketing",
      views: 0,
      publishDate: "2024-01-20",
      aiGenerated: true,
      keywords: ["conversions", "IA", "optimisation"],
      seoScore: 87
    },
    {
      id: "3",
      title: "Analyse des Tendances E-commerce Q1 2024",
      excerpt: "Rapport détaillé des performances du secteur...",
      status: "scheduled",
      category: "Analyses",
      views: 0,
      publishDate: "2024-01-25",
      aiGenerated: false,
      keywords: ["ecommerce", "tendances", "analyse"],
      seoScore: 79
    }
  ])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const { toast } = useToast()

  const generatePost = async (config: BlogConfig) => {
    setGenerating(true)
    
    toast({
      title: "Génération IA",
      description: "L'IA travaille sur votre article...",
    })
    
    // Simulate AI generation
    setTimeout(() => {
      const newPost: BlogPost = {
        id: Math.random().toString(36).substr(2, 9),
        title: `${config.subject} - Guide Complet 2024`,
        excerpt: `Découvrez tout ce qu'il faut savoir sur ${config.subject.toLowerCase()}...`,
        status: config.autoPublish ? "published" : "draft",
        category: config.category,
        views: 0,
        publishDate: new Date().toISOString(),
        aiGenerated: true,
        keywords: config.keywords.split(',').map(k => k.trim()),
        seoScore: Math.floor(Math.random() * 20) + 80,
        content: `# ${config.subject}

## Introduction

${config.subject} est un sujet essentiel dans le monde du dropshipping moderne...

## Points clés

- Point important 1
- Point important 2  
- Point important 3

## Conclusion

En suivant ces conseils, vous pourrez optimiser vos performances...`
      }
      
      setPosts(prev => [newPost, ...prev])
      setGenerating(false)
      
      toast({
        title: "Article généré !",
        description: "Votre article est prêt à être publié",
      })
    }, 4000)
  }

  const editPost = (postId: string) => {
    const post = posts.find(p => p.id === postId)
    toast({
      title: "Édition",
      description: `Ouverture de l'éditeur pour "${post?.title}"`,
    })
  }

  const previewPost = (postId: string) => {
    const post = posts.find(p => p.id === postId)
    toast({
      title: "Aperçu",
      description: `Génération de l'aperçu pour "${post?.title}"`,
    })
  }

  const publishPost = (postId: string) => {
    setPosts(prev => 
      prev.map(post => 
        post.id === postId 
          ? { ...post, status: "published" as const, publishDate: new Date().toISOString() }
          : post
      )
    )
    
    toast({
      title: "Article publié",
      description: "L'article est maintenant en ligne",
    })
  }

  const deletePost = (postId: string) => {
    setPosts(prev => prev.filter(post => post.id !== postId))
    toast({
      title: "Article supprimé",
      description: "L'article a été supprimé définitivement",
    })
  }

  const stats = {
    published: posts.filter(p => p.status === 'published').length,
    drafts: posts.filter(p => p.status === 'draft').length,
    scheduled: posts.filter(p => p.status === 'scheduled').length,
    totalViews: posts.reduce((sum, post) => sum + post.views, 0),
    aiGenerated: posts.filter(p => p.aiGenerated).length
  }

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
    refetch: () => {}
  }
}