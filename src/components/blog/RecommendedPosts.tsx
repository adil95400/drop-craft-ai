import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Clock, 
  Eye, 
  ArrowRight,
  Sparkles,
  Target
} from 'lucide-react';

interface RecommendedPost {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  readTime: string;
  views: number;
  category: string;
  trending: boolean;
  reason: 'trending' | 'popular' | 'recent' | 'related';
}

interface RecommendedPostsProps {
  posts: RecommendedPost[];
  title?: string;
  maxPosts?: number;
  variant?: 'sidebar' | 'bottom' | 'related';
}

export function RecommendedPosts({ 
  posts, 
  title = "Articles recommandés",
  maxPosts = 4,
  variant = 'sidebar'
}: RecommendedPostsProps) {
  const displayPosts = posts.slice(0, maxPosts);
  
  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case 'trending':
        return <TrendingUp className="w-3 h-3" />;
      case 'popular':
        return <Eye className="w-3 h-3" />;
      case 'recent':
        return <Sparkles className="w-3 h-3" />;
      case 'related':
        return <Target className="w-3 h-3" />;
      default:
        return <TrendingUp className="w-3 h-3" />;
    }
  };

  const getReasonText = (reason: string) => {
    switch (reason) {
      case 'trending':
        return 'Tendance';
      case 'popular':
        return 'Populaire';
      case 'recent':
        return 'Récent';
      case 'related':
        return 'Similaire';
      default:
        return 'Recommandé';
    }
  };

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'trending':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'popular':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'recent':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'related':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (variant === 'sidebar') {
    return (
      <Card className="sticky top-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {displayPosts.map((post, index) => (
            <div key={post.id} className="group cursor-pointer">
              <div className="flex gap-3">
                <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getReasonColor(post.reason)}`}
                    >
                      {getReasonIcon(post.reason)}
                      <span className="ml-1">{getReasonText(post.reason)}</span>
                    </Badge>
                  </div>
                  
                  <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors mb-2">
                    {post.title}
                  </h4>
                  
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>{post.readTime}</span>
                    <Eye className="w-3 h-3 ml-3 mr-1" />
                    <span>{post.views}</span>
                  </div>
                </div>
              </div>
              
              {index < displayPosts.length - 1 && (
                <div className="border-b mt-4" />
              )}
            </div>
          ))}
          
          <Button variant="outline" className="w-full mt-4" size="sm">
            Voir plus d'articles
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'bottom') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            {title}
          </h2>
          <p className="text-muted-foreground">
            Continuez votre lecture avec ces articles sélectionnés pour vous
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayPosts.map((post) => (
            <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <div className="relative">
                <img 
                  src={post.image} 
                  alt={post.title}
                  className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <Badge 
                  className={`absolute top-2 right-2 text-xs ${getReasonColor(post.reason)}`}
                >
                  {getReasonIcon(post.reason)}
                  <span className="ml-1">{getReasonText(post.reason)}</span>
                </Badge>
              </div>
              
              <CardContent className="p-4">
                <Badge variant="outline" className="text-xs mb-2">
                  {post.category}
                </Badge>
                
                <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors mb-2">
                  {post.title}
                </h3>
                
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{post.readTime}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>{post.views}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Related variant (inline within article)
  return (
    <Card className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Articles similaires
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayPosts.slice(0, 2).map((post) => (
            <div key={post.id} className="flex gap-3 p-3 rounded-lg hover:bg-background/50 transition-colors cursor-pointer group">
              <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                <img 
                  src={post.image} 
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <Badge variant="outline" className="text-xs mb-1">
                  {post.category}
                </Badge>
                
                <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors mb-1">
                  {post.title}
                </h4>
                
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>{post.readTime}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}