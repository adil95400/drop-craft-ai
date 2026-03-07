/**
 * CustomerReturnsPortal — Portail public de demande de retour client
 * Accessible sans authentification via lien dans l'email de commande
 */
import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  RotateCcw, Package, CheckCircle, Upload, ArrowRight,
  ArrowLeft, Search, AlertCircle, Loader2, Camera
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

const RETURN_REASONS = [
  { id: 'defective', label: 'Produit défectueux' },
  { id: 'wrong_item', label: 'Mauvais article reçu' },
  { id: 'not_as_described', label: 'Non conforme à la description' },
  { id: 'damaged', label: 'Produit endommagé à la réception' },
  { id: 'too_late', label: 'Livraison trop tardive' },
  { id: 'changed_mind', label: "Je n'en ai plus besoin" },
  { id: 'other', label: 'Autre raison' },
]

type Step = 'lookup' | 'select_items' | 'reason' | 'confirm' | 'success'

export default function CustomerReturnsPortal() {
  const [step, setStep] = useState<Step>('lookup')
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [order, setOrder] = useState<any>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [rmaNumber, setRmaNumber] = useState('')

  const stepIndex = ['lookup', 'select_items', 'reason', 'confirm', 'success'].indexOf(step)
  const progressValue = ((stepIndex + 1) / 5) * 100

  const handleLookup = async () => {
    if (!orderNumber.trim() || !email.trim()) {
      toast.error('Veuillez remplir tous les champs')
      return
    }
    setIsSearching(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('order_number', orderNumber.trim())
        .eq('customer_email', email.trim().toLowerCase())
        .single()

      if (error || !data) {
        toast.error('Commande introuvable. Vérifiez vos informations.')
        return
      }

      if (data.status === 'cancelled') {
        toast.error('Cette commande a été annulée.')
        return
      }

      setOrder(data)
      setStep('select_items')
    } catch {
      toast.error('Erreur lors de la recherche')
    } finally {
      setIsSearching(false)
    }
  }

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    )
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Upload photos if any
      const photoUrls: string[] = []
      for (const photo of photos) {
        const fileName = `returns/${order.id}/${Date.now()}_${photo.name}`
        const { error: uploadError } = await supabase.storage
          .from('return-photos')
          .upload(fileName, photo)
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('return-photos')
            .getPublicUrl(fileName)
          if (urlData) photoUrls.push(urlData.publicUrl)
        }
      }

      // Generate RMA number
      const { data: rmaData } = await supabase.rpc('generate_rma_number')
      const generatedRma = rmaData || `RMA-${Date.now()}`

      const refundTotal = order.order_items
        ?.filter((i: any) => selectedItems.includes(i.id))
        .reduce((sum: number, i: any) => sum + (i.total_price || i.unit_price * i.quantity || 0), 0) || 0

      const { data, error } = await supabase.from('returns').insert({
        rma_number: generatedRma,
        order_id: order.id,
        user_id: order.user_id,
        reason: RETURN_REASONS.find(r => r.id === reason)?.label || reason,
        reason_category: reason,
        description: details || null,
        items: selectedItems.map(id => {
          const item = order.order_items?.find((i: any) => i.id === id)
          return { id, title: item?.product_title, quantity: item?.quantity }
        }),
        images: photoUrls.length > 0 ? photoUrls : null,
        status: 'pending',
        refund_amount: refundTotal,
        notes: `Email: ${email} | Commande: ${orderNumber}`,
      }).select().single()

      if (error) throw error

      setRmaNumber(data?.rma_number || `RMA-${Date.now()}`)
      setStep('success')
      toast.success('Demande de retour soumise avec succès')
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la soumission')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + photos.length > 5) {
      toast.error('Maximum 5 photos')
      return
    }
    setPhotos(prev => [...prev, ...files])
  }

  return (
    <>
      <Helmet>
        <title>Demande de retour — Service client</title>
        <meta name="description" content="Soumettez votre demande de retour et suivez son avancement." />
      </Helmet>

      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 mb-4">
              <RotateCcw className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Demande de retour</h1>
            <p className="text-muted-foreground mt-1">Soumettez votre demande en quelques étapes</p>
          </div>

          {/* Progress */}
          {step !== 'success' && (
            <div className="mb-6">
              <Progress value={progressValue} className="h-2" />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span className={cn(stepIndex >= 0 && 'text-primary font-medium')}>Recherche</span>
                <span className={cn(stepIndex >= 1 && 'text-primary font-medium')}>Articles</span>
                <span className={cn(stepIndex >= 2 && 'text-primary font-medium')}>Motif</span>
                <span className={cn(stepIndex >= 3 && 'text-primary font-medium')}>Confirmation</span>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Step 1: Lookup */}
              {step === 'lookup' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="h-5 w-5" />
                      Retrouvez votre commande
                    </CardTitle>
                    <CardDescription>
                      Entrez votre numéro de commande et l'email utilisé lors de l'achat
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="orderNumber">Numéro de commande</Label>
                      <Input
                        id="orderNumber"
                        placeholder="ex: ORD-20260307-XXXXX"
                        value={orderNumber}
                        onChange={e => setOrderNumber(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email de commande</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="votre@email.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                      />
                    </div>
                    <Button className="w-full" onClick={handleLookup} disabled={isSearching}>
                      {isSearching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                      Rechercher ma commande
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Select Items */}
              {step === 'select_items' && order && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Sélectionnez les articles à retourner
                    </CardTitle>
                    <CardDescription>
                      Commande {order.order_number} — {order.order_items?.length || 0} article(s)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {order.order_items?.map((item: any) => (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                          selectedItems.includes(item.id) ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                        )}
                        onClick={() => toggleItem(item.id)}
                      >
                        <Checkbox checked={selectedItems.includes(item.id)} />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.product_title}</p>
                          <p className="text-xs text-muted-foreground">
                            Qté: {item.quantity} — {(item.unit_price || 0).toFixed(2)} €
                          </p>
                        </div>
                        <span className="text-sm font-semibold">
                          {(item.total_price || item.unit_price * item.quantity || 0).toFixed(2)} €
                        </span>
                      </div>
                    ))}

                    <div className="flex gap-2 pt-4">
                      <Button variant="outline" onClick={() => setStep('lookup')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Retour
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => setStep('reason')}
                        disabled={selectedItems.length === 0}
                      >
                        Continuer
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Reason */}
              {step === 'reason' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Motif du retour
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Raison principale</Label>
                      <Select value={reason} onValueChange={setReason}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un motif" />
                        </SelectTrigger>
                        <SelectContent>
                          {RETURN_REASONS.map(r => (
                            <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Détails (optionnel)</Label>
                      <Textarea
                        value={details}
                        onChange={e => setDetails(e.target.value)}
                        placeholder="Décrivez le problème..."
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Photos (optionnel, max 5)
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {photos.map((photo, i) => (
                          <Badge key={i} variant="secondary" className="gap-1">
                            {photo.name.slice(0, 20)}
                            <button onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))} className="ml-1 text-destructive">×</button>
                          </Badge>
                        ))}
                      </div>
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        className="cursor-pointer"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" onClick={() => setStep('select_items')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Retour
                      </Button>
                      <Button className="flex-1" onClick={() => setStep('confirm')} disabled={!reason}>
                        Continuer
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 4: Confirm */}
              {step === 'confirm' && order && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Confirmez votre demande
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg border p-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Commande</span>
                        <span className="font-medium">{order.order_number}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Articles</span>
                        <span className="font-medium">{selectedItems.length} article(s)</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Motif</span>
                        <span className="font-medium">{RETURN_REASONS.find(r => r.id === reason)?.label}</span>
                      </div>
                      {photos.length > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Photos</span>
                          <span className="font-medium">{photos.length} photo(s)</span>
                        </div>
                      )}
                      <div className="border-t pt-3 flex justify-between">
                        <span className="font-medium">Remboursement estimé</span>
                        <span className="font-bold text-primary">
                          {order.order_items
                            ?.filter((i: any) => selectedItems.includes(i.id))
                            .reduce((sum: number, i: any) => sum + (i.total_price || i.unit_price * i.quantity || 0), 0)
                            .toFixed(2)} €
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setStep('reason')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
                      <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RotateCcw className="h-4 w-4 mr-2" />}
                        Soumettre la demande
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 5: Success */}
              {step === 'success' && (
                <Card className="text-center">
                  <CardContent className="py-12 space-y-4">
                    <div className="inline-flex items-center justify-center p-4 rounded-full bg-green-500/10">
                      <CheckCircle className="h-12 w-12 text-green-500" />
                    </div>
                    <h2 className="text-xl font-bold">Demande soumise !</h2>
                    <p className="text-muted-foreground">
                      Votre numéro de retour est :
                    </p>
                    <Badge variant="outline" className="text-lg px-4 py-2 font-mono">
                      {rmaNumber}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Vous recevrez un email avec les instructions de retour sous 24-48h.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setStep('lookup')
                        setOrder(null)
                        setSelectedItems([])
                        setReason('')
                        setDetails('')
                        setPhotos([])
                      }}
                    >
                      Nouvelle demande
                    </Button>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  )
}
