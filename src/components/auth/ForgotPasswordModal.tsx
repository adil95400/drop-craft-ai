/**
 * Modal ultra-pro pour la réinitialisation du mot de passe
 * Avec animations, états visuels riches et UX premium
 */
import React, { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Mail, CheckCircle2, ArrowLeft, ShieldCheck, KeyRound, AlertCircle, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ForgotPasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ModalStep = 'form' | 'sending' | 'success' | 'error'

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export function ForgotPasswordModal({ open, onOpenChange }: ForgotPasswordModalProps) {
  const { resetPassword } = useAuth()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [step, setStep] = useState<ModalStep>('form')
  const [errorMessage, setErrorMessage] = useState('')
  const [emailError, setEmailError] = useState('')

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      setEmailError('Veuillez entrer votre adresse email')
      return
    }
    if (!validateEmail(email)) {
      setEmailError('Adresse email invalide')
      return
    }

    setStep('sending')

    try {
      const { error } = await resetPassword(email)

      if (error) {
        setErrorMessage(error.message || 'Une erreur est survenue')
        setStep('error')
      } else {
        setStep('success')
      }
    } catch {
      setErrorMessage('Une erreur inattendue s\'est produite')
      setStep('error')
    }
  }, [email, resetPassword])

  const handleClose = useCallback(() => {
    setEmail('')
    setStep('form')
    setErrorMessage('')
    setEmailError('')
    onOpenChange(false)
  }, [onOpenChange])

  const handleRetry = useCallback(() => {
    setStep('form')
    setErrorMessage('')
  }, [])

  const fadeVariants = {
    initial: { opacity: 0, y: 12, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const } },
    exit: { opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.2 } },
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[440px] p-0 gap-0 overflow-hidden border-border bg-background">
        {/* Animated Header */}
        <div className={cn(
          "relative px-6 pt-8 pb-6 transition-colors duration-500",
          step === 'success' && "bg-success-light dark:bg-success/10",
          step === 'error' && "bg-destructive/5",
          (step === 'form' || step === 'sending') && "bg-primary/5"
        )}>
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-primary/5 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full bg-primary/5 translate-y-1/2 -translate-x-1/2" />

          <AnimatePresence mode="wait">
            {step === 'form' && (
              <motion.div key="form-header" {...fadeVariants} className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <KeyRound className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Mot de passe oublié ?</h2>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  Pas de panique ! Entrez votre email et nous vous enverrons un lien sécurisé pour le réinitialiser.
                </p>
              </motion.div>
            )}

            {step === 'sending' && (
              <motion.div key="sending-header" {...fadeVariants} className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Loader2 className="h-7 w-7 text-primary" />
                  </motion.div>
                </div>
                <h2 className="text-xl font-bold text-foreground">Envoi en cours...</h2>
                <p className="text-sm text-muted-foreground mt-1.5">
                  Nous préparons votre lien de réinitialisation
                </p>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div key="success-header" {...fadeVariants} className="relative z-10">
                <motion.div
                  className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
                >
                  <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
                </motion.div>
                <h2 className="text-xl font-bold text-foreground">Email envoyé ! ✉️</h2>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  Un lien de réinitialisation a été envoyé à <span className="font-semibold text-foreground">{email}</span>
                </p>
              </motion.div>
            )}

            {step === 'error' && (
              <motion.div key="error-header" {...fadeVariants} className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
                  <AlertCircle className="h-7 w-7 text-destructive" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Oups, une erreur</h2>
                <p className="text-sm text-muted-foreground mt-1.5">{errorMessage}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 pt-5">
          <AnimatePresence mode="wait">
            {step === 'form' && (
              <motion.form
                key="form-content"
                onSubmit={handleSubmit}
                className="space-y-5"
                {...fadeVariants}
              >
                <div className="space-y-1.5">
                  <Label htmlFor="reset-email" className="text-sm font-medium text-foreground">
                    Adresse e-mail
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="vous@exemple.com"
                      className={cn(
                        "pl-10 h-11 border-border focus:border-primary focus:ring-primary placeholder:text-muted-foreground/60",
                        emailError && "border-destructive focus:border-destructive"
                      )}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (emailError) setEmailError('')
                      }}
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                  {emailError && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-xs text-destructive flex items-center gap-1"
                    >
                      <AlertCircle className="h-3 w-3" />
                      {emailError}
                    </motion.p>
                  )}
                </div>

                {/* Security badge */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                  <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Le lien expirera après 1 heure. Votre compte reste sécurisé.
                  </p>
                </div>

                <div className="flex gap-3 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1 h-11 border-border"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1.5" />
                    Retour
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm"
                    disabled={!email.trim()}
                  >
                    <Send className="h-4 w-4 mr-1.5" />
                    Envoyer
                  </Button>
                </div>
              </motion.form>
            )}

            {step === 'sending' && (
              <motion.div key="sending-content" {...fadeVariants} className="py-4">
                <div className="space-y-3">
                  {['Vérification de l\'adresse...', 'Génération du lien sécurisé...', 'Envoi de l\'email...'].map((text, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.4, duration: 0.3 }}
                      className="flex items-center gap-3"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.4 + 0.2, type: 'spring', stiffness: 400 }}
                        className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center"
                      >
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </motion.div>
                      <span className="text-sm text-muted-foreground">{text}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div key="success-content" {...fadeVariants} className="space-y-5">
                {/* Steps */}
                <div className="space-y-3">
                  {[
                    { num: '1', text: 'Ouvrez votre boîte de réception' },
                    { num: '2', text: 'Cliquez sur le lien de réinitialisation' },
                    { num: '3', text: 'Choisissez votre nouveau mot de passe' },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.1, duration: 0.25 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                        {item.num}
                      </div>
                      <span className="text-sm text-foreground">{item.text}</span>
                    </motion.div>
                  ))}
                </div>

                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    💡 Vérifiez aussi vos <span className="font-medium text-foreground">spams</span> si vous ne trouvez pas l'email.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleRetry}
                    className="flex-1 h-11 border-border"
                  >
                    Renvoyer l'email
                  </Button>
                  <Button
                    onClick={handleClose}
                    className="flex-1 h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  >
                    Compris !
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 'error' && (
              <motion.div key="error-content" {...fadeVariants} className="space-y-4">
                <div className="flex gap-3 pt-1">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1 h-11 border-border"
                  >
                    Fermer
                  </Button>
                  <Button
                    onClick={handleRetry}
                    className="flex-1 h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  >
                    Réessayer
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}
