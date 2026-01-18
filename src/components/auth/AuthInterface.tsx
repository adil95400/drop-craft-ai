/**
 * Interface d'authentification moderne et optimisée
 * Design épuré avec animations fluides et UX améliorée
 */
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { SecureInput } from '@/components/common/SecureInput';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, Mail, Lock, User, Building2, Eye, EyeOff, 
  CheckCircle2, AlertCircle, ArrowRight, Shield,
  Zap, BarChart3, Star
} from 'lucide-react';
import { GoogleAuthButton } from './GoogleAuthButton';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

// Import assets
import shopOptiLogo from '@/assets/shopopti-logo.png';
import authHeroBg from '@/assets/auth-hero-bg.jpg';

// Validation helpers
const validateEmail = (email: string) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

const validatePassword = (password: string) => {
  return password.length >= 6;
};

// Password strength indicator
const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Faible', color: 'bg-destructive' };
  if (score <= 3) return { score, label: 'Moyen', color: 'bg-yellow-500' };
  return { score, label: 'Fort', color: 'bg-green-500' };
};

// Feature highlights
const features = [
  { icon: Zap, label: 'Performance optimisée', description: 'Chargement ultra rapide' },
  { icon: Shield, label: 'Sécurité maximale', description: 'Données chiffrées' },
  { icon: BarChart3, label: 'Analytics avancés', description: 'Insights en temps réel' },
];

// Testimonials
const testimonials = [
  { name: 'Marie L.', role: 'E-commerçante', text: 'ShopOpti a doublé mes ventes en 3 mois !', rating: 5 },
  { name: 'Thomas D.', role: 'Dropshipper', text: 'Interface intuitive et support réactif.', rating: 5 },
];

export const AuthInterface = () => {
  const { signIn, signUp, resetPassword, loading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [signInForm, setSignInForm] = useState({
    email: '',
    password: ''
  });

  const [signUpForm, setSignUpForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    company: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showForgotModal, setShowForgotModal] = useState(false);

  const validateSignInForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    if (!signInForm.email) {
      newErrors.signinEmail = 'Email requis';
    } else if (!validateEmail(signInForm.email)) {
      newErrors.signinEmail = 'Email invalide';
    }
    
    if (!signInForm.password) {
      newErrors.signinPassword = 'Mot de passe requis';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [signInForm]);

  const validateSignUpForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    if (!signUpForm.firstName.trim()) {
      newErrors.firstName = 'Prénom requis';
    }
    
    if (!signUpForm.lastName.trim()) {
      newErrors.lastName = 'Nom requis';
    }
    
    if (!signUpForm.email) {
      newErrors.signupEmail = 'Email requis';
    } else if (!validateEmail(signUpForm.email)) {
      newErrors.signupEmail = 'Email invalide';
    }
    
    if (!signUpForm.password) {
      newErrors.signupPassword = 'Mot de passe requis';
    } else if (!validatePassword(signUpForm.password)) {
      newErrors.signupPassword = 'Minimum 6 caractères';
    }
    
    if (signUpForm.password !== signUpForm.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [signUpForm]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateSignInForm()) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await signIn(signInForm.email, signInForm.password);
      if (error) {
        let errorMessage = error.message;
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Email ou mot de passe incorrect';
        }
        toast({
          title: "Erreur de connexion",
          description: errorMessage,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Connexion réussie ! 🎉",
          description: "Bienvenue dans votre espace ShopOpti"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateSignUpForm()) return;

    setIsLoading(true);
    
    try {
      const { error } = await signUp(signUpForm.email, signUpForm.password, {
        full_name: `${signUpForm.firstName} ${signUpForm.lastName}`.trim(),
        company: signUpForm.company,
        first_name: signUpForm.firstName,
        last_name: signUpForm.lastName
      });
      
      if (error) {
        let errorMessage = error.message;
        if (error.message.includes('already registered')) {
          errorMessage = 'Cet email est déjà utilisé';
        }
        toast({
          title: "Erreur d'inscription",
          description: errorMessage,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Inscription réussie ! 🎉",
          description: "Bienvenue sur ShopOpti ! Vous allez être redirigé..."
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(signUpForm.password);

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Hero Image & Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Image */}
        <img 
          src={authHeroBg} 
          alt="ShopOpti Dashboard" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-transparent" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 text-white h-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Logo */}
            <div className="flex items-center gap-3 mb-12">
              <img 
                src={shopOptiLogo} 
                alt="ShopOpti Logo" 
                className="h-14 w-auto object-contain drop-shadow-lg"
              />
            </div>
            
            {/* Headline */}
            <h2 className="text-4xl xl:text-5xl font-bold leading-tight mb-6">
              Boostez votre
              <br />
              <span className="text-white/90">e-commerce</span>
            </h2>
            
            <p className="text-lg text-white/90 mb-10 max-w-md">
              La plateforme tout-en-un pour gérer, automatiser et faire croître votre business en ligne.
            </p>
            
            {/* Features */}
            <div className="space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold">{feature.label}</p>
                    <p className="text-sm text-white/70">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          {/* Testimonial */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-auto pt-8"
          >
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20">
              <div className="flex gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-white/90 italic mb-3">
                "ShopOpti a révolutionné ma gestion e-commerce. Mes ventes ont doublé en 3 mois !"
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                  ML
                </div>
                <div>
                  <p className="font-medium text-sm">Marie L.</p>
                  <p className="text-white/60 text-xs">E-commerçante • +2,500 produits</p>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-white/60 mt-4 text-center">
              Rejoint par <span className="text-white font-semibold">+2,500</span> e-commerçants
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img 
              src={shopOptiLogo} 
              alt="ShopOpti Logo" 
              className="h-12 w-auto object-contain mx-auto mb-2"
            />
            <p className="text-sm text-muted-foreground">Plateforme e-commerce</p>
          </div>

          <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold">
                {activeTab === 'signin' ? 'Connexion' : 'Créer un compte'}
              </CardTitle>
              <CardDescription>
                {activeTab === 'signin' 
                  ? 'Accédez à votre tableau de bord'
                  : 'Commencez gratuitement, sans carte bancaire'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="signin" className="text-sm">Connexion</TabsTrigger>
                  <TabsTrigger value="signup" className="text-sm">Inscription</TabsTrigger>
                </TabsList>

                <AnimatePresence mode="wait">
                  {/* Sign In Tab */}
                  <TabsContent value="signin" className="space-y-4 mt-0">
                    <motion.div
                      key="signin"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Google Auth */}
                      <GoogleAuthButton mode="signin" className="w-full h-11" />
                      
                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">
                            ou par email
                          </span>
                        </div>
                      </div>

                      <form onSubmit={handleSignIn} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="signin-email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <SecureInput
                              id="signin-email"
                              type="email"
                              placeholder="vous@exemple.com"
                              className={cn(
                                "pl-10 h-11",
                                errors.signinEmail && "border-destructive focus-visible:ring-destructive"
                              )}
                              value={signInForm.email}
                              onChange={(e) => {
                                setSignInForm({...signInForm, email: e.target.value});
                                if (errors.signinEmail) setErrors(prev => ({ ...prev, signinEmail: '' }));
                              }}
                              required
                              maxLength={254}
                            />
                          </div>
                          {errors.signinEmail && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {errors.signinEmail}
                            </p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="signin-password">Mot de passe</Label>
                            <Button 
                              type="button"
                              variant="link" 
                              size="sm"
                              className="h-auto p-0 text-xs"
                              onClick={() => setShowForgotModal(true)}
                            >
                              Oublié ?
                            </Button>
                          </div>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <SecureInput
                              id="signin-password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              className={cn(
                                "pl-10 pr-10 h-11",
                                errors.signinPassword && "border-destructive focus-visible:ring-destructive"
                              )}
                              value={signInForm.password}
                              onChange={(e) => {
                                setSignInForm({...signInForm, password: e.target.value});
                                if (errors.signinPassword) setErrors(prev => ({ ...prev, signinPassword: '' }));
                              }}
                              required
                              maxLength={128}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                          {errors.signinPassword && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {errors.signinPassword}
                            </p>
                          )}
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full h-11 group" 
                          disabled={isLoading || loading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Connexion...
                            </>
                          ) : (
                            <>
                              Se connecter
                              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </Button>
                      </form>
                    </motion.div>
                  </TabsContent>

                  {/* Sign Up Tab */}
                  <TabsContent value="signup" className="space-y-4 mt-0">
                    <motion.div
                      key="signup"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Google Auth */}
                      <GoogleAuthButton mode="signup" className="w-full h-11" />
                      
                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">
                            ou par email
                          </span>
                        </div>
                      </div>

                      <form onSubmit={handleSignUp} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">Prénom</Label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <SecureInput
                                id="firstName"
                                placeholder="Jean"
                                className={cn(
                                  "pl-10 h-10",
                                  errors.firstName && "border-destructive"
                                )}
                                value={signUpForm.firstName}
                                onChange={(e) => {
                                  setSignUpForm({...signUpForm, firstName: e.target.value});
                                  if (errors.firstName) setErrors(prev => ({ ...prev, firstName: '' }));
                                }}
                                required
                                maxLength={50}
                              />
                            </div>
                            {errors.firstName && (
                              <p className="text-xs text-destructive">{errors.firstName}</p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Nom</Label>
                            <SecureInput
                              id="lastName"
                              placeholder="Dupont"
                              className={cn(
                                "h-10",
                                errors.lastName && "border-destructive"
                              )}
                              value={signUpForm.lastName}
                              onChange={(e) => {
                                setSignUpForm({...signUpForm, lastName: e.target.value});
                                if (errors.lastName) setErrors(prev => ({ ...prev, lastName: '' }));
                              }}
                              required
                              maxLength={50}
                            />
                            {errors.lastName && (
                              <p className="text-xs text-destructive">{errors.lastName}</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="company" className="flex items-center gap-1">
                            Entreprise
                            <span className="text-xs text-muted-foreground">(optionnel)</span>
                          </Label>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <SecureInput
                              id="company"
                              placeholder="Nom de votre entreprise"
                              className="pl-10 h-10"
                              value={signUpForm.company}
                              onChange={(e) => setSignUpForm({...signUpForm, company: e.target.value})}
                              maxLength={100}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signup-email">Email professionnel</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <SecureInput
                              id="signup-email"
                              type="email"
                              placeholder="vous@entreprise.com"
                              className={cn(
                                "pl-10 h-10",
                                errors.signupEmail && "border-destructive"
                              )}
                              value={signUpForm.email}
                              onChange={(e) => {
                                setSignUpForm({...signUpForm, email: e.target.value});
                                if (errors.signupEmail) setErrors(prev => ({ ...prev, signupEmail: '' }));
                              }}
                              required
                              maxLength={254}
                            />
                            {signUpForm.email && validateEmail(signUpForm.email) && (
                              <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                            )}
                          </div>
                          {errors.signupEmail && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {errors.signupEmail}
                            </p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="signup-password">Mot de passe</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <SecureInput
                              id="signup-password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Min. 6 caractères"
                              className={cn(
                                "pl-10 pr-10 h-10",
                                errors.signupPassword && "border-destructive"
                              )}
                              value={signUpForm.password}
                              onChange={(e) => {
                                setSignUpForm({...signUpForm, password: e.target.value});
                                if (errors.signupPassword) setErrors(prev => ({ ...prev, signupPassword: '' }));
                              }}
                              required
                              maxLength={128}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                          
                          {/* Password Strength Indicator */}
                          {signUpForm.password && (
                            <div className="space-y-1.5">
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((level) => (
                                  <div
                                    key={level}
                                    className={cn(
                                      "h-1 flex-1 rounded-full transition-colors",
                                      level <= passwordStrength.score ? passwordStrength.color : 'bg-muted'
                                    )}
                                  />
                                ))}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Force: <span className={cn(
                                  passwordStrength.score <= 1 && "text-destructive",
                                  passwordStrength.score > 1 && passwordStrength.score <= 3 && "text-yellow-500",
                                  passwordStrength.score > 3 && "text-green-500"
                                )}>{passwordStrength.label}</span>
                              </p>
                            </div>
                          )}
                          
                          {errors.signupPassword && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {errors.signupPassword}
                            </p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <SecureInput
                              id="confirm-password"
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              className={cn(
                                "pl-10 pr-10 h-10",
                                errors.confirmPassword && "border-destructive"
                              )}
                              value={signUpForm.confirmPassword}
                              onChange={(e) => {
                                setSignUpForm({...signUpForm, confirmPassword: e.target.value});
                                if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
                              }}
                              required
                              maxLength={128}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            {signUpForm.confirmPassword && signUpForm.password === signUpForm.confirmPassword && (
                              <CheckCircle2 className="absolute right-9 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                            )}
                          </div>
                          {errors.confirmPassword && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {errors.confirmPassword}
                            </p>
                          )}
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full h-11 group" 
                          disabled={isLoading || loading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Création du compte...
                            </>
                          ) : (
                            <>
                              Créer mon compte gratuit
                              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </Button>
                        
                        <p className="text-xs text-center text-muted-foreground">
                          En créant un compte, vous acceptez nos{' '}
                          <Link to="/terms" className="text-primary hover:underline">
                            conditions d'utilisation
                          </Link>
                          {' '}et notre{' '}
                          <Link to="/privacy" className="text-primary hover:underline">
                            politique de confidentialité
                          </Link>
                        </p>
                      </form>
                    </motion.div>
                  </TabsContent>
                </AnimatePresence>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* Back to Home */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            <Link to="/" className="hover:text-primary transition-colors">
              ← Retour à l'accueil
            </Link>
          </p>
        </motion.div>
      </div>

      <ForgotPasswordModal
        open={showForgotModal}
        onOpenChange={setShowForgotModal}
      />
    </div>
  );
};
