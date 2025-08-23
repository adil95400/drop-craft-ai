import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Copy,
  Download,
  CheckCircle,
  Star,
  MapPin,
  Building,
  User,
  Calendar,
  Code
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SchemaGenerator = () => {
  const [schemaType, setSchemaType] = useState("");
  const [generatedSchema, setGeneratedSchema] = useState("");
  const [formData, setFormData] = useState<any>({});
  const { toast } = useToast();

  const schemaTypes = [
    { value: "product", label: "Produit", icon: "📦" },
    { value: "article", label: "Article", icon: "📝" },
    { value: "organization", label: "Organisation", icon: "🏢" },
    { value: "person", label: "Personne", icon: "👤" },
    { value: "event", label: "Événement", icon: "📅" },
    { value: "review", label: "Avis", icon: "⭐" },
    { value: "faq", label: "FAQ", icon: "❓" },
    { value: "breadcrumb", label: "Fil d'Ariane", icon: "🧭" },
    { value: "localbusiness", label: "Entreprise Locale", icon: "📍" },
    { value: "recipe", label: "Recette", icon: "👨‍🍳" }
  ];

  const generateSchema = () => {
    if (!schemaType) {
      toast({
        title: "Type requis",
        description: "Veuillez sélectionner un type de schema",
        variant: "destructive"
      });
      return;
    }

    let schema = {};

    switch (schemaType) {
      case "product":
        schema = {
          "@context": "https://schema.org/",
          "@type": "Product",
          "name": formData.productName || "Nom du produit",
          "description": formData.productDescription || "Description du produit",
          "brand": {
            "@type": "Brand",
            "name": formData.brandName || "Marque"
          },
          "offers": {
            "@type": "Offer",
            "price": formData.price || "0",
            "priceCurrency": formData.currency || "EUR",
            "availability": "https://schema.org/InStock",
            "seller": {
              "@type": "Organization",
              "name": formData.sellerName || "Vendeur"
            }
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": formData.rating || "5",
            "reviewCount": formData.reviewCount || "1"
          }
        };
        break;

      case "article":
        schema = {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": formData.headline || "Titre de l'article",
          "description": formData.description || "Description de l'article", 
          "author": {
            "@type": "Person",
            "name": formData.authorName || "Auteur"
          },
          "publisher": {
            "@type": "Organization",
            "name": formData.publisherName || "Éditeur"
          },
          "datePublished": formData.datePublished || new Date().toISOString().split('T')[0],
          "dateModified": formData.dateModified || new Date().toISOString().split('T')[0]
        };
        break;

      case "organization":
        schema = {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": formData.orgName || "Nom de l'organisation",
          "description": formData.orgDescription || "Description de l'organisation",
          "url": formData.orgUrl || "https://example.com",
          "logo": formData.logoUrl || "https://example.com/logo.png",
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": formData.phone || "+33123456789",
            "contactType": "customer service"
          },
          "address": {
            "@type": "PostalAddress",
            "streetAddress": formData.streetAddress || "Adresse",
            "addressLocality": formData.city || "Ville",
            "postalCode": formData.postalCode || "Code postal",
            "addressCountry": formData.country || "FR"
          }
        };
        break;

      case "localbusiness":
        schema = {
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": formData.businessName || "Nom de l'entreprise",
          "description": formData.businessDescription || "Description de l'entreprise",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": formData.streetAddress || "Adresse",
            "addressLocality": formData.city || "Ville",
            "postalCode": formData.postalCode || "Code postal",
            "addressCountry": formData.country || "FR"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": formData.latitude || "48.8566",
            "longitude": formData.longitude || "2.3522"
          },
          "openingHours": formData.openingHours || "Mo-Fr 09:00-18:00",
          "telephone": formData.phone || "+33123456789",
          "url": formData.website || "https://example.com"
        };
        break;

      case "faq":
        const questions = formData.questions || [
          { question: "Question 1", answer: "Réponse 1" },
          { question: "Question 2", answer: "Réponse 2" }
        ];
        schema = {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": questions.map((q: any) => ({
            "@type": "Question",
            "name": q.question,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": q.answer
            }
          }))
        };
        break;

      default:
        schema = {
          "@context": "https://schema.org",
          "@type": "Thing",
          "name": "Exemple"
        };
    }

    setGeneratedSchema(JSON.stringify(schema, null, 2));
    toast({
      title: "Schema généré !",
      description: "Votre schema.org est prêt à être utilisé",
    });
  };

  const copySchema = () => {
    navigator.clipboard.writeText(generatedSchema);
    toast({
      title: "Copié !",
      description: "Schema copié dans le presse-papiers",
    });
  };

  const downloadSchema = () => {
    const blob = new Blob([generatedSchema], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schema-${schemaType}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Téléchargé !",
      description: "Schema téléchargé avec succès",
    });
  };

  const renderForm = () => {
    switch (schemaType) {
      case "product":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="productName">Nom du produit</Label>
              <Input
                id="productName"
                placeholder="Coque iPhone 15"
                onChange={(e) => setFormData({...formData, productName: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="brandName">Marque</Label>
              <Input
                id="brandName"
                placeholder="Apple"
                onChange={(e) => setFormData({...formData, brandName: e.target.value})}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="productDescription">Description</Label>
              <Textarea
                id="productDescription"
                placeholder="Description du produit..."
                onChange={(e) => setFormData({...formData, productDescription: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="price">Prix</Label>
              <Input
                id="price"
                type="number"
                placeholder="29.99"
                onChange={(e) => setFormData({...formData, price: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="currency">Devise</Label>
              <Select onValueChange={(value) => setFormData({...formData, currency: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="EUR" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "article":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="headline">Titre de l'article</Label>
              <Input
                id="headline"
                placeholder="Titre de votre article"
                onChange={(e) => setFormData({...formData, headline: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Description de l'article..."
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="authorName">Auteur</Label>
                <Input
                  id="authorName"
                  placeholder="Nom de l'auteur"
                  onChange={(e) => setFormData({...formData, authorName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="publisherName">Éditeur</Label>
                <Input
                  id="publisherName"
                  placeholder="Nom de l'éditeur"
                  onChange={(e) => setFormData({...formData, publisherName: e.target.value})}
                />
              </div>
            </div>
          </div>
        );

      case "localbusiness":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="businessName">Nom de l'entreprise</Label>
              <Input
                id="businessName"
                placeholder="Mon Entreprise"
                onChange={(e) => setFormData({...formData, businessName: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="businessDescription">Description</Label>
              <Textarea
                id="businessDescription"
                placeholder="Description de votre entreprise..."
                onChange={(e) => setFormData({...formData, businessDescription: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="streetAddress">Adresse</Label>
                <Input
                  id="streetAddress"
                  placeholder="123 Rue de la Paix"
                  onChange={(e) => setFormData({...formData, streetAddress: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  placeholder="Paris"
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  placeholder="+33123456789"
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="website">Site web</Label>
                <Input
                  id="website"
                  placeholder="https://monsite.com"
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                />
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            Sélectionnez un type de schema pour voir les champs
          </div>
        );
    }
  };

  return (
    <>
      <Helmet>
        <title>Générateur Schema.org - SEO Tools</title>
        <meta name="description" content="Générez des données structurées Schema.org pour améliorer votre SEO. Produits, articles, FAQ et plus." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              Génération Schema.org
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Créez des données structurées pour améliorer votre référencement
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Configuration */}
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-primary" />
                  Configuration du Schema
                </CardTitle>
                <CardDescription>
                  Configurez votre schema selon vos besoins
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Sélection du type */}
                <div>
                  <Label htmlFor="schema-type">Type de Schema</Label>
                  <Select onValueChange={setSchemaType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisissez un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {schemaTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <span>{type.icon}</span>
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Formulaire dynamique */}
                <div>
                  <Label>Informations du Schema</Label>
                  <div className="mt-2 p-4 border rounded-lg bg-accent/30">
                    {renderForm()}
                  </div>
                </div>

                <Button 
                  onClick={generateSchema} 
                  className="w-full bg-gradient-to-r from-primary to-primary/80"
                  disabled={!schemaType}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Générer le Schema
                </Button>
              </CardContent>
            </Card>

            {/* Résultat */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      Schema Généré
                    </CardTitle>
                    <CardDescription>
                      Copiez ce code dans votre HTML
                    </CardDescription>
                  </div>
                  {generatedSchema && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={copySchema}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={downloadSchema}>
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {generatedSchema ? (
                  <Tabs defaultValue="json" className="w-full">
                    <TabsList>
                      <TabsTrigger value="json">JSON-LD</TabsTrigger>
                      <TabsTrigger value="html">HTML</TabsTrigger>
                    </TabsList>
                    <TabsContent value="json">
                      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-96">
                        <pre className="text-sm">
                          <code>{generatedSchema}</code>
                        </pre>
                      </div>
                    </TabsContent>
                    <TabsContent value="html">
                      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-96">
                        <pre className="text-sm">
                          <code>{`<script type="application/ld+json">\n${generatedSchema}\n</script>`}</code>
                        </pre>
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Votre schema apparaîtra ici</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Guide */}
          <Card>
            <CardHeader>
              <CardTitle>Guide d'utilisation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">1️⃣</span>
                  </div>
                  <h3 className="font-medium mb-2">Choisissez le type</h3>
                  <p className="text-sm text-muted-foreground">
                    Sélectionnez le type de schema qui correspond à votre contenu
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">2️⃣</span>
                  </div>
                  <h3 className="font-medium mb-2">Remplissez les champs</h3>
                  <p className="text-sm text-muted-foreground">
                    Complétez les informations demandées pour votre schema
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">3️⃣</span>
                  </div>
                  <h3 className="font-medium mb-2">Intégrez le code</h3>
                  <p className="text-sm text-muted-foreground">
                    Copiez le code généré dans la section &lt;head&gt; de votre page
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default SchemaGenerator;