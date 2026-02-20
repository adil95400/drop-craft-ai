import React, { useState } from 'react'
import { BreadcrumbSchema } from '@/components/seo/StructuredData'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, Mail, Phone, Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { PublicLayout } from '@/layouts/PublicLayout'
import { supabase } from '@/integrations/supabase/client'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const { data, error } = await supabase.functions.invoke('contact-form', {
        body: { name: formData.name, email: formData.email, message: formData.message }
      })
      if (error) throw error
      toast.success("✅ Message envoyé ! Notre équipe vous recontactera sous 2h.")
      setFormData({ name: '', email: '', message: '' })
    } catch (err) {
      toast.error("❌ Erreur lors de l'envoi. Veuillez réessayer.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Contactez ShopOpti+",
    "url": "https://www.shopopti.io/contact",
    "mainEntity": {
      "@type": "Organization",
      "name": "ShopOpti+",
      "email": "contact@shopopti.fr",
      "telephone": "+33 1 23 45 67 89",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Paris",
        "addressCountry": "FR"
      }
    }
  };

  return (
    <PublicLayout>
      <Helmet>
        <title>Contact ShopOpti+ | Support Client et Assistance</title>
        <meta name="description" content="Contactez l'équipe ShopOpti+ pour toute question. Support réactif (réponse sous 2h), conseils personnalisés, assistance technique dédiée." />
        <meta name="keywords" content="contact ShopOpti, support e-commerce, assistance dropshipping, aide technique" />
        <link rel="canonical" href="https://shopopti.io/contact" />
        <meta property="og:title" content="Contact ShopOpti+ | Support" />
        <meta property="og:description" content="Notre équipe vous répond en moins de 2h." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://shopopti.io/contact" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <BreadcrumbSchema items={[
        { name: "Accueil", url: "https://shopopti.io" },
        { name: "Contact", url: "https://shopopti.io/contact" },
      ]} />

      <div className="bg-background py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-6">Contactez-nous</h1>
            <p className="text-xl text-muted-foreground">Notre équipe vous répond en moins de 2h</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Envoyez-nous un message</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    placeholder="Votre nom"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                  <Input
                    type="email"
                    placeholder="votre@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                  <Textarea
                    placeholder="Votre message..."
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    required
                    className="min-h-32"
                  />
                  <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    {isSubmitting ? 'Envoi en cours...' : 'Envoyer'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardContent className="p-6 flex items-center gap-4">
                  <Mail className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="font-semibold">Email</h3>
                    <p className="text-sm text-muted-foreground">contact@shopopti.fr</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 flex items-center gap-4">
                  <Phone className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="font-semibold">Téléphone</h3>
                    <p className="text-sm text-muted-foreground">+33 1 23 45 67 89</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}

export default Contact