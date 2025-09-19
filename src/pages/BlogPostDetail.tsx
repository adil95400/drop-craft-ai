import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Clock, 
  Eye, 
  Heart, 
  Share2, 
  BookmarkPlus,
  MessageCircle,
  ChevronLeft,
  Twitter,
  Facebook,
  Linkedin,
  Copy,
  Check
} from 'lucide-react';
import { RecommendedPosts } from '@/components/blog/RecommendedPosts';
import { BlogNewsletter } from '@/components/blog/BlogNewsletter';
import { BlogPostActions } from '@/components/blog/BlogPostActions';

// Mock data for blog post
const mockPost = {
  id: '1',
  title: 'Les 10 Meilleures Stratégies de Dropshipping pour 2024',
  content: `
    <h2>Introduction</h2>
    <p>Le dropshipping continue d'évoluer rapidement en 2024, avec de nouvelles opportunités et défis qui émergent constamment. Dans cet article complet, nous explorons les stratégies les plus efficaces pour réussir dans ce domaine compétitif.</p>
    
    <h2>1. Optimisation de la Recherche de Produits</h2>
    <p>La recherche de produits reste la fondation de tout business de dropshipping réussi. Utilisez des outils d'analyse avancés comme:</p>
    <ul>
      <li>Google Trends pour identifier les tendances émergentes</li>
      <li>Amazon Best Sellers pour valider la demande</li>
      <li>Facebook Audience Insights pour comprendre votre marché cible</li>
    </ul>
    
    <h2>2. Marketing sur les Réseaux Sociaux</h2>
    <p>Les réseaux sociaux sont devenus incontournables pour le dropshipping moderne. TikTok et Instagram Reels offrent des opportunités exceptionnelles pour la promotion de produits.</p>
    
    <blockquote>
      "Le contenu authentique et engageant sur les réseaux sociaux peut générer un ROI de 300% ou plus pour les dropshippers expérimentés."
    </blockquote>
    
    <h2>3. Optimisation des Conversions</h2>
    <p>L'optimisation de votre taux de conversion est cruciale. Voici les éléments clés à tester:</p>
    <ul>
      <li>Pages de produits optimisées avec des descriptions détaillées</li>
      <li>Processus de checkout simplifié</li>
      <li>Preuves sociales et témoignages clients</li>
      <li>Politique de retour claire et rassurante</li>
    </ul>
    
    <h2>Conclusion</h2>
    <p>Le succès en dropshipping en 2024 nécessite une approche holistique combinant recherche produit, marketing digital et optimisation continue. En appliquant ces stratégies, vous maximiserez vos chances de réussite dans ce secteur dynamique.</p>
  `,
  excerpt: 'Découvrez les stratégies les plus efficaces pour réussir en dropshipping en 2024, avec des conseils pratiques et des exemples concrets.',
  image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop',
  author: {
    name: 'Sophie Martin',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b044?w=150&h=150&fit=crop&crop=face',
    role: 'Expert E-commerce',
    bio: 'Sophie a plus de 8 ans d\'expérience dans le e-commerce et a aidé des centaines d\'entrepreneurs à lancer leur business de dropshipping.'
  },
  publishedAt: '2024-01-15',
  readTime: '12 min',
  category: 'Stratégies',
  tags: ['dropshipping', 'e-commerce', 'marketing', 'strategie', '2024'],
  views: 15420,
  likes: 342,
  comments: 89,
  featured: true,
  trending: true
};

export function BlogPostDetail() {
  const { id } = useParams();
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async (platform?: string) => {
    const url = window.location.href;
    const text = `${mockPost.title} - ${mockPost.excerpt}`;

    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'copy') {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else if (navigator.share) {
      await navigator.share({ title: mockPost.title, text: mockPost.excerpt, url });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Link to="/blog" className="inline-flex items-center text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Retour au blog
          </Link>
        </div>
      </div>

      {/* Article Content */}
      <article className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Article Header */}
        <header className="mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary">{mockPost.category}</Badge>
            {mockPost.trending && (
              <Badge variant="destructive">Tendance</Badge>
            )}
          </div>

          <h1 className="text-4xl font-bold leading-tight mb-6 text-foreground">
            {mockPost.title}
          </h1>

          <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
            {mockPost.excerpt}
          </p>

          {/* Author & Meta Info */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={mockPost.author.avatar} />
                <AvatarFallback>{mockPost.author.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">{mockPost.author.name}</p>
                <p className="text-sm text-muted-foreground">{mockPost.author.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(mockPost.publishedAt).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{mockPost.readTime}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{mockPost.views.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Featured Image */}
          <div className="mb-8 rounded-lg overflow-hidden">
            <img 
              src={mockPost.image} 
              alt={mockPost.title}
              className="w-full h-64 md:h-96 object-cover"
            />
          </div>

          {/* Social Actions */}
          <div className="flex items-center justify-between border-y py-4 mb-8">
            <div className="flex items-center gap-2">
              <Button 
                variant={liked ? "default" : "outline"}
                size="sm"
                onClick={() => setLiked(!liked)}
              >
                <Heart className={`w-4 h-4 mr-2 ${liked ? 'fill-current' : ''}`} />
                {mockPost.likes + (liked ? 1 : 0)}
              </Button>
              
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setBookmarked(!bookmarked)}
              >
                <BookmarkPlus className={`w-4 h-4 mr-2 ${bookmarked ? 'fill-current' : ''}`} />
                Sauvegarder
              </Button>

              <Button variant="outline" size="sm">
                <MessageCircle className="w-4 h-4 mr-2" />
                {mockPost.comments}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleShare('twitter')}>
                <Twitter className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleShare('facebook')}>
                <Facebook className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleShare('linkedin')}>
                <Linkedin className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleShare('copy')}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </header>

        {/* Article Body */}
        <div className="prose prose-lg max-w-none mb-12">
          <div 
            dangerouslySetInnerHTML={{ __html: mockPost.content }}
            className="[&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mt-8 [&>h2]:mb-4 [&>h2]:text-foreground
                     [&>p]:mb-4 [&>p]:leading-relaxed [&>p]:text-foreground
                     [&>ul]:mb-4 [&>ul]:pl-6 [&>li]:mb-2 [&>li]:text-foreground
                     [&>blockquote]:border-l-4 [&>blockquote]:border-primary [&>blockquote]:pl-4 
                     [&>blockquote]:py-2 [&>blockquote]:my-6 [&>blockquote]:italic [&>blockquote]:text-muted-foreground
                     [&>blockquote]:bg-muted/30 [&>blockquote]:rounded-r"
          />
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-8">
          {mockPost.tags.map(tag => (
            <Badge key={tag} variant="outline">
              #{tag}
            </Badge>
          ))}
        </div>

        {/* Author Bio */}
        <div className="bg-muted/30 rounded-lg p-6 mb-12">
          <h3 className="text-lg font-semibold mb-4">À propos de l'auteur</h3>
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={mockPost.author.avatar} />
              <AvatarFallback>{mockPost.author.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-medium text-lg">{mockPost.author.name}</h4>
              <p className="text-muted-foreground mb-2">{mockPost.author.role}</p>
              <p className="text-sm leading-relaxed">{mockPost.author.bio}</p>
            </div>
          </div>
        </div>

        <Separator className="mb-12" />

        {/* Article Actions */}
        <div className="mb-12">
          <BlogPostActions post={mockPost} />
        </div>

        {/* Newsletter */}
        <div className="mb-12">
          <BlogNewsletter />
        </div>

        {/* Recommended Posts */}
        <RecommendedPosts posts={[
          {
            id: '2',
            title: 'Comment Optimiser Vos Campagnes Facebook Ads',
            excerpt: 'Maximisez votre ROI avec ces techniques avancées de ciblage.',
            image: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=300&h=200&fit=crop',
            category: 'Marketing',
            readTime: '8 min',
            views: 8420,
            trending: false,
            reason: 'popular'
          },
          {
            id: '3', 
            title: 'Les Erreurs à Éviter en Dropshipping',
            excerpt: 'Découvrez les pièges les plus courants et comment les éviter.',
            image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&h=200&fit=crop',
            category: 'Conseils',
            readTime: '6 min',
            views: 5230,
            trending: false,
            reason: 'related'
          },
          {
            id: '4',
            title: 'Analyse de la Concurrence: Guide Complet',
            excerpt: 'Outils et méthodes pour analyser efficacement vos concurrents.',
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop',
            category: 'Analyse',
            readTime: '10 min',
            views: 12750,
            trending: true,
            reason: 'trending'
          }
        ]} />
      </article>
    </div>
  );
}