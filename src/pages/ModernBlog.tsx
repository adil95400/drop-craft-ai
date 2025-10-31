import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SEO } from '@/components/SEO';
import { BlogCard } from '@/components/blog/BlogCard';
import { BlogFilters } from '@/components/blog/BlogFilters';
import { BlogNewsletter } from '@/components/blog/BlogNewsletter';
import { BlogStats } from '@/components/blog/BlogStats';
import { RecommendedPosts } from '@/components/blog/RecommendedPosts';
import { 
  Sparkles, 
  TrendingUp, 
  Clock, 
  Users,
  Crown,
  ArrowRight,
  Brain,
  Zap,
  Target,
  BookOpen,
  ChevronRight
} from 'lucide-react';
import { PublicLayout } from '@/layouts/PublicLayout';

// Mock data - Inspiré des concurrents comme Oberlo, Dropshipping.fr, etc.
const mockPosts = [
  {
    id: '1',
    title: 'Comment l\'IA révolutionne le Dropshipping en 2024 : Guide Complet',
    excerpt: 'Découvrez les outils d\'intelligence artificielle qui transforment le dropshipping : sélection de produits automatisée, optimisation des prix en temps réel, et génération de contenu marketing. Plus de 47 outils testés et comparés.',
    content: '',
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&h=400&fit=crop',
    author: {
      name: 'Adil Charkaoui',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      role: 'Expert E-commerce & IA'
    },
    publishedAt: '2024-01-15',
    readTime: '12 min',
    category: 'Intelligence Artificielle',
    tags: ['IA', 'Dropshipping', 'Automation', 'Outils', 'Stratégie'],
    views: 15420,
    likes: 892,
    featured: true,
    trending: true
  },
  {
    id: '2',
    title: '50 Produits Gagnants pour Dropshipping Q1 2024 - Analyse Approfondie',
    excerpt: 'Notre équipe d\'analystes a passé au crible plus de 10,000 produits pour identifier les 50 plus prometteurs pour ce trimestre. Données de vente, marges, concurrence et potentiel de scaling inclus.',
    content: '',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop',
    author: {
      name: 'Sarah Martinez',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
      role: 'Analyste Produits'
    },
    publishedAt: '2024-01-12',
    readTime: '18 min',
    category: 'Sélection Produits',
    tags: ['Produits Gagnants', 'Analyse', 'Q1 2024', 'Trends', 'Data'],
    views: 23150,
    likes: 1247,
    featured: true,
    trending: true
  },
  {
    id: '3',
    title: 'Facebook Ads vs Google Ads en 2024 : Quelle Plateforme Choisir ?',
    excerpt: 'Comparaison détaillée des deux géants de la publicité digitale. ROI moyen par industrie, coûts d\'acquisition, audiences, et stratégies optimales selon votre niche et budget.',
    content: '',
    image: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=600&h=400&fit=crop',
    author: {
      name: 'Thomas Dubois',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      role: 'Expert Media Buying'
    },
    publishedAt: '2024-01-10',
    readTime: '15 min',
    category: 'Marketing Digital',
    tags: ['Facebook Ads', 'Google Ads', 'ROI', 'Publicité', 'Comparaison'],
    views: 18930,
    likes: 756,
    featured: false,
    trending: true
  },
  {
    id: '4',
    title: 'Shopify vs WooCommerce vs BigCommerce : Comparatif Complet 2024',
    excerpt: 'Analyse technique et financière des 3 solutions e-commerce leaders. Coûts cachés, fonctionnalités, évolutivité, et cas d\'usage selon la taille de votre business.',
    content: '',
    image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600&h=400&fit=crop',
    author: {
      name: 'Marie Lecomte',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face',
      role: 'Tech Lead E-commerce'
    },
    publishedAt: '2024-01-08',
    readTime: '22 min',
    category: 'Plateformes E-commerce',
    tags: ['Shopify', 'WooCommerce', 'BigCommerce', 'Comparaison', 'Technical'],
    views: 12640,
    likes: 489,
    featured: false,
    trending: false
  },
  {
    id: '5',
    title: 'Automatisation Complete de votre Store Dropshipping avec Zapier',
    excerpt: 'Guide step-by-step pour automatiser 95% des tâches répétitives : gestion commandes, support client, inventory tracking, email marketing, et reporting. 15 workflows prêts à utiliser.',
    content: '',
    image: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=600&h=400&fit=crop',
    author: {
      name: 'Lucas Bernard',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
      role: 'Automation Specialist'
    },
    publishedAt: '2024-01-05',
    readTime: '25 min',
    category: 'Automation',
    tags: ['Zapier', 'Automation', 'Workflow', 'Efficiency', 'Tools'],
    views: 9870,
    likes: 634,
    featured: false,
    trending: false
  },
  {
    id: '6',
    title: 'TikTok Shopping : Comment Vendre 6 Figures via les Réels (Case Study)',
    excerpt: 'Case study détaillée d\'un store qui a généré $847,000 en 8 mois uniquement via TikTok Shop. Stratégie contenu, partenariats influenceurs, et optimisation conversion.',
    content: '',
    image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&h=400&fit=crop',
    author: {
      name: 'Emma Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
      role: 'Social Commerce Expert'
    },
    publishedAt: '2024-01-03',
    readTime: '16 min',
    category: 'Social Commerce',
    tags: ['TikTok', 'Social Commerce', 'Case Study', 'Influencers', 'Revenue'],
    views: 21450,
    likes: 1158,
    featured: false,
    trending: true
  }
];

const categories = ['Toutes', 'Intelligence Artificielle', 'Sélection Produits', 'Marketing Digital', 'Plateformes E-commerce', 'Automation', 'Social Commerce'];
const tags = ['IA', 'Dropshipping', 'Facebook Ads', 'Google Ads', 'Shopify', 'Automation', 'TikTok', 'ROI', 'Stratégie', 'Case Study'];

export default function ModernBlog() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [showTrendingOnly, setShowTrendingOnly] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Filter and sort posts
  const filteredPosts = useMemo(() => {
    let filtered = mockPosts.filter(post => {
      const matchesSearch = !searchTerm || 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.author.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
      const matchesTag = selectedTag === 'all' || post.tags.includes(selectedTag);
      const matchesTrending = !showTrendingOnly || post.trending;
      const matchesTab = activeTab === 'all' || 
        (activeTab === 'featured' && post.featured) ||
        (activeTab === 'trending' && post.trending);

      return matchesSearch && matchesCategory && matchesTag && matchesTrending && matchesTab;
    });

    // Sort posts
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'views':
          return b.views - a.views;
        case 'likes':
          return b.likes - a.likes;
        case 'trending':
          return (b.trending ? 1 : 0) - (a.trending ? 1 : 0);
        case 'date':
        default:
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      }
    });

    return filtered;
  }, [searchTerm, selectedCategory, selectedTag, sortBy, showTrendingOnly, activeTab]);

  const featuredPost = mockPosts.find(post => post.featured) || mockPosts[0];
  const trendingPosts = mockPosts.filter(post => post.trending).slice(0, 4).map(post => ({
    ...post,
    reason: 'trending' as const
  }));

  return (
    <>
      <SEO
        title="Blog E-commerce Pro | Stratégies Dropshipping, IA & Marketing Digital"
        description="Découvrez les stratégies gagnantes du dropshipping, les outils IA révolutionnaires et les techniques marketing qui font la différence. +50 guides experts."
        path="/blog"
        keywords="blog dropshipping, guides e-commerce, IA marketing, stratégies dropshipping, outils automation, facebook ads, shopify"
      />

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative py-20 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/5" />
          
          <div className="relative max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-6 px-6 py-2 text-sm">
                <BookOpen className="w-4 h-4 mr-2" />
                Blog Expert E-commerce
              </Badge>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
                Stratégies & <span className="text-primary">Insights</span>
                <br />
                <span className="text-3xl md:text-4xl lg:text-5xl">qui font la différence</span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                Découvrez les stratégies secrètes des top dropshippers, les outils IA révolutionnaires 
                et les techniques marketing qui génèrent des millions. Mis à jour quotidiennement.
              </p>

              {/* Quick Stats */}
              <div className="flex flex-wrap justify-center gap-8 mb-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">150+</div>
                  <div className="text-sm text-muted-foreground">Guides experts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">25K+</div>
                  <div className="text-sm text-muted-foreground">Lecteurs actifs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">$2M+</div>
                  <div className="text-sm text-muted-foreground">Revenus générés</div>
                </div>
              </div>
            </div>

            {/* Featured Article */}
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <Crown className="w-5 h-5 text-primary" />
                <h2 className="text-2xl font-bold">Article à la Une</h2>
              </div>
              <BlogCard post={featuredPost} variant="featured" />
            </div>
          </div>
        </section>

        {/* Blog Stats */}
        <section className="py-16 px-6 bg-muted/30">
          <div className="max-w-7xl mx-auto">
            <BlogStats
              totalViews={847650}
              totalLikes={34280}
              totalShares={12450}
              totalComments={8940}
              totalSubscribers={25340}
              articlesCount={156}
              monthlyGrowth={34}
            />
          </div>
        </section>

        {/* Main Content */}
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-3 space-y-8">
                {/* Content Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all" className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Tous
                    </TabsTrigger>
                    <TabsTrigger value="featured" className="flex items-center gap-2">
                      <Crown className="w-4 h-4" />
                      À la Une
                    </TabsTrigger>
                    <TabsTrigger value="trending" className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Trending
                    </TabsTrigger>
                    <TabsTrigger value="recent" className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Récents
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value={activeTab} className="mt-8">
                    {/* Filters */}
                    <BlogFilters
                      searchTerm={searchTerm}
                      onSearchChange={setSearchTerm}
                      selectedCategory={selectedCategory}
                      onCategoryChange={setSelectedCategory}
                      selectedTag={selectedTag}
                      onTagChange={setSelectedTag}
                      sortBy={sortBy}
                      onSortChange={setSortBy}
                      showTrendingOnly={showTrendingOnly}
                      onTrendingToggle={() => setShowTrendingOnly(!showTrendingOnly)}
                      categories={categories.slice(1)} // Exclude 'Toutes'
                      tags={tags}
                    />

                    {/* Articles Grid */}
                    <div className="mt-8">
                      {filteredPosts.length > 0 ? (
                        <>
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold">
                              {filteredPosts.length} article{filteredPosts.length > 1 ? 's' : ''} trouvé{filteredPosts.length > 1 ? 's' : ''}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Users className="w-4 h-4" />
                              <span>Par nos experts certifiés</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                            {filteredPosts.map((post) => (
                              <BlogCard 
                                key={post.id} 
                                post={post} 
                                onClick={() => navigate(`/blog/${post.id}`)}
                              />
                            ))}
                          </div>

                          {/* Load More */}
                          <div className="text-center">
                            <Button variant="outline" size="lg">
                              Charger plus d'articles
                              <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-12">
                          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <Target className="w-12 h-12 text-muted-foreground" />
                          </div>
                          <h3 className="text-xl font-semibold mb-2">Aucun article trouvé</h3>
                          <p className="text-muted-foreground mb-4">
                            Essayez d'ajuster vos filtres ou votre recherche
                          </p>
                          <Button variant="outline" onClick={() => {
                            setSearchTerm('');
                            setSelectedCategory('all');
                            setSelectedTag('all');
                            setShowTrendingOnly(false);
                          }}>
                            Réinitialiser les filtres
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Sidebar */}
              <div className="space-y-8">
                {/* Newsletter */}
                <BlogNewsletter />

                {/* Recommended Posts */}
                <RecommendedPosts 
                  posts={trendingPosts}
                  title="Tendances du moment"
                  variant="sidebar"
                />

                {/* Categories */}
                <div className="bg-card rounded-lg border p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Catégories
                  </h3>
                  <div className="space-y-2">
                    {categories.slice(1).map((category) => {
                      const count = mockPosts.filter(post => post.category === category).length;
                      return (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className={`flex items-center justify-between w-full text-left p-2 rounded-lg transition-colors ${
                            selectedCategory === category 
                              ? 'bg-primary text-primary-foreground' 
                              : 'hover:bg-muted'
                          }`}
                        >
                          <span className="text-sm">{category}</span>
                          <Badge variant="outline" className="text-xs">
                            {count}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tags Cloud */}
                <div className="bg-card rounded-lg border p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Tags Populaires
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge 
                        key={tag}
                        variant={selectedTag === tag ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => setSelectedTag(selectedTag === tag ? 'all' : tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6 bg-gradient-to-r from-primary/10 via-background to-secondary/10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Zap className="w-10 h-10 text-primary" />
            </div>
            
            <h2 className="text-4xl font-bold mb-6">
              Prêt à <span className="text-primary">dominer</span> votre marché ?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Rejoignez +25,000 entrepreneurs qui utilisent nos stratégies pour générer 
              des revenus à 6 et 7 chiffres.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" className="text-lg px-8 py-6 h-auto">
                <Brain className="mr-2 h-5 w-5" />
                Accéder aux Outils Pro
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto">
                <BookOpen className="mr-2 h-5 w-5" />
                Guide Gratuit
              </Button>
            </div>

            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>25K+ utilisateurs</span>
              </div>
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4" />
                <span>Garantie 30 jours</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Support 24/7</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}

export default ModernBlog