import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { ArticleSchema, BreadcrumbSchema } from "@/components/seo/StructuredData";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, ArrowLeft, Tag } from "lucide-react";
import ReactMarkdown from "react-markdown";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const BlogArticlePage = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Find post by matching slug from title
      const found = data?.find((p) => slugify(p.title) === slug);
      return found || null;
    },
    enabled: !!slug,
  });

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

  const readTime = Math.max(1, Math.ceil((post.content?.length || 0) / 1500));
  const articleUrl = `https://shopopti.io/blog/${slug}`;

  return (
    <PublicLayout>
      <SEO
        title={post.seo_title || `${post.title} | Blog ShopOpti+`}
        description={post.seo_description || post.excerpt || post.title}
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
        description={post.seo_description || post.excerpt || post.title}
        image={post.image_url || "https://shopopti.io/og-image.png"}
        author="ShopOpti+"
        datePublished={post.publish_date || post.created_at || ""}
        dateModified={post.updated_at || post.created_at || ""}
        url={articleUrl}
      />

      <article className="py-12 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
          {/* Back */}
          <Link to="/blog" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8">
            <ArrowLeft className="h-4 w-4 mr-1" /> Retour au blog
          </Link>

          {/* Header */}
          <header className="mb-10">
            {post.category && (
              <Badge variant="secondary" className="mb-4">{post.category}</Badge>
            )}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="text-xl text-muted-foreground mb-6">{post.excerpt}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {new Date(post.publish_date || post.created_at || "").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {readTime} min de lecture</span>
            </div>
          </header>

          {/* Image */}
          {post.image_url && (
            <div className="mb-10 rounded-xl overflow-hidden">
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full h-auto object-cover"
                loading="eager"
                width={800}
                height={450}
              />
            </div>
          )}

          {/* Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t">
              <div className="flex flex-wrap gap-2">
                <Tag className="h-4 w-4 text-muted-foreground mt-1" />
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-12 p-6 rounded-xl border bg-muted/20 text-center">
            <h2 className="text-xl font-bold mb-2">Prêt à automatiser votre e-commerce ?</h2>
            <p className="text-muted-foreground mb-4">Essayez ShopOpti+ gratuitement pendant 14 jours.</p>
            <Link to="/auth?trial=true">
              <Button>Essai gratuit</Button>
            </Link>
          </div>
        </div>
      </article>
    </PublicLayout>
  );
};

export default BlogArticlePage;
