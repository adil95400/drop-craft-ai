import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Calendar, 
  Clock, 
  Eye, 
  Heart, 
  Share2, 
  BookmarkPlus,
  TrendingUp,
  ArrowRight
} from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  image: string;
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  publishedAt: string;
  readTime: string;
  category: string;
  tags: string[];
  views: number;
  likes: number;
  featured: boolean;
  trending: boolean;
}

interface BlogCardProps {
  post: BlogPost;
  variant?: 'default' | 'featured' | 'compact';
  onClick?: () => void;
}

export function BlogCard({ post, variant = 'default', onClick }: BlogCardProps) {
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.excerpt,
        url: window.location.href + '/post/' + post.id,
      });
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement like functionality
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement bookmark functionality
  };

  if (variant === 'featured') {
    return (
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group relative">
        {post.trending && (
          <Badge className="absolute top-4 left-4 z-10 bg-red-500 text-white">
            <TrendingUp className="w-3 h-3 mr-1" />
            Trending
          </Badge>
        )}
        
        <div className="relative h-64 overflow-hidden">
          <img 
            src={post.image} 
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <Badge 
            variant="secondary" 
            className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm"
          >
            {post.category}
          </Badge>
        </div>

        <CardHeader className="pb-3">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={post.author.avatar} />
              <AvatarFallback>{post.author.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{post.author.name}</p>
              <p className="text-xs text-muted-foreground">{post.author.role}</p>
            </div>
          </div>
          
          <CardTitle className="text-xl line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <CardDescription className="text-sm leading-relaxed mb-4 line-clamp-3">
            {post.excerpt}
          </CardDescription>

          <div className="flex flex-wrap gap-1 mb-4">
            {post.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{new Date(post.publishedAt).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{post.readTime}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{post.views.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLike}
                className="h-8 px-2"
              >
                <Heart className="w-4 h-4 mr-1" />
                {post.likes}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleShare}
                className="h-8 px-2"
              >
                <Share2 className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBookmark}
                className="h-8 px-2"
              >
                <BookmarkPlus className="w-4 h-4" />
              </Button>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={onClick}
              className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
            >
              Lire l'article
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className="overflow-hidden border hover:shadow-md transition-all duration-300 cursor-pointer group" onClick={onClick}>
        <div className="flex">
          <div className="w-24 h-24 flex-shrink-0">
            <img 
              src={post.image} 
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {post.category}
              </Badge>
              {post.trending && (
                <Badge variant="destructive" className="text-xs">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Hot
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors mb-2">
              {post.title}
            </h3>
            <div className="flex items-center text-xs text-muted-foreground">
              <span>{post.author.name}</span>
              <span className="mx-2">•</span>
              <span>{post.readTime}</span>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border hover:shadow-lg transition-all duration-300 cursor-pointer group" onClick={onClick}>
      <div className="relative">
        <img 
          src={post.image} 
          alt={post.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <Badge 
          variant="secondary" 
          className="absolute top-3 right-3 text-xs bg-background/90 backdrop-blur-sm"
        >
          {post.category}
        </Badge>
        {post.trending && (
          <Badge className="absolute top-3 left-3 bg-red-500 text-white text-xs">
            <TrendingUp className="w-3 h-3 mr-1" />
            Trending
          </Badge>
        )}
      </div>
      
      <CardHeader className="pb-3">
        <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
          {post.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <CardDescription className="text-sm leading-relaxed mb-4 line-clamp-3">
          {post.excerpt}
        </CardDescription>

        <div className="flex flex-wrap gap-1 mb-4">
          {post.tags.slice(0, 2).map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={post.author.avatar} />
              <AvatarFallback className="text-xs">{post.author.name[0]}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{post.author.name}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Eye className="w-3 h-3" />
            <span>{post.views}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            <span>{new Date(post.publishedAt).toLocaleDateString('fr-FR')}</span>
            <Clock className="w-3 h-3 ml-2" />
            <span>{post.readTime}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLike}
              className="h-6 px-1 text-xs"
            >
              <Heart className="w-3 h-3 mr-1" />
              {post.likes}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}