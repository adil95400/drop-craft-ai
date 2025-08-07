import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  source: 'aliexpress' | 'amazon' | 'google' | 'shopify' | 'manual';
  product: string;
  verified: boolean;
  helpful: number;
  status: 'approved' | 'pending' | 'rejected';
  images?: string[];
}

export interface ReviewStats {
  total: number;
  average: number;
  pending: number;
  verified_percentage: number;
  distribution: { stars: number; count: number; percentage: number }[];
}

export const useReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([
    {
      id: '1',
      author: 'Marie L.',
      rating: 5,
      date: '2024-01-15',
      text: 'Produit excellent, livraison rapide. Je recommande vivement !',
      source: 'aliexpress',
      product: 'Smartphone Case',
      verified: true,
      helpful: 12,
      status: 'approved'
    },
    {
      id: '2',
      author: 'Thomas B.',
      rating: 4,
      date: '2024-01-14',
      text: 'Bonne qualité mais la couleur est légèrement différente de la photo.',
      source: 'amazon',
      product: 'Bluetooth Headphones',
      verified: true,
      helpful: 8,
      status: 'pending'
    },
    {
      id: '3',
      author: 'Sophie M.',
      rating: 5,
      date: '2024-01-13',
      text: 'Parfait ! Correspond exactement à mes attentes. Service client au top.',
      source: 'google',
      product: 'Yoga Mat',
      verified: false,
      helpful: 15,
      status: 'approved'
    }
  ]);

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getStats = (): ReviewStats => {
    const total = reviews.length;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const average = total > 0 ? totalRating / total : 0;
    const pending = reviews.filter(r => r.status === 'pending').length;
    const verified = reviews.filter(r => r.verified).length;
    const verified_percentage = total > 0 ? Math.round((verified / total) * 100) : 0;

    const distribution = [5, 4, 3, 2, 1].map(stars => {
      const count = reviews.filter(r => r.rating === stars).length;
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
      return { stars, count, percentage };
    });

    return {
      total,
      average: Math.round(average * 10) / 10,
      pending,
      verified_percentage,
      distribution
    };
  };

  const importReviews = async (source: string, productUrl: string, count: number = 50) => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockReviews: Review[] = [];
      for (let i = 0; i < Math.min(count, 20); i++) {
        mockReviews.push({
          id: Math.random().toString(36).substr(2, 9),
          author: `User ${i + 1}`,
          rating: Math.floor(Math.random() * 5) + 1,
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          text: `Avis importé depuis ${source}. Excellent produit !`,
          source: source as Review['source'],
          product: 'Produit importé',
          verified: Math.random() > 0.3,
          helpful: Math.floor(Math.random() * 20),
          status: 'pending'
        });
      }

      setReviews(prev => [...mockReviews, ...prev]);
      
      toast({
        title: "Import terminé",
        description: `${mockReviews.length} avis importés depuis ${source}`,
      });

      return mockReviews;
    } catch (error) {
      toast({
        title: "Erreur d'import",
        description: "Impossible d'importer les avis",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const approveReview = async (reviewId: string) => {
    setReviews(prev => 
      prev.map(review => 
        review.id === reviewId 
          ? { ...review, status: 'approved' as const }
          : review
      )
    );

    toast({
      title: "Avis approuvé",
      description: "L'avis a été approuvé et publié",
    });
  };

  const rejectReview = async (reviewId: string) => {
    setReviews(prev => 
      prev.map(review => 
        review.id === reviewId 
          ? { ...review, status: 'rejected' as const }
          : review
      )
    );

    toast({
      title: "Avis rejeté",
      description: "L'avis a été rejeté",
    });
  };

  const updateReview = async (reviewId: string, updates: Partial<Review>) => {
    setReviews(prev => 
      prev.map(review => 
        review.id === reviewId 
          ? { ...review, ...updates }
          : review
      )
    );

    toast({
      title: "Avis modifié",
      description: "L'avis a été mis à jour",
    });
  };

  const deleteReview = async (reviewId: string) => {
    setReviews(prev => prev.filter(review => review.id !== reviewId));
    
    toast({
      title: "Avis supprimé",
      description: "L'avis a été supprimé définitivement",
    });
  };

  const filterReviews = (filters: {
    source?: string;
    rating?: number;
    status?: string;
    search?: string;
  }) => {
    return reviews.filter(review => {
      if (filters.source && filters.source !== 'all' && review.source !== filters.source) {
        return false;
      }
      if (filters.rating && review.rating !== filters.rating) {
        return false;
      }
      if (filters.status && filters.status !== 'all' && review.status !== filters.status) {
        return false;
      }
      if (filters.search && !review.text.toLowerCase().includes(filters.search.toLowerCase()) && 
          !review.author.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      return true;
    });
  };

  const bulkApprove = async (reviewIds: string[]) => {
    setReviews(prev => 
      prev.map(review => 
        reviewIds.includes(review.id) 
          ? { ...review, status: 'approved' as const }
          : review
      )
    );

    toast({
      title: "Avis approuvés en masse",
      description: `${reviewIds.length} avis ont été approuvés`,
    });
  };

  const generateWidget = (config: {
    showStars: boolean;
    showCount: boolean;
    maxReviews: number;
    theme: 'light' | 'dark';
  }) => {
    const approvedReviews = reviews.filter(r => r.status === 'approved');
    const stats = getStats();
    
    return {
      html: `<div class="shopopti-reviews-widget ${config.theme}">...</div>`,
      css: `.shopopti-reviews-widget { ... }`,
      script: `// Widget script here`
    };
  };

  return {
    reviews,
    loading,
    stats: getStats(),
    importReviews,
    approveReview,
    rejectReview,
    updateReview,
    deleteReview,
    filterReviews,
    bulkApprove,
    generateWidget
  };
};