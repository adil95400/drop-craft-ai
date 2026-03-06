import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { ArticleSchema, BreadcrumbSchema } from "@/components/seo/StructuredData";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, User, ArrowLeft, Tag, ArrowRight, Share2, BookOpen, Eye, MessageCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { getFallbackPostBySlug, FALLBACK_BLOG_POSTS, slugify } from "@/data/blogArticles";
import { motion } from "framer-motion";

const BlogArticlePage = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      // First try DB
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const found = data?.find((p) => slugify(p.title) === slug);
      if (found) return { ...found, source: "db" as const };

      // Fallback to static articles
      const fallback = getFallbackPostBySlug(slug || "");
      if (fallback) {
        return {
          ...fallback,
          seo_title: null,
          seo_description: null,
          updated_at: fallback.publish_date,
          status: "published",
          ai_generated: false,
          source: "fallback" as const,
        };
      }

      return null;
    },
    enabled: !!slug,
  });

  const getAuthor = () => {
    if (post && 'author' in post && (post as any).author) return (post as any).author;
    return "ShopOpti+";
  };

  const getReadTime = () => {
    if (post && 'readTime' in post && (post as any).readTime) return (post as any).readTime;
    return `${Math.max(1, Math.ceil((post?.content?.length || 0) / 1500))} min`;
  };

  const getViews = () => {
    if (post && 'views' in post && (post as any).views) return (post as any).views;
    return 0;
  };

  // Related articles (same category, different id)
  const relatedPosts = post
    ? FALLBACK_BLOG_POSTS.filter(p => p.category === (post.category || "") && p.id !== post.id).slice(0, 3)
    : [];

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="animate-pulse space-y-4 max-w-3xl mx-auto">
            <div className="h-8 bg-muted rounded w-3/4 mx-auto" />
            <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!post) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">Article non trouvé</h1>
          <p className="text-muted-foreground mb-6">Cet article n'existe pas ou a été supprimé.</p>
          <Link to="/blog">
            <Button><ArrowLeft className="mr-2 h-4 w-4" /> Retour au blog</Button>
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const readTime = getReadTime();
  const articleUrl = `https://shopopti.io/blog/${slug}`;
  const author = getAuthor();
  const views = getViews();

  return (
    <PublicLayout>
      <SEO
        title={(post as any).seo_title || `${post.title} | Blog ShopOpti+`}
        description={(post as any).seo_description || post.excerpt || post.title}
        path={`/blog/${slug}`}
        keywords={post.tags?.join(", ") || ""}
      />
      <BreadcrumbSchema
        items={[
          { name: "Accueil", url: "https://shopopti.io" },
          { name: "Blog", url: "https://shopopti.io/blog" },
          { name: post.title, url: articleUrl },
        ]}
      />
      <ArticleSchema
        headline={post.title}
        description={(post as any).seo_description || post.excerpt || post.title}
        image={post.image_url || "https://shopopti.io/og-image.png"}
        author={author}
        datePublished={post.publish_date || post.created_at || ""}
        dateModified={(post as any).updated_at || post.created_at || ""}
        url={articleUrl}
      />

      <article className="py-12 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          {/* Back */}
          <Link to="/blog" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 group">
            <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Retour au blog
          </Link>

          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-10"
          >
            <div className="flex items-center gap-3 mb-4">
              {post.category && (
                <Badge className="bg-primary/10 text-primary border-primary/20">{post.category}</Badge>
              )}
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" /> {readTime} de lecture
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 leading-tight tracking-tight">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">{post.excerpt}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-t border-b py-4">
              <span className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium text-foreground">{author}</span>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(post.publish_date || post.created_at || "").toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              {views > 0 && (
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" /> {views.toLocaleString()} lectures
                </span>
              )}
              <button
                className="ml-auto flex items-center gap-1 hover:text-primary transition-colors"
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                }}
              >
                <Share2 className="h-4 w-4" /> Partager
              </button>
            </div>
          </motion.header>

          {/* Image */}
          {post.image_url && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-10 rounded-2xl overflow-hidden shadow-lg"
            >
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full h-auto object-cover"
                loading="eager"
                width={800}
                height={450}
              />
            </motion.div>
          )}

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-2xl prose-h3:text-xl prose-a:text-primary prose-strong:text-foreground"
          >
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </motion.div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t">
              <div className="flex flex-wrap gap-2">
                <Tag className="h-4 w-4 text-muted-foreground mt-1" />
                {post.tags.map((tag) => (
                  <Link key={tag} to={`/blog?search=${tag}`}>
                    <Badge variant="outline" className="hover:bg-primary/5 cursor-pointer transition-colors">
                      #{tag}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Related articles */}
          {relatedPosts.length > 0 && (
            <div className="mt-16 pt-8 border-t">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Articles similaires
              </h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {relatedPosts.map((rp) => (
                  <Link key={rp.id} to={`/blog/${slugify(rp.title)}`} className="group">
                    <Card className="overflow-hidden hover:shadow-lg transition-all h-full border hover:border-primary/30">
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={rp.image_url}
                          alt={rp.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                      <CardContent className="p-4">
                        <Badge variant="outline" className="text-xs mb-2">{rp.category}</Badge>
                        <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                          {rp.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">{rp.readTime}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-12 p-8 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 text-center">
            <h2 className="text-2xl font-bold mb-2">Prêt à automatiser votre e-commerce ?</h2>
            <p className="text-muted-foreground mb-6">Essayez ShopOpti+ gratuitement pendant 14 jours. Aucune carte bancaire requise.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/auth?trial=true">
                <Button size="lg" className="rounded-xl">
                  Essai gratuit <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link to="/blog">
                <Button size="lg" variant="outline" className="rounded-xl">
                  Lire d'autres articles
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </article>
    </PublicLayout>
  );
};

export default BlogArticlePage;
