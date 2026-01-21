/**
 * Interface d'authentification épurée
 * Design inspiré de Channable avec formulaire à gauche et carrousel à droite
 */
import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { cn } from '@/lib/utils';

// Import assets
import shopOptiLogo from '@/assets/logo.svg';
import dashboardPreview1 from '@/assets/dashboard-preview-1.jpg';
import dashboardPreview2 from '@/assets/dashboard-preview-2.jpg';
import dashboardPreview3 from '@/assets/dashboard-preview-3.jpg';

// Validation helpers
const validateEmail = (email: string) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Carousel slides with real dashboard images
const slides = [
  {
    title: "Optimisez vos performances publicitaires",
    description: "Analysez vos campagnes en temps réel et identifiez les opportunités d'amélioration pour maximiser votre ROI.",
    image: dashboardPreview1,
  },
  {
    title: "Gérez vos produits facilement",
    description: "Synchronisez automatiquement vos produits avec vos fournisseurs et gérez vos stocks en temps réel.",
    image: dashboardPreview2,
  },
  {
    title: "Intelligence artificielle intégrée",
    description: "Laissez notre IA optimiser vos fiches produits et générer du contenu SEO performant.",
    image: dashboardPreview3,
  }
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
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-rotate slides
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    if (!form.email) {
      newErrors.email = 'Email requis';
    } else if (!validateEmail(form.email)) {
      newErrors.email = 'Email invalide';
    }
    
    if (!form.password) {
      newErrors.password = 'Mot de passe requis';
    } else if (form.password.length < 6) {
      newErrors.password = 'Minimum 6 caractères';
    }

    if (!isLogin && form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form, isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      if (isLogin) {
        const { error } = await signIn(form.email, form.password);
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
      } else {
        const { error } = await signUp(form.email, form.password, {});
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
            description: "Bienvenue sur ShopOpti !"
          });
        }
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
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col">
        {/* Logo Header */}
        <div className="p-6 lg:p-10 flex justify-center">
          <img 
            src={shopOptiLogo} 
            alt="ShopOpti+" 
            className="h-[150px] w-[200px] object-contain"
          />
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-6 lg:px-16 pb-8">
          <div className="w-full max-w-[420px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Title */}
              <h1 className="text-2xl font-semibold text-gray-900 text-center mb-8">
                {isLogin ? 'Se connecter' : 'Créer un compte'}
              </h1>

              {/* Google Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 text-gray-700 border-gray-300 hover:bg-gray-50 font-normal"
                onClick={handleGoogleSignIn}
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Se connecter avec Google
              </Button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-white text-sm text-gray-500">OU</span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div>
                  <Label htmlFor="email" className="text-gray-700 font-normal text-sm">
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ex : email@exemple.com"
                    value={form.email}
                    onChange={(e) => {
                      setForm({ ...form, email: e.target.value });
                      if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                    }}
                    className={cn(
                      "mt-1.5 h-12 border-gray-300 focus:border-[#00B8D4] focus:ring-[#00B8D4] placeholder:text-gray-400",
                      errors.email && "border-red-500 focus:border-red-500 focus:ring-red-500"
                    )}
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <Label htmlFor="password" className="text-gray-700 font-normal text-sm">
                    Mot de passe
                  </Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="ex : **********"
                      value={form.password}
                      onChange={(e) => {
                        setForm({ ...form, password: e.target.value });
                        if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                      }}
                      className={cn(
                        "h-12 border-gray-300 focus:border-[#00B8D4] focus:ring-[#00B8D4] pr-10 placeholder:text-gray-400",
                        errors.password && "border-red-500 focus:border-red-500 focus:ring-red-500"
                      )}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.password}
                    </p>
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
                      <Label htmlFor="confirmPassword" className="text-gray-700 font-normal text-sm">
                        Confirmer le mot de passe
                      </Label>
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="ex : **********"
                        value={form.confirmPassword}
                        onChange={(e) => {
                          setForm({ ...form, confirmPassword: e.target.value });
                          if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
                        }}
                        className={cn(
                          "mt-1.5 h-12 border-gray-300 focus:border-[#00B8D4] focus:ring-[#00B8D4] placeholder:text-gray-400",
                          errors.confirmPassword && "border-red-500 focus:border-red-500 focus:ring-red-500"
                        )}
                        disabled={isLoading}
                      />
                      {errors.confirmPassword && (
                        <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
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
                        className="border-gray-300"
                      />
                      <label
                        htmlFor="remember"
                        className="text-sm text-gray-600 cursor-pointer select-none"
                      >
                        Maintenir ma connexion
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-sm text-[#00B8D4] hover:underline"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-[#00B8D4] hover:bg-[#00A0BC] text-white font-medium text-base"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {isLogin ? 'Connexion...' : 'Inscription...'}
                    </div>
                  ) : (
                    isLogin ? 'Connexion' : "S'inscrire"
                  )}
                </Button>
              </form>

              {/* Toggle Auth Mode */}
              <p className="mt-6 text-center text-gray-600 text-sm">
                {isLogin ? 'Nouveau sur ShopOpti+ ?' : 'Déjà un compte ?'}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setErrors({});
                  }}
                  className="text-[#00B8D4] hover:underline font-medium"
                >
                  {isLogin ? 'Créer un compte' : 'Se connecter'}
                </button>
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Right Side - Carousel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#00B8D4] flex-col items-center justify-center p-8 xl:p-12 relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-white/5" />
          <div className="absolute bottom-32 right-10 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute top-1/3 right-1/4 w-24 h-24 rounded-full bg-white/10" />
        </div>

        <div className="relative z-10 w-full max-w-lg">
          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute -left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-white/30 hover:bg-white/10 flex items-center justify-center text-white transition-colors z-20"
            aria-label="Slide précédent"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute -right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-white/30 hover:bg-white/10 flex items-center justify-center text-white transition-colors z-20"
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
              {/* Real Dashboard Image */}
              <div className="mb-8 mx-auto max-w-lg">
                <img 
                  src={slides[currentSlide].image}
                  alt={slides[currentSlide].title}
                  className="w-full rounded-2xl shadow-2xl"
                />
              </div>

              {/* Dots */}
              <div className="flex justify-center gap-2 mb-6">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={cn(
                      "w-2.5 h-2.5 rounded-full transition-colors",
                      index === currentSlide ? 'bg-white' : 'bg-white/40'
                    )}
                    aria-label={`Aller au slide ${index + 1}`}
                  />
                ))}
              </div>

              {/* Text Content */}
              <h2 className="text-2xl xl:text-3xl font-bold text-white mb-4 leading-tight">
                {slides[currentSlide].title}
              </h2>
              <p className="text-white/90 text-base leading-relaxed max-w-md mx-auto">
                {slides[currentSlide].description}
              </p>
            </motion.div>
          </AnimatePresence>
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
