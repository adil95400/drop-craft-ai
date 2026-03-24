/**
 * Interface d'authentification optimisée
 * Design moderne avec formulaire à gauche et carrousel à droite
 * Support i18n, dark mode, tokens sémantiques, password strength
 */
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ChevronLeft, ChevronRight, AlertCircle, Check, Shield, Zap, BarChart3, Package } from 'lucide-react';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { cn } from '@/lib/utils';

// Import assets
import shopOptiLogo from '@/assets/logo-shopopti.png';
import dashboardPreview1 from '@/assets/dashboard-preview-1.jpg';
import dashboardPreview2 from '@/assets/dashboard-preview-2.jpg';
import dashboardPreview3 from '@/assets/dashboard-preview-3.jpg';

// Validation helpers
const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Faible', color: 'bg-red-500' };
  if (score <= 2) return { score, label: 'Moyen', color: 'bg-orange-500' };
  if (score <= 3) return { score, label: 'Bon', color: 'bg-yellow-500' };
  return { score, label: 'Excellent', color: 'bg-green-500' };
};

// Carousel slides
const slides = [
  {
    title: "Optimisez vos performances publicitaires",
    description: "Analysez vos campagnes en temps réel et identifiez les opportunités d'amélioration pour maximiser votre ROI.",
    image: dashboardPreview1,
    icon: BarChart3,
  },
  {
    title: "Gérez vos produits facilement",
    description: "Synchronisez automatiquement vos produits avec vos fournisseurs et gérez vos stocks en temps réel.",
    image: dashboardPreview2,
    icon: Package,
  },
  {
    title: "Intelligence artificielle intégrée",
    description: "Laissez notre IA optimiser vos fiches produits et générer du contenu SEO performant.",
    image: dashboardPreview3,
    icon: Zap,
  }
];

const features = [
  { icon: Shield, text: "Données sécurisées et cryptées" },
  { icon: Zap, text: "IA intégrée pour booster vos ventes" },
  { icon: BarChart3, text: "Analytics avancées en temps réel" },
  { icon: Package, text: "Gestion multi-boutiques centralisée" },
];

export const AuthInterface = () => {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Auto-rotate slides
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const nextSlide = useCallback(() => setCurrentSlide((prev) => (prev + 1) % slides.length), []);
  const prevSlide = useCallback(() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length), []);

  const passwordStrength = useMemo(() => getPasswordStrength(form.password), [form.password]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!form.email) {
      newErrors.email = 'Email requis';
    } else if (!validateEmail(form.email)) {
      newErrors.email = 'Adresse email invalide';
    }

    if (!form.password) {
      newErrors.password = 'Mot de passe requis';
    } else if (form.password.length < 6) {
      newErrors.password = 'Minimum 6 caractères';
    }

    if (!isLogin) {
      if (!form.fullName?.trim()) {
        newErrors.fullName = 'Nom complet requis';
      }
      if (form.password !== form.confirmPassword) {
        newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form, isLogin]);

  const updateField = useCallback((field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  }, [errors]);

  const handleBlur = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(form.email, form.password);
        if (error) {
          const errorMessage = error.message?.includes('Invalid login credentials')
            ? 'Email ou mot de passe incorrect'
            : error.message || 'Erreur de connexion';
          toast({ title: "Erreur de connexion", description: errorMessage, variant: "destructive" });
        } else {
          toast({ title: "Connexion réussie ! 🎉", description: "Bienvenue dans votre espace ShopOpti" });
        }
      } else {
        const { error } = await signUp(form.email, form.password, { full_name: form.fullName });
        if (error) {
          const errorMessage = error.message?.includes('already registered')
            ? 'Cet email est déjà utilisé'
            : error.message || "Erreur d'inscription";
          toast({ title: "Erreur d'inscription", description: errorMessage, variant: "destructive" });
        } else {
          toast({
            title: "Inscription réussie ! 🎉",
            description: "Vérifiez votre email pour confirmer votre compte.",
          });
        }
      }
    } catch {
      toast({ title: "Erreur", description: "Une erreur inattendue s'est produite", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la connexion avec Google",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Side - Form */}
      <div className="w-full lg:w-[55%] xl:w-1/2 flex flex-col">
        {/* Logo Header */}
        <div className="p-6 lg:p-8">
          <img
            src={shopOptiLogo}
            alt="ShopOpti+"
            className="h-[120px] w-[160px] object-contain mx-auto lg:mx-0"
          />
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-6 lg:px-16 xl:px-20 pb-8">
          <div className="w-full max-w-[440px]">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              {/* Title & Subtitle */}
              <div className="mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                  {isLogin ? 'Bon retour ! 👋' : 'Créez votre compte'}
                </h1>
                <p className="text-muted-foreground mt-2 text-sm">
                  {isLogin
                    ? 'Connectez-vous pour accéder à votre tableau de bord'
                    : 'Rejoignez +5 000 e-commerçants qui boostent leurs ventes'}
                </p>
              </div>

              {/* Google Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-border text-foreground hover:bg-accent font-normal text-sm"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <svg className="w-5 h-5 mr-3 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuer avec Google
              </Button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-background text-xs text-muted-foreground uppercase tracking-wider">ou par email</span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name (Signup only) */}
                <AnimatePresence>
                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Label htmlFor="fullName" className="text-foreground text-sm font-medium">
                        Nom complet
                      </Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Jean Dupont"
                        value={form.fullName}
                        onChange={(e) => updateField('fullName', e.target.value)}
                        onBlur={() => handleBlur('fullName')}
                        className={cn(
                          "mt-1.5 h-11 border-border focus:border-primary focus:ring-primary placeholder:text-muted-foreground/60",
                          touched.fullName && errors.fullName && "border-destructive focus:border-destructive"
                        )}
                        disabled={isLoading}
                        autoComplete="name"
                      />
                      {touched.fullName && errors.fullName && (
                        <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.fullName}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email */}
                <div>
                  <Label htmlFor="email" className="text-foreground text-sm font-medium">
                    Adresse e-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="vous@exemple.com"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    className={cn(
                      "mt-1.5 h-11 border-border focus:border-primary focus:ring-primary placeholder:text-muted-foreground/60",
                      touched.email && errors.email && "border-destructive focus:border-destructive"
                    )}
                    disabled={isLoading}
                    autoComplete="email"
                  />
                  {touched.email && errors.email && (
                    <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <Label htmlFor="password" className="text-foreground text-sm font-medium">
                    Mot de passe
                  </Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      onBlur={() => handleBlur('password')}
                      className={cn(
                        "h-11 border-border focus:border-primary focus:ring-primary pr-10 placeholder:text-muted-foreground/60",
                        touched.password && errors.password && "border-destructive focus:border-destructive"
                      )}
                      disabled={isLoading}
                      autoComplete={isLogin ? "current-password" : "new-password"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {touched.password && errors.password && (
                    <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.password}
                    </p>
                  )}

                  {/* Password Strength (Signup only) */}
                  {!isLogin && form.password.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={cn(
                              "h-1 flex-1 rounded-full transition-colors",
                              passwordStrength.score >= level ? passwordStrength.color : "bg-muted"
                            )}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Force : <span className="font-medium">{passwordStrength.label}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password (Signup only) */}
                <AnimatePresence>
                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Label htmlFor="confirmPassword" className="text-foreground text-sm font-medium">
                        Confirmer le mot de passe
                      </Label>
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={form.confirmPassword}
                        onChange={(e) => updateField('confirmPassword', e.target.value)}
                        onBlur={() => handleBlur('confirmPassword')}
                        className={cn(
                          "mt-1.5 h-11 border-border focus:border-primary focus:ring-primary placeholder:text-muted-foreground/60",
                          touched.confirmPassword && errors.confirmPassword && "border-destructive focus:border-destructive"
                        )}
                        disabled={isLoading}
                        autoComplete="new-password"
                      />
                      {form.confirmPassword && form.password === form.confirmPassword && (
                        <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                          <Check className="h-3 w-3" />
                          Les mots de passe correspondent
                        </p>
                      )}
                      {touched.confirmPassword && errors.confirmPassword && (
                        <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.confirmPassword}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Remember me & Forgot password (Login only) */}
                {isLogin && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                        className="border-border"
                      />
                      <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer select-none">
                        Se souvenir de moi
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                )}

                {/* Terms (Signup only) */}
                {!isLogin && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    En créant un compte, vous acceptez nos{' '}
                    <a href="/terms" className="text-primary hover:underline">Conditions d'utilisation</a>
                    {' '}et notre{' '}
                    <a href="/privacy" className="text-primary hover:underline">Politique de confidentialité</a>.
                  </p>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-sm"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      {isLogin ? 'Connexion...' : 'Création du compte...'}
                    </div>
                  ) : (
                    isLogin ? 'Se connecter' : "Créer mon compte gratuitement"
                  )}
                </Button>
              </form>

              {/* Toggle Auth Mode */}
              <p className="mt-6 text-center text-muted-foreground text-sm">
                {isLogin ? 'Nouveau sur ShopOpti+ ?' : 'Déjà un compte ?'}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setErrors({});
                    setTouched({});
                  }}
                  className="text-primary hover:underline font-semibold"
                >
                  {isLogin ? 'Créer un compte gratuit' : 'Se connecter'}
                </button>
              </p>

              {/* Trust Badges */}
              {isLogin && (
                <div className="mt-8 pt-6 border-t border-border">
                  <div className="flex items-center justify-center gap-6 text-muted-foreground">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Shield className="h-3.5 w-3.5 text-green-600" />
                      <span>SSL sécurisé</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <Check className="h-3.5 w-3.5 text-green-600" />
                      <span>RGPD conforme</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <Zap className="h-3.5 w-3.5 text-primary" />
                      <span>Essai gratuit</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Right Side - Carousel */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 bg-primary flex-col items-center justify-center p-8 xl:p-12 relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-40 h-40 rounded-full bg-primary-foreground/5" />
          <div className="absolute bottom-20 right-10 w-56 h-56 rounded-full bg-primary-foreground/5" />
          <div className="absolute top-1/3 right-1/4 w-28 h-28 rounded-full bg-primary-foreground/10" />
          <div className="absolute bottom-1/3 left-1/4 w-20 h-20 rounded-full bg-primary-foreground/5" />
        </div>

        <div className="relative z-10 w-full max-w-lg">
          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute -left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-primary-foreground/30 hover:bg-primary-foreground/10 flex items-center justify-center text-primary-foreground transition-colors z-20"
            aria-label="Slide précédent"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute -right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-primary-foreground/30 hover:bg-primary-foreground/10 flex items-center justify-center text-primary-foreground transition-colors z-20"
            aria-label="Slide suivant"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Slide Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="text-center px-4"
            >
              {/* Dashboard Image */}
              <div className="mb-8 mx-auto max-w-lg">
                <img
                  src={slides[currentSlide].image}
                  alt={slides[currentSlide].title}
                  className="w-full rounded-2xl shadow-2xl"
                  loading="lazy"
                />
              </div>

              {/* Dots */}
              <div className="flex justify-center gap-2 mb-6">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      index === currentSlide
                        ? 'bg-primary-foreground w-6'
                        : 'bg-primary-foreground/40 w-2'
                    )}
                    aria-label={`Aller au slide ${index + 1}`}
                  />
                ))}
              </div>

              {/* Text Content */}
              <h2 className="text-2xl xl:text-3xl font-bold text-primary-foreground mb-3 leading-tight">
                {slides[currentSlide].title}
              </h2>
              <p className="text-primary-foreground/80 text-base leading-relaxed max-w-md mx-auto">
                {slides[currentSlide].description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Feature List */}
          <div className="mt-10 grid grid-cols-2 gap-3 max-w-md mx-auto">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-primary-foreground/90">
                <feature.icon className="h-4 w-4 shrink-0" />
                <span className="text-xs">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Social Proof */}
          <div className="mt-8 text-center">
            <p className="text-primary-foreground/60 text-xs">
              Utilisé par +5 000 e-commerçants dans 30+ pays
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        open={showForgotModal}
        onOpenChange={setShowForgotModal}
      />
    </div>
  );
};

export default AuthInterface;
