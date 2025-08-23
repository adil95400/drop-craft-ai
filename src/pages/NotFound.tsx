import { Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft, Search, AlertCircle } from "lucide-react";
import { Helmet } from "react-helmet-async";

const NotFound = () => {
  useEffect(() => {
    // Log for analytics without console.error to avoid spam
    console.info("User accessed 404 page");
  }, []);

  return (
    <>
      <Helmet>
        <title>Page non trouvée | 404 - Shopopti</title>
        <meta name="description" content="La page que vous recherchez n'existe pas ou a été déplacée. Retournez à l'accueil ou explorez nos fonctionnalités." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-lg w-full shadow-floating">
          <CardContent className="text-center p-8 space-y-6">
            <div className="mx-auto w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="h-12 w-12 text-white" />
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <h1 className="text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  404
                </h1>
                <h2 className="text-2xl font-semibold text-foreground">
                  Page non trouvée
                </h2>
              </div>
              
              <p className="text-muted-foreground text-lg max-w-md mx-auto">
                Oups ! La page que vous recherchez n'existe pas ou a été déplacée. 
                Retournez à l'accueil ou explorez nos fonctionnalités.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild className="bg-gradient-primary hover:opacity-90 transition-all">
                <Link to="/">
                  <Home className="mr-2 h-5 w-5" />
                  Accueil
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => window.history.back()}
                className="border-primary/20 hover:bg-primary/5"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Retour
              </Button>
              
              <Button asChild variant="ghost" className="hover:bg-accent/10">
                <Link to="/contact">
                  <Search className="mr-2 h-5 w-5" />
                  Aide
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default NotFound;
