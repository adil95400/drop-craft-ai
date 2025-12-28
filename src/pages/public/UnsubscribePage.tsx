import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { CheckCircle, XCircle, Loader2, Mail, ArrowLeft } from 'lucide-react'
import { Helmet } from 'react-helmet-async'

type UnsubscribeStatus = 'loading' | 'form' | 'success' | 'error' | 'already_unsubscribed'

const UNSUBSCRIBE_REASONS = [
  { value: 'too_frequent', label: "Je reçois trop d'emails" },
  { value: 'not_relevant', label: "Le contenu n'est pas pertinent pour moi" },
  { value: 'never_subscribed', label: "Je ne me suis jamais inscrit" },
  { value: 'other', label: 'Autre raison' }
]

export default function UnsubscribePage() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<UnsubscribeStatus>('loading')
  const [reason, setReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const token = searchParams.get('token')
  const emailParam = searchParams.get('email')
  const campaignId = searchParams.get('campaign')

  useEffect(() => {
    const checkSubscription = async () => {
      if (!emailParam) {
        setStatus('error')
        return
      }

      setEmail(decodeURIComponent(emailParam))

      try {
        // Check if already unsubscribed
        const { data: existing } = await supabase
          .from('email_unsubscribes')
          .select('id')
          .eq('email', decodeURIComponent(emailParam))
          .maybeSingle()

        if (existing) {
          setStatus('already_unsubscribed')
        } else {
          setStatus('form')
        }
      } catch (error) {
        console.error('Error checking subscription:', error)
        setStatus('form')
      }
    }

    checkSubscription()
  }, [emailParam])

  const handleUnsubscribe = async () => {
    if (!email) return

    setIsSubmitting(true)
    try {
      const finalReason = reason === 'other' ? customReason : UNSUBSCRIBE_REASONS.find(r => r.value === reason)?.label

      // Get user_id from campaign if available
      let userId: string | null = null
      if (campaignId) {
        const { data: campaign } = await supabase
          .from('email_campaigns')
          .select('user_id')
          .eq('id', campaignId)
          .maybeSingle()
        userId = campaign?.user_id || null
      }

      // If no campaign, try to find from recent sending logs
      if (!userId) {
        const { data: log } = await supabase
          .from('email_sending_logs')
          .select('user_id')
          .eq('recipient_email', email)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        userId = log?.user_id || null
      }

      if (!userId) {
        throw new Error('Could not identify sender')
      }

      await supabase.from('email_unsubscribes').insert({
        email,
        reason: finalReason || null,
        campaign_id: campaignId || null,
        user_id: userId
      })

      setStatus('success')
    } catch (error) {
      console.error('Unsubscribe error:', error)
      setStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Désinscription | Gérer vos préférences email</title>
        <meta name="description" content="Gérez vos préférences d'abonnement aux emails." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Gestion des emails</CardTitle>
            <CardDescription>
              Gérez vos préférences d'abonnement
            </CardDescription>
          </CardHeader>

          <CardContent>
            {status === 'loading' && (
              <div className="flex flex-col items-center py-8 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Chargement...</p>
              </div>
            )}

            {status === 'form' && (
              <div className="space-y-6">
                <p className="text-center text-muted-foreground">
                  Vous êtes sur le point de vous désinscrire de notre liste d'envoi pour:
                </p>
                <p className="text-center font-medium">{email}</p>

                <div className="space-y-4">
                  <Label>Pourquoi souhaitez-vous vous désinscrire ? (optionnel)</Label>
                  <RadioGroup value={reason} onValueChange={setReason}>
                    {UNSUBSCRIBE_REASONS.map((r) => (
                      <div key={r.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={r.value} id={r.value} />
                        <Label htmlFor={r.value} className="font-normal cursor-pointer">
                          {r.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>

                  {reason === 'other' && (
                    <Textarea
                      placeholder="Dites-nous pourquoi..."
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      className="mt-2"
                    />
                  )}
                </div>

                <Button 
                  onClick={handleUnsubscribe} 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Désinscription...
                    </>
                  ) : (
                    'Confirmer la désinscription'
                  )}
                </Button>
              </div>
            )}

            {status === 'success' && (
              <div className="flex flex-col items-center py-8 space-y-4">
                <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold">Désinscription confirmée</h3>
                <p className="text-center text-muted-foreground">
                  Vous avez été désinscrit avec succès. Vous ne recevrez plus d'emails de notre part.
                </p>
              </div>
            )}

            {status === 'already_unsubscribed' && (
              <div className="flex flex-col items-center py-8 space-y-4">
                <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold">Déjà désinscrit</h3>
                <p className="text-center text-muted-foreground">
                  Cet email est déjà désinscrit de notre liste d'envoi.
                </p>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center py-8 space-y-4">
                <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold">Erreur</h3>
                <p className="text-center text-muted-foreground">
                  Une erreur est survenue. Veuillez réessayer ou contacter le support.
                </p>
              </div>
            )}

            <div className="mt-6 pt-4 border-t">
              <Link to="/">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour à l'accueil
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
