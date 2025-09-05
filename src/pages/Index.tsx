import { useAuth } from "@/contexts/AuthContext";
import Home from "./Home";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();

  // Show loading while auth is being determined
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, AuthGuard will handle redirection
  // Just show the home page for non-authenticated users
  return <Home />;
};

export default Index;
