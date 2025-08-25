import { SEO } from "@/components/SEO";

const Blog = () => {
  return (
    <>
      <SEO
        title="Blog | Shopopti+"
        description="Conseils et actualités e-commerce. Comment Shopopti+ révolutionne le dropshipping avec IA."
        path="/blog"
        keywords="blog dropshipping, SEO e-commerce, Shopify, AliExpress, BigBuy"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Blog",
          "url": "https://www.shopopti.io/blog",
          "name": "Shopopti+ Blog"
        }}
      />
      <div className="min-h-screen bg-background py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Blog Shopopti+</h1>
          <p className="text-xl text-muted-foreground">Conseils d'experts et actualités e-commerce</p>
        </div>
      </div>
    </>
  );
};

export default Blog;