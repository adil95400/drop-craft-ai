import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Page non trouvée - ShopOpti</title>
        <meta name="description" content="La page que vous recherchez n'existe pas ou a été déplacée." />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="text-6xl font-bold text-primary mb-4">404</div>
            <h1 className="text-2xl font-semibold mb-2">Page non trouvée</h1>
            <p className="text-muted-foreground mb-6">
              La page que vous recherchez n'existe pas ou a été déplacée.
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/')} 
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Retour à l'accueil
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => navigate(-1)} 
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Page précédente
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={() => navigate('/dashboard')} 
                className="w-full"
              >
                <Search className="w-4 h-4 mr-2" />
                Aller au tableau de bord
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}