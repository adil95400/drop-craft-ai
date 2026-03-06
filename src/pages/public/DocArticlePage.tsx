import { useParams, Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Clock, Calendar, BookOpen, ArrowRight, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { getDocArticleBySlug, ALL_DOC_ARTICLES } from "@/data/documentationArticles";

const DocArticlePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const article = getDocArticleBySlug(slug || "");

  if (!article) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">Article non trouvé</h1>
          <p className="text-muted-foreground mb-6">L'article demandé n'existe pas dans notre documentation.</p>
          <Button asChild><Link to="/documentation"><ArrowLeft className="w-4 h-4 mr-2" />Retour à la documentation</Link></Button>
        </div>
      </PublicLayout>
    );
  }

  const related = article.relatedLinks
    ?.map(r => ALL_DOC_ARTICLES.find(a => a.slug === r.slug))
    .filter(Boolean) || [];

  return (
    <PublicLayout>
      <SEO
        title={`${article.title} | Documentation ShopOpti+`}
        description={`Guide complet : ${article.title}. Apprenez à utiliser cette fonctionnalité de ShopOpti+ étape par étape.`}
        path={`/documentation/${article.slug}`}
      />

      <div className="bg-background min-h-screen">
        {/* Breadcrumb */}
        <div className="border-b bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 py-3">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/documentation" className="hover:text-foreground transition-colors">Documentation</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-muted-foreground">{article.category}</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium truncate">{article.title}</span>
            </nav>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 py-8 lg:py-12">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <Button variant="ghost" size="sm" asChild className="mb-4">
                <Link to="/documentation"><ArrowLeft className="w-4 h-4 mr-2" />Retour</Link>
              </Button>

              <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">{article.category}</Badge>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{article.title}</h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{article.readTime} de lecture</span>
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />Mis à jour le {new Date(article.lastUpdated).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>

            {/* Content */}
            <article className="prose prose-lg dark:prose-invert max-w-none mb-12
              prose-headings:font-bold prose-headings:text-foreground
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:pb-2 prose-h2:border-border
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-h4:text-lg prose-h4:mt-6
              prose-p:text-muted-foreground prose-p:leading-relaxed
              prose-li:text-muted-foreground
              prose-strong:text-foreground
              prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:text-foreground
              prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-lg
              prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:px-4
              prose-table:border prose-table:border-border prose-th:bg-muted prose-th:p-3 prose-td:p-3 prose-td:border-t prose-td:border-border
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            ">
              <ReactMarkdown>{article.content}</ReactMarkdown>
            </article>

            {/* Related Articles */}
            {related.length > 0 && (
              <section className="border-t pt-8">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Articles connexes
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {related.map((r) => r && (
                    <Card key={r.slug} className="hover:border-primary/50 transition-colors">
                      <CardContent className="p-4">
                        <Badge variant="outline" className="mb-2 text-xs">{r.category}</Badge>
                        <Link to={`/documentation/${r.slug}`} className="font-medium hover:text-primary transition-colors block mb-1">
                          {r.title}
                        </Link>
                        <span className="text-xs text-muted-foreground">{r.readTime} de lecture</span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* CTA */}
            <div className="mt-12 p-6 bg-primary/5 border border-primary/20 rounded-xl text-center">
              <h3 className="text-lg font-semibold mb-2">Besoin d'aide supplémentaire ?</h3>
              <p className="text-muted-foreground text-sm mb-4">Notre équipe est disponible pour vous accompagner.</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild><Link to="/contact">Contacter le support</Link></Button>
                <Button variant="outline" asChild><Link to="/documentation">Tous les guides <ArrowRight className="w-4 h-4 ml-2" /></Link></Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default DocArticlePage;
