import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Zap, ArrowLeft, Mail, Lock, User, Building, Loader2, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading, signIn, signUp, resetPassword } = useAuth();

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  });

  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    password: "",
    company: ""
  });

  const [resetForm, setResetForm] = useState({
    email: ""
  });

  const [activeTab, setActiveTab] = useState("login");

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      // Use window.location.href for immediate redirect
      window.location.href = "/dashboard";
    }
  }, [user, loading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signIn(loginForm.email, loginForm.password);
      if (error) {
        console.error('Detailed login error:', error);
        
        let errorMessage = error.message;
        
        // Provide more specific error messages in French
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = "Email ou mot de passe incorrect. Vérifiez vos identifiants.";
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = "Veuillez confirmer votre email avant de vous connecter.";
        } else if (error.message.includes('Too many requests')) {
          errorMessage = "Trop de tentatives. Veuillez patienter quelques minutes.";
        }
        
        toast({
          title: "Erreur de connexion",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        // Success message
        toast({
          title: "Connexion réussie !",
          description: "Redirection vers votre tableau de bord...",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupForm.email || !signupForm.password || !signupForm.name) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    if (signupForm.password.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signUp(signupForm.email, signupForm.password, {
        full_name: signupForm.name,
        company: signupForm.company,
      });
      if (error) {
        toast({
          title: "Erreur d'inscription",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetForm.email) {
      toast({
        title: "Email requis",
        description: "Veuillez saisir votre email pour réinitialiser votre mot de passe",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await resetPassword(resetForm.email);
      if (error) {
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email envoyé !",
          description: "Vérifiez votre boîte mail pour réinitialiser votre mot de passe",
          variant: "default",
        });
        setActiveTab("login");
      }
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi de l'email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    toast({
      title: "Fonctionnalité à venir",
      description: "La connexion Google sera bientôt disponible",
    });
  };

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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Back to Home */}
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à l'accueil
        </Button>

        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            Shopopti Pro
          </h1>
          <p className="text-muted-foreground">
            Connectez-vous pour accéder à votre tableau de bord
          </p>
        </div>

        {/* Auth Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="login">Connexion</TabsTrigger>
            <TabsTrigger value="signup">Inscription</TabsTrigger>
            <TabsTrigger value="reset">Mot de passe</TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login">
            <Card className="border-border bg-card shadow-card">
              <CardHeader>
                <CardTitle>Connexion</CardTitle>
                <CardDescription>
                  Accédez à votre compte Shopopti Pro
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="votre@email.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    variant="hero" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Connexion..." : "Se connecter"}
                  </Button>

                  <div className="text-center">
                    <Button 
                      variant="link" 
                      className="text-sm"
                      onClick={() => setActiveTab("reset")}
                      type="button"
                    >
                      Mot de passe oublié ?
                    </Button>
                  </div>
                </form>

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Ou continuer avec</span>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    onClick={handleGoogleAuth}
                    className="w-full mt-4"
                    disabled={isLoading}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    {isLoading ? "Connexion..." : "Google"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Signup Tab */}
          <TabsContent value="signup">
            <Card className="border-border bg-card shadow-card">
              <CardHeader>
                <CardTitle>Inscription</CardTitle>
                <CardDescription>
                  Créez votre compte Shopopti Pro
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nom complet</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Votre nom"
                        value={signupForm.name}
                        onChange={(e) => setSignupForm({...signupForm, name: e.target.value})}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="votre@email.com"
                        value={signupForm.email}
                        onChange={(e) => setSignupForm({...signupForm, email: e.target.value})}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-company">Entreprise (optionnel)</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-company"
                        type="text"
                        placeholder="Nom de votre entreprise"
                        value={signupForm.company}
                        onChange={(e) => setSignupForm({...signupForm, company: e.target.value})}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupForm.password}
                        onChange={(e) => setSignupForm({...signupForm, password: e.target.value})}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    variant="hero" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Création..." : "Créer mon compte"}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    En vous inscrivant, vous acceptez nos{" "}
                    <Button variant="link" className="p-0 h-auto text-xs">
                      Conditions d'utilisation
                    </Button>{" "}
                    et notre{" "}
                    <Button variant="link" className="p-0 h-auto text-xs">
                      Politique de confidentialité
                    </Button>
                  </p>
                </form>

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Ou continuer avec</span>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    onClick={handleGoogleAuth}
                    className="w-full mt-4"
                    disabled={isLoading}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    {isLoading ? "Connexion..." : "Google"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reset Password Tab */}
          <TabsContent value="reset">
            <Card className="border-border bg-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <KeyRound className="w-5 h-5" />
                  <span>Mot de passe oublié</span>
                </CardTitle>
                <CardDescription>
                  Saisissez votre email pour recevoir un lien de réinitialisation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="votre@email.com"
                        value={resetForm.email}
                        onChange={(e) => setResetForm({...resetForm, email: e.target.value})}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    variant="hero" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Envoyer le lien de réinitialisation
                      </>
                    )}
                  </Button>

                  <div className="text-center space-y-2">
                    <Button 
                      variant="link" 
                      className="text-sm"
                      onClick={() => setActiveTab("login")}
                      type="button"
                    >
                      Retour à la connexion
                    </Button>
                  </div>
                </form>

                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p className="font-medium">📧 Instructions :</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Vérifiez votre boîte de réception</li>
                      <li>Cliquez sur le lien dans l'email reçu</li>
                      <li>Créez votre nouveau mot de passe</li>
                      <li>Revenez vous connecter ici</li>
                    </ul>
                    <p className="text-xs text-muted-foreground mt-3">
                      💡 N'oubliez pas de vérifier vos spams si vous ne voyez pas l'email
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;