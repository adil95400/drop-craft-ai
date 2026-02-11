import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Page non trouvée - ShopOpti</title>
        <meta name="description" content="La page que vous recherchez n'existe pas ou a été déplacée." />
      </Helmet>
      
      <ChannablePageWrapper
        title="Page non trouvée"
        description="La page que vous recherchez n'existe pas ou a été déplacée."
        heroImage="settings"
      >
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <div className="text-6xl font-bold text-primary mb-4">404</div>
            <h2 className="text-2xl font-semibold mb-2">Oups !</h2>
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
      </ChannablePageWrapper>
    </>
  );
}
