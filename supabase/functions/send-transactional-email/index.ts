import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// ============ EMAIL TEMPLATES ============

const baseLayout = (content: string, preheader: string = '') => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ShopOpti+</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; color: #18181b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px 24px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 24px; margin: 0; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.85); font-size: 14px; margin: 8px 0 0; }
    .content { padding: 32px 24px; }
    .content h2 { font-size: 20px; margin: 0 0 16px; color: #18181b; }
    .content p { font-size: 15px; line-height: 1.6; color: #52525b; margin: 0 0 16px; }
    .btn { display: inline-block; background: #6366f1; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; }
    .btn:hover { background: #4f46e5; }
    .feature-list { list-style: none; padding: 0; margin: 16px 0; }
    .feature-list li { padding: 8px 0; font-size: 14px; color: #3f3f46; }
    .feature-list li::before { content: '✅ '; }
    .alert-box { background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .alert-box.critical { background: #fee2e2; border-color: #f87171; }
    .stats-grid { display: flex; gap: 12px; margin: 16px 0; }
    .stat-card { flex: 1; background: #f4f4f5; border-radius: 8px; padding: 12px; text-align: center; }
    .stat-card .value { font-size: 24px; font-weight: 700; color: #6366f1; }
    .stat-card .label { font-size: 12px; color: #71717a; margin-top: 4px; }
    .footer { padding: 24px; text-align: center; background: #fafafa; border-top: 1px solid #e4e4e7; }
    .footer p { font-size: 12px; color: #a1a1aa; margin: 4px 0; }
    .footer a { color: #6366f1; text-decoration: none; }
    .preheader { display: none !important; max-height: 0; overflow: hidden; }
  </style>
</head>
<body>
  <div class="preheader">${preheader}</div>
  <div style="padding: 24px 16px;">
    <div class="container">
      ${content}
    </div>
  </div>
</body>
</html>
`;

const templates = {
  welcome: (data: { userName: string; plan?: string }) => ({
    subject: `Bienvenue sur ShopOpti+, ${data.userName} ! 🚀`,
    html: baseLayout(`
      <div class="header">
        <h1>🎉 Bienvenue sur ShopOpti+ !</h1>
        <p>Votre aventure e-commerce commence maintenant</p>
      </div>
      <div class="content">
        <h2>Bonjour ${data.userName},</h2>
        <p>Merci de rejoindre la communauté ShopOpti+ ! Nous sommes ravis de vous accompagner dans le développement de votre business e-commerce.</p>
        
        <p><strong>Voici ce que vous pouvez faire dès maintenant :</strong></p>
        <ul class="feature-list">
          <li>Importez des produits depuis 99+ fournisseurs</li>
          <li>Optimisez vos descriptions avec notre IA SEO</li>
          <li>Suivez vos performances en temps réel</li>
          <li>Automatisez votre pricing et fulfillment</li>
        </ul>
        
        <p style="text-align: center; margin: 24px 0;">
          <a href="https://shopopti.io/dashboard" class="btn">Accéder à mon dashboard →</a>
        </p>
        
        <p>Besoin d'aide pour démarrer ? Consultez notre <a href="https://shopopti.io/documentation" style="color: #6366f1;">documentation</a> ou contactez notre <a href="https://shopopti.io/support" style="color: #6366f1;">support</a>.</p>
      </div>
      <div class="footer">
        <p>ShopOpti+ — La plateforme n°1 du dropshipping intelligent</p>
        <p><a href="https://shopopti.io">shopopti.io</a></p>
      </div>
    `, `Bienvenue ${data.userName} ! Votre compte ShopOpti+ est prêt.`),
  }),

  trial_confirmation: (data: { userName: string; plan: string; trialDays: number; endsAt: string }) => ({
    subject: `✅ Essai gratuit ${data.plan} activé — ${data.trialDays} jours offerts`,
    html: baseLayout(`
      <div class="header">
        <h1>🎁 Essai gratuit activé !</h1>
        <p>Plan ${data.plan} — ${data.trialDays} jours gratuits</p>
      </div>
      <div class="content">
        <h2>Félicitations ${data.userName} !</h2>
        <p>Votre essai gratuit du plan <strong>${data.plan}</strong> est maintenant actif. Profitez de toutes les fonctionnalités premium pendant ${data.trialDays} jours.</p>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="value">${data.trialDays}</div>
            <div class="label">Jours gratuits</div>
          </div>
          <div class="stat-card">
            <div class="value">${data.plan}</div>
            <div class="label">Plan activé</div>
          </div>
        </div>
        
        <p>⏰ <strong>Date de fin :</strong> ${new Date(data.endsAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        
        <p><strong>Ce qui est inclus dans votre essai :</strong></p>
        <ul class="feature-list">
          <li>Accès illimité à l'IA d'optimisation</li>
          <li>Import de produits sans limite</li>
          <li>Analytics avancés et rapports</li>
          <li>Support prioritaire</li>
        </ul>
        
        <p style="text-align: center; margin: 24px 0;">
          <a href="https://shopopti.io/dashboard" class="btn">Explorer les fonctionnalités →</a>
        </p>
        
        <p style="font-size: 13px; color: #71717a;">Aucun paiement ne sera prélevé pendant votre période d'essai. Vous pouvez annuler à tout moment.</p>
      </div>
      <div class="footer">
        <p>ShopOpti+ — La plateforme n°1 du dropshipping intelligent</p>
        <p><a href="https://shopopti.io">shopopti.io</a></p>
      </div>
    `, `Essai gratuit ${data.plan} activé ! ${data.trialDays} jours pour tester toutes les fonctionnalités.`),
  }),

  quota_alert: (data: { userName: string; quotaKey: string; currentUsage: number; limit: number; percentage: number; plan: string }) => {
    const isCritical = data.percentage >= 95;
    const alertClass = isCritical ? 'critical' : '';
    const emoji = isCritical ? '🔴' : '⚠️';
    const remaining = data.limit - data.currentUsage;
    
    const quotaLabels: Record<string, string> = {
      'products_import': 'Import de produits',
      'ai_generations': 'Générations IA',
      'seo_audits': 'Audits SEO',
      'api_calls': 'Appels API',
    };
    const quotaLabel = quotaLabels[data.quotaKey] || data.quotaKey;

    return {
      subject: `${emoji} Alerte quota : ${quotaLabel} à ${data.percentage}%`,
      html: baseLayout(`
        <div class="header">
          <h1>${emoji} Alerte Quota</h1>
          <p>${quotaLabel} — ${data.percentage}% utilisé</p>
        </div>
        <div class="content">
          <h2>Bonjour ${data.userName},</h2>
          
          <div class="alert-box ${alertClass}">
            <strong>${isCritical ? '🔴 Quota presque épuisé !' : '⚠️ Quota bientôt atteint'}</strong>
            <p style="margin: 8px 0 0; font-size: 14px;">
              Votre quota <strong>${quotaLabel}</strong> est à <strong>${data.percentage}%</strong> d'utilisation.
              Il vous reste <strong>${remaining}</strong> utilisation${remaining > 1 ? 's' : ''}.
            </p>
          </div>
          
          <div class="stats-grid">
            <div class="stat-card">
              <div class="value">${data.currentUsage}</div>
              <div class="label">Utilisé</div>
            </div>
            <div class="stat-card">
              <div class="value">${data.limit}</div>
              <div class="label">Limite ${data.plan}</div>
            </div>
            <div class="stat-card">
              <div class="value">${remaining}</div>
              <div class="label">Restant</div>
            </div>
          </div>
          
          <p>${isCritical
            ? 'Pour continuer à utiliser cette fonctionnalité sans interruption, nous vous recommandons de passer au plan supérieur.'
            : 'Vous approchez de votre limite mensuelle. Pensez à optimiser votre utilisation ou à upgrader votre plan.'
          }</p>
          
          <p style="text-align: center; margin: 24px 0;">
            <a href="https://shopopti.io/choose-plan" class="btn">Upgrader mon plan →</a>
          </p>
        </div>
        <div class="footer">
          <p>ShopOpti+ — La plateforme n°1 du dropshipping intelligent</p>
          <p><a href="https://shopopti.io/settings">Gérer les préférences d'alertes</a></p>
        </div>
      `, `Alerte : votre quota ${quotaLabel} est à ${data.percentage}%. ${remaining} utilisation(s) restante(s).`),
    };
  },

  trial_expiring: (data: { userName: string; plan: string; daysLeft: number; endsAt: string }) => ({
    subject: `⏰ Plus que ${data.daysLeft} jour${data.daysLeft > 1 ? 's' : ''} d'essai gratuit`,
    html: baseLayout(`
      <div class="header">
        <h1>⏰ Votre essai se termine bientôt</h1>
        <p>Plus que ${data.daysLeft} jour${data.daysLeft > 1 ? 's' : ''} de plan ${data.plan}</p>
      </div>
      <div class="content">
        <h2>Bonjour ${data.userName},</h2>
        <p>Votre essai gratuit du plan <strong>${data.plan}</strong> se termine le <strong>${new Date(data.endsAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.</p>
        
        <p>Pour continuer à profiter de toutes les fonctionnalités premium, choisissez le plan qui vous convient :</p>
        
        <p style="text-align: center; margin: 24px 0;">
          <a href="https://shopopti.io/choose-plan" class="btn">Choisir mon plan →</a>
        </p>
        
        <p style="font-size: 13px; color: #71717a;">Si vous ne souscrivez pas, votre compte passera automatiquement au plan gratuit. Vos données seront conservées.</p>
      </div>
      <div class="footer">
        <p>ShopOpti+ — La plateforme n°1 du dropshipping intelligent</p>
        <p><a href="https://shopopti.io">shopopti.io</a></p>
      </div>
    `, `Votre essai ${data.plan} se termine dans ${data.daysLeft} jours. Choisissez votre plan.`),
  }),
};

// ============ MAIN HANDLER ============

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { template, data } = await req.json();

    if (!template || !templates[template as keyof typeof templates]) {
      return new Response(JSON.stringify({ 
        error: 'Invalid template',
        available: Object.keys(templates)
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get user profile for email
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    const recipientEmail = profile?.email || user.email;
    const userName = profile?.full_name || user.email?.split('@')[0] || 'Utilisateur';

    // Generate email content
    const templateFn = templates[template as keyof typeof templates] as Function;
    const emailContent = templateFn({ userName, ...data });

    // Send via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ShopOpti+ <noreply@shopopti.io>',
        to: [recipientEmail],
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });

    const resendResult = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('[send-transactional-email] Resend error:', resendResult);
      return new Response(JSON.stringify({ 
        error: 'Failed to send email',
        detail: resendResult 
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[send-transactional-email] Sent ${template} to ${recipientEmail}`);

    return new Response(JSON.stringify({
      success: true,
      messageId: resendResult.id,
      template,
      recipient: recipientEmail,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[send-transactional-email] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
