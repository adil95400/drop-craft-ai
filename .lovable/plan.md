
# Plan de mise en production ShopOpti

## Contexte

L'application ShopOpti est deja tres avancee avec une architecture solide. Ce plan identifie les ajustements necessaires pour un lancement production securise.

## Etat actuel (deja implemente)

- Pages legales : CGU, CGV, Politique de confidentialite
- Banniere cookies RGPD conforme
- Suppression de compte (RGPD)
- Export de donnees utilisateur (RGPD)
- Stripe : checkout, webhooks, portail client, plans (Standard/Pro/Ultra Pro)
- Securite : RLS 100%, JWT, CORS securise, audit logs, RBAC
- SEO : sitemap, robots.txt, JSON-LD, meta tags Helmet, pages SEO dediees
- Lazy loading sur 150+ pages
- PWA configure
- Sentry integre
- Edge functions deployees (300+)

## Ajustements a implementer

### Phase 1 — Configuration domaine et routing (Priorite haute)

**1.1 Corriger les references de domaine**

Le code contient des references obsoletes (`app.shopopti.com` au lieu de `shopopti.io`). A corriger dans :
- `src/components/admin/AdvancedSettings.tsx` : mettre a jour `siteUrl` et `allowedOrigins`
- `src/config/domains.ts` : ajouter `app.shopopti.io` dans la config production
- `supabase/functions/_shared/cors.ts` et `secure-cors.ts` : verifier que `app.shopopti.io` est dans les origines autorisees

**1.2 Architecture marketing vs app**

> Note importante : Lovable ne supporte pas le hosting multi-sous-domaine. Le projet deploye sur `shopopti.io` servira a la fois le site marketing (pages publiques) et l'application (routes protegees). La separation se fait par le routing, pas par sous-domaine.

Le routing actuel est deja bien structure :
- Pages publiques (marketing) : `/`, `/pricing`, `/features`, `/blog`, etc.
- Application protegee : `/dashboard/*`, `/products/*`, `/orders/*`, etc.

Ajout a faire : redirection `app.shopopti.io` vers `shopopti.io/dashboard` via un enregistrement DNS CNAME + regle de redirection.

### Phase 2 — Securite production

**2.1 Headers de securite**

Le fichier `src/lib/security-headers.ts` est deja bien configure avec CSP, X-Frame-Options, HSTS. A verifier :
- Ajouter la directive `Strict-Transport-Security` (HSTS) dans les headers
- S'assurer que les headers sont appliques via `vercel.json` ou `_headers`

**2.2 Verification des variables d'environnement**

- `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` : OK, deja configurees
- Verifier qu'aucune `SERVICE_ROLE_KEY` n'est exposee cote client (verification deja faite, conforme)
- Ajouter un fichier `public/_headers` pour les headers de securite en production

**2.3 Protection anti-scraping**

Ajouter des headers `X-Robots-Tag` sur les routes protegees et un rate limiting cote edge functions (deja en place sur les fonctions critiques).

### Phase 3 — Stripe et abonnements (verification)

L'integration est deja complete. Verifications :
- `stripe-webhook/index.ts` : signature Stripe verifiee, mise a jour du profil via SERVICE_ROLE
- `check-subscription/index.ts` : synchronisation du plan
- `create-checkout-session` : creation de session securisee
- `customer-portal` : gestion des abonnements

Action : verifier que les secrets `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET` sont bien configures dans les secrets du projet.

### Phase 4 — Performance et SEO

**4.1 SEO landing page**

La page `Index.tsx` utilise deja `<Helmet>`, `<SEO>`, `SoftwareAppSchema`, `OrganizationSchema`. Optimisations supplementaires :
- Verifier les balises Open Graph et Twitter Card
- S'assurer que le `canonical` pointe vers `https://shopopti.io`
- Verifier que `robots.txt` et `sitemap.xml` sont accessibles en production

**4.2 Performance mobile**

- Le lazy loading est deja en place sur toutes les routes
- Les images utilisent des variantes `-sm` pour mobile
- PWA est configure via `vite-plugin-pwa`
- Image optimizer via `vite-plugin-image-optimizer`

### Phase 5 — Monitoring et analytics

**5.1 Sentry**

Deja integre (`@sentry/react`). Verifier que le DSN de production est configure.

**5.2 Analytics**

Creer un composant d'integration analytics qui respecte le consentement cookies :
- Lire les preferences du `CookieBanner` (`shopopti_cookie_consent`)
- Ne charger les scripts analytics que si `analytics: true`
- Support PostHog ou GA4 (a configurer via secret)

**5.3 Logs production**

L'intercepteur de console (`consoleInterceptor.ts`) est en place et redirige vers Sentry en production. Les edge functions ont un logging structure.

### Phase 6 — Fichier de headers production

Creer `public/_headers` pour Lovable/Vercel avec :

```text
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()
```

## Details techniques

### Fichiers a modifier

| Fichier | Action |
|---------|--------|
| `src/config/domains.ts` | Ajouter `app.shopopti.io`, verifier config |
| `src/components/admin/AdvancedSettings.tsx` | Corriger `app.shopopti.com` → `shopopti.io` |
| `supabase/functions/_shared/cors.ts` | Verifier origines autorisees |
| `supabase/functions/_shared/secure-cors.ts` | Verifier origines autorisees |
| `public/_headers` | Creer avec headers de securite + HSTS |
| `src/lib/security-headers.ts` | Ajouter HSTS |

### Fichiers a creer

| Fichier | Description |
|---------|-------------|
| `src/hooks/useAnalyticsConsent.ts` | Hook pour charger analytics selon consentement cookies |

### Verifications a effectuer

1. Secrets Stripe configures (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)
2. DSN Sentry de production configure
3. DNS `shopopti.io` pointe vers `185.158.133.1` (A records OK)
4. TXT `_lovable` ajoute pour verification domaine
5. Publication du projet via le bouton Publish de Lovable

## Checklist pre-lancement

- [ ] DNS verifie et domaine connecte dans Lovable
- [ ] Headers de securite deployes
- [ ] Secrets Stripe en production
- [ ] Pages legales accessibles (`/terms`, `/privacy`, `/cgv`)
- [ ] Banniere cookies fonctionnelle
- [ ] Suppression de compte fonctionnelle
- [ ] Webhooks Stripe enregistres avec l'URL de production
- [ ] Sentry DSN configure
- [ ] Analytics respectant le consentement
- [ ] Test complet du flow d'inscription → paiement → dashboard
