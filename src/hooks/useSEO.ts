import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface SEOAnalysis {
  url: string;
  score: number;
  metrics: {
    performance: number;
    accessibility: number;
    best_practices: number;
    seo: number;
  };
  issues: SEOIssue[];
  suggestions: string[];
  keywords: string[];
  meta_data: {
    title?: string;
    description?: string;
    h1?: string;
    images_without_alt: number;
    internal_links: number;
    external_links: number;
  };
  created_at: string;
}

export interface SEOIssue {
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  impact: 'high' | 'medium' | 'low';
  how_to_fix: string;
}

export interface GeneratedContent {
  title: string;
  meta_description: string;
  h1: string;
  content?: string;
  keywords: string[];
  schema?: Record<string, any>;
  slug?: string;
}

export interface SEOTask {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  impact: 'high' | 'medium' | 'low';
  estimated_time: number; // in minutes
  created_at: string;
}

export const useSEO = () => {
  const [analyses, setAnalyses] = useState<SEOAnalysis[]>([]);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [tasks, setTasks] = useState<SEOTask[]>([
    {
      id: '1',
      title: 'Optimiser les titres H1-H6',
      description: 'Améliorer la structure hiérarchique des titres',
      priority: 'high',
      status: 'completed',
      impact: 'high',
      estimated_time: 30,
      created_at: '2024-01-15'
    },
    {
      id: '2',
      title: 'Ajouter des balises meta description',
      description: 'Créer des meta descriptions optimisées',
      priority: 'high',
      status: 'completed',
      impact: 'high',
      estimated_time: 45,
      created_at: '2024-01-14'
    },
    {
      id: '3',
      title: 'Optimiser les images (alt, compression)',
      description: 'Ajouter les attributs alt et compresser les images',
      priority: 'medium',
      status: 'in_progress',
      impact: 'medium',
      estimated_time: 60,
      created_at: '2024-01-13'
    },
    {
      id: '4',
      title: 'Améliorer le maillage interne',
      description: 'Créer des liens internes stratégiques',
      priority: 'medium',
      status: 'pending',
      impact: 'medium',
      estimated_time: 90,
      created_at: '2024-01-12'
    },
    {
      id: '5',
      title: 'Ajouter Schema.org markup',
      description: 'Implémenter les données structurées',
      priority: 'high',
      status: 'pending',
      impact: 'high',
      estimated_time: 120,
      created_at: '2024-01-11'
    }
  ]);

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const analyzeURL = async (url: string): Promise<SEOAnalysis> => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const analysis: SEOAnalysis = {
        url,
        score: Math.floor(Math.random() * 30) + 70, // 70-100
        metrics: {
          performance: Math.floor(Math.random() * 20) + 80,
          accessibility: Math.floor(Math.random() * 25) + 75,
          best_practices: Math.floor(Math.random() * 20) + 80,
          seo: Math.floor(Math.random() * 30) + 70
        },
        issues: [
          {
            type: 'warning',
            category: 'Images',
            message: '3 images sans attribut alt',
            impact: 'medium',
            how_to_fix: 'Ajouter des attributs alt descriptifs à toutes les images'
          },
          {
            type: 'error',
            category: 'Performance',
            message: 'Images non optimisées',
            impact: 'high',
            how_to_fix: 'Compresser les images et utiliser des formats modernes'
          }
        ],
        suggestions: [
          'Ajouter des images alt descriptives',
          'Optimiser la vitesse de chargement',
          'Améliorer le maillage interne',
          'Ajouter des avis clients structurés'
        ],
        keywords: ['mot-clé principal', 'mot-clé secondaire', 'longue traîne'],
        meta_data: {
          title: 'Titre de la page analysée',
          description: 'Description meta de la page',
          h1: 'Titre H1 principal',
          images_without_alt: 3,
          internal_links: 12,
          external_links: 5
        },
        created_at: new Date().toISOString()
      };

      setAnalyses(prev => [analysis, ...prev]);
      
      toast({
        title: "Analyse terminée",
        description: `Score SEO: ${analysis.score}/100`,
      });

      return analysis;
    } catch (error) {
      toast({
        title: "Erreur d'analyse",
        description: "Impossible d'analyser cette URL",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const generateContent = async (keyword: string, contentType: 'product' | 'article' | 'category' = 'product'): Promise<GeneratedContent> => {
    setLoading(true);
    
    try {
      // Simulate AI content generation
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      const content: GeneratedContent = {
        title: `${keyword} - Guide Complet 2024 | Meilleurs Prix`,
        meta_description: `Tout savoir sur ${keyword}. Comparatif, prix, avis clients. Guide d'achat complet avec livraison gratuite. ⭐ Note 4.8/5`,
        h1: `${keyword} - Guide Complet 2024`,
        keywords: [keyword, `acheter ${keyword}`, `${keyword} pas cher`, `meilleur ${keyword}`],
        slug: keyword.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        content: contentType === 'article' ? `
# ${keyword} - Guide Complet 2024

## Qu'est-ce qu'un ${keyword} ?

Le ${keyword} est un produit essentiel qui répond à de nombreux besoins...

## Pourquoi choisir un ${keyword} ?

### Avantages principaux :
- **Qualité premium** : Matériaux de haute qualité
- **Prix compétitif** : Meilleur rapport qualité-prix
- **Livraison rapide** : Expédition sous 24h

## Comment choisir le bon ${keyword} ?

1. **Budget** : Définissez votre fourchette de prix
2. **Utilisation** : Identifiez vos besoins spécifiques  
3. **Marque** : Optez pour des marques reconnues

## FAQ ${keyword}

**Q: Quelle est la garantie ?**
R: Tous nos ${keyword} sont garantis 2 ans.
        ` : undefined,
        schema: contentType === 'product' ? {
          "@context": "https://schema.org/",
          "@type": "Product",
          "name": `${keyword}`,
          "brand": "ShopName",
          "offers": {
            "@type": "Offer",
            "price": "24.99",
            "priceCurrency": "EUR",
            "availability": "https://schema.org/InStock"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "reviewCount": "127"
          }
        } : undefined
      };

      setGeneratedContent(content);
      
      toast({
        title: "Contenu généré",
        description: "Votre contenu SEO optimisé est prêt",
      });

      return content;
    } catch (error) {
      toast({
        title: "Erreur de génération",
        description: "Impossible de générer le contenu",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, status: SEOTask['status']) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === taskId 
          ? { ...task, status }
          : task
      )
    );

    toast({
      title: "Tâche mise à jour",
      description: `Statut changé vers: ${status}`,
    });
  };

  const createTask = async (taskData: Omit<SEOTask, 'id' | 'created_at'>) => {
    const newTask: SEOTask = {
      ...taskData,
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };

    setTasks(prev => [newTask, ...prev]);
    
    toast({
      title: "Tâche créée",
      description: "Nouvelle tâche SEO ajoutée",
    });

    return newTask;
  };

  const exportAnalysis = (analysis: SEOAnalysis) => {
    const reportData = {
      url: analysis.url,
      score: analysis.score,
      date: analysis.created_at,
      metrics: analysis.metrics,
      issues: analysis.issues,
      suggestions: analysis.suggestions
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seo-analysis-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export terminé",
      description: "Le rapport SEO a été téléchargé",
    });
  };

  const getStats = () => {
    const totalAnalyses = analyses.length;
    const avgScore = analyses.length > 0 
      ? analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length 
      : 0;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const totalTasks = tasks.length;
    const highPriorityTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length;

    return {
      totalAnalyses,
      avgScore: Math.round(avgScore * 10) / 10,
      completedTasks,
      totalTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      highPriorityTasks
    };
  };

  const generateSitemap = async (urls: string[]) => {
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `
  <url>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
</urlset>`;

    const blob = new Blob([sitemap], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap.xml';
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Sitemap généré",
      description: "Votre sitemap XML a été téléchargé",
    });
  };

  return {
    analyses,
    generatedContent,
    tasks,
    loading,
    stats: getStats(),
    analyzeURL,
    generateContent,
    updateTaskStatus,
    createTask,
    exportAnalysis,
    generateSitemap,
    clearGeneratedContent: () => setGeneratedContent(null)
  };
};