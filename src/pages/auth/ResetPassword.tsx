/**
 * Page de réinitialisation du mot de passe
 * Accessible via le lien envoyé par email
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Eye, EyeOff, KeyRound, CheckCircle2, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Helmet } from 'react-helmet-async';

const getPasswordStrength = (password: string) => {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Faible', colorClass: 'bg-destructive' };
  if (score <= 2) return { score, label: 'Moyen', colorClass: 'bg-warning' };
  if (score <= 3) return { score, label: 'Bon', colorClass: 'bg-chart-3' };
  return { score, label: 'Excellent', colorClass: 'bg-success' };
};

type PageState = 'loading' | 'form' | 'success' | 'error';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [state, setState] = useState<PageState>('loading');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  useEffect(() => {
    // Check for recovery session from URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    if (type === 'recovery' && accessToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      }).then(({ error }) => {
        if (error) {
          setState('error');
        } else {
          setState('form');
        }
      });
    } else {
      // Also check URL search params (alternative format)
      const searchParams = new URLSearchParams(window.location.search);
      const searchType = searchParams.get('type');
      if (searchType === 'recovery') {
        setState('form');
      } else {
        setState('error');
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!password) newErrors.password = 'Mot de passe requis';
    else if (password.length < 6) newErrors.password = 'Minimum 6 caractères';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      } else {
        setState('success');
        toast({ title: 'Mot de passe mis à jour ! 🎉' });
      }
    } catch {
      toast({ title: 'Erreur', description: 'Une erreur inattendue s\'est produite', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Réinitialiser le mot de passe - ShopOpti Pro</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="border-border bg-card shadow-lg">
            <CardContent className="p-8">
              {state === 'loading' && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm">Vérification du lien...</p>
                </div>
              )}

              {state === 'form' && (
                <div>
                  <div className="flex flex-col items-center mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                      <KeyRound className="h-7 w-7 text-primary" />
                    </div>
                    <h1 className="text-xl font-bold text-foreground">Nouveau mot de passe</h1>
                    <p className="text-sm text-muted-foreground mt-1.5 text-center">
                      Choisissez un mot de passe fort et sécurisé
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="new-password" className="text-sm font-medium text-foreground">
                        Nouveau mot de passe
                      </Label>
                      <div className="relative mt-1.5">
                        <Input
                          id="new-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                          }}
                          className={cn(
                            'h-11 pr-10 border-border focus:border-primary',
                            errors.password && 'border-destructive'
                          )}
                          autoComplete="new-password"
                          autoFocus
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
                      {errors.password && (
                        <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" />{errors.password}
                        </p>
                      )}

                      {password.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((level) => (
                              <div
                                key={level}
                                className={cn(
                                  'h-1 flex-1 rounded-full transition-colors',
                                  strength.score >= level ? strength.colorClass : 'bg-muted'
                                )}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Force : <span className="font-medium">{strength.label}</span>
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
                        Confirmer le mot de passe
                      </Label>
                      <Input
                        id="confirm-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
                        }}
                        className={cn(
                          'mt-1.5 h-11 border-border focus:border-primary',
                          errors.confirmPassword && 'border-destructive'
                        )}
                        autoComplete="new-password"
                      />
                      {confirmPassword && password === confirmPassword && (
                        <p className="text-xs text-success flex items-center gap-1 mt-1">
                          <CheckCircle2 className="h-3 w-3" />Les mots de passe correspondent
                        </p>
                      )}
                      {errors.confirmPassword && (
                        <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" />{errors.confirmPassword}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                      <ShieldCheck className="h-4 w-4 text-success shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        Votre mot de passe est chiffré et ne sera jamais stocké en clair.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          Mise à jour...
                        </div>
                      ) : (
                        <>Mettre à jour le mot de passe</>
                      )}
                    </Button>
                  </form>
                </div>
              )}

              {state === 'success' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4"
                  >
                    <CheckCircle2 className="h-8 w-8 text-success" />
                  </motion.div>
                  <h2 className="text-xl font-bold text-foreground mb-2">Mot de passe mis à jour !</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
                  </p>
                  <Button
                    onClick={() => navigate('/auth')}
                    className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  >
                    Se connecter <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              )}

              {state === 'error' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-4"
                >
                  <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-2">Lien invalide ou expiré</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Ce lien de réinitialisation n'est plus valide. Veuillez en demander un nouveau.
                  </p>
                  <Button
                    onClick={() => navigate('/auth')}
                    className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  >
                    Retour à la connexion
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
}
