import "npm:@supabase/supabase-js@2"
import { createClient } from "npm:@supabase/supabase-js@2"
import { getSecureCorsHeaders, handleCorsPreflightSecure } from '../_shared/secure-cors.ts'
import { handleError, ValidationError } from '../_shared/error-handler.ts'

Deno.serve(async (req) => {
  // Secure CORS
  const preflightResponse = handleCorsPreflightSecure(req)
  if (preflightResponse) return preflightResponse

  const origin = req.headers.get('Origin')
  const corsHeaders = getSecureCorsHeaders(req)

  try {
    const body = await req.json()

    // Input validation
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const message = typeof body.message === 'string' ? body.message.trim() : ''

    if (!name || !email || !message) {
      throw new ValidationError('Tous les champs sont requis')
    }

    if (name.length > 100) {
      throw new ValidationError('Le nom ne doit pas dépasser 100 caractères')
    }
    if (email.length > 255) {
      throw new ValidationError('L\'email ne doit pas dépasser 255 caractères')
    }
    if (message.length > 5000) {
      throw new ValidationError('Le message ne doit pas dépasser 5000 caractères')
    }
    if (message.length < 10) {
      throw new ValidationError('Le message doit contenir au moins 10 caractères')
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new ValidationError('Adresse email invalide')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { error } = await supabase
      .from('contact_messages')
      .insert({ name, email, message })

    if (error) {
      console.error('DB insert error:', error)
      return new Response(
        JSON.stringify({ error: 'Erreur lors de l\'enregistrement du message' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Message envoyé avec succès' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return handleError(err, corsHeaders)
  }
})