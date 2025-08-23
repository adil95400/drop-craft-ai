import { Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft, RefreshCw, AlertTriangle } from "lucide-react";
import { Helmet } from "react-helmet-async";

interface ErrorPageProps {
  error?: Error;
  errorCode?: number;
  title?: string;
  description?: string;
  showRefresh?: boolean;
}

const ErrorPage = ({ 
  error, 
  errorCode = 500, 
  title = "Une erreur s'est produite", 
  description = "Nous rencontrons des difficultés techniques. Veuillez réessayer dans quelques instants.",
  showRefresh = true 
}: ErrorPageProps) => {
  useEffect(() => {
    if (error) {
      console.error("Application error:", error);
    }
  }, [error]);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <>
      <Helmet>
        <title>{title} | Erreur {errorCode} - Shopopti</title>
        <meta name="description" content={description} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-lg w-full shadow-floating">
          <CardContent className="text-center p-8 space-y-6">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-destructive to-warning rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="h-12 w-12 text-white" />
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <h1 className="text-5xl font-bold text-destructive">
                  {errorCode}
                </h1>
                <h2 className="text-2xl font-semibold text-foreground">
                  {title}
                </h2>
              </div>
              
              <p className="text-muted-foreground text-lg max-w-md mx-auto">
                {description}
              </p>

              {error && process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive font-mono">
                    {error.message}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild className="bg-gradient-primary hover:opacity-90 transition-all">
                <Link to="/">
                  <Home className="mr-2 h-5 w-5" />
                  Accueil
                </Link>
              </Button>
              
              {showRefresh && (
                <Button 
                  variant="outline" 
                  onClick={handleRefresh}
                  className="border-primary/20 hover:bg-primary/5"
                >
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Actualiser
                </Button>
              )}
              
              <Button 
                variant="ghost" 
                onClick={() => window.history.back()}
                className="hover:bg-accent/10"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Retour
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ErrorPage;