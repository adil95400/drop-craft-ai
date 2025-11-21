# ❓ FAQ - Questions Fréquentes

## Questions Générales

### Qu'est-ce que Drop Craft AI ?

Drop Craft AI est une plateforme complète de gestion e-commerce qui offre :
- Gestion multi-boutiques (Shopify, WooCommerce, etc.)
- Automatisation IA des processus
- CRM et marketing automation
- Analyse et insights en temps réel
- Intégrations avec fournisseurs (BigBuy, AliExpress, Amazon)

### Quels sont les prérequis techniques ?

**Frontend:**
- Node.js 18+
- npm 9+
- Navigateur moderne (Chrome, Firefox, Safari, Edge)

**Backend:**
- Compte Supabase
- Clés API pour les intégrations tierces

### Quels plans tarifaires sont disponibles ?

| Plan | Prix | Limites |
|------|------|---------|
| **Free** | Gratuit | 50 produits, 100 commandes/mois, 1 intégration |
| **Pro** | 29€/mois | 500 produits, 1000 commandes/mois, 5 intégrations, 100K tokens IA |
| **Ultra Pro** | 99€/mois | Illimité, intégrations illimitées, 500K tokens IA, support prioritaire |

## Installation & Configuration

### Comment installer le projet en local ?

```bash
# Cloner le repository
git clone https://github.com/your-org/drop-craft-ai.git
cd drop-craft-ai

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés

# Lancer le serveur de développement
npm run dev
```

### Comment configurer Supabase ?

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Copier l'URL du projet et la clé API
3. Ajouter dans `.env`:
   ```
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```
4. Exécuter les migrations:
   ```bash
   npm run supabase:migrate
   ```

### Erreur "Supabase client not initialized"

**Solution:**
- Vérifier que les variables d'environnement sont correctes
- Redémarrer le serveur de développement
- Vérifier que le projet Supabase est actif

## Authentification

### Comment réinitialiser un mot de passe ?

1. Aller sur la page de connexion
2. Cliquer sur "Mot de passe oublié ?"
3. Entrer votre email
4. Suivre le lien reçu par email
5. Définir un nouveau mot de passe

### Les sessions expirent trop vite

**Solution:**
```typescript
// Ajuster dans supabase/config.toml
[auth]
jwt_expiry = 3600  # 1 heure (par défaut)
refresh_token_rotation_enabled = true
```

### Comment activer l'authentification Google ?

1. Aller dans Supabase Dashboard → Authentication → Providers
2. Activer "Google"
3. Configurer OAuth credentials depuis Google Cloud Console
4. Ajouter callback URL: `https://your-project.supabase.co/auth/v1/callback`

## Produits & Catalogue

### Comment importer des produits en masse ?

**Via CSV:**
1. Aller dans Catalogue → Importer
2. Télécharger le template CSV
3. Remplir avec vos produits
4. Uploader le fichier
5. Mapper les colonnes
6. Confirmer l'import

**Via API:**
```typescript
import { supabase } from '@/integrations/supabase/client';

const products = [/* vos produits */];
const { data, error } = await supabase
  .from('catalog_products')
  .insert(products);
```

### Les images de produits ne s'affichent pas

**Causes possibles:**
- ✅ Vérifier les politiques Storage dans Supabase
- ✅ S'assurer que les URLs sont publiques
- ✅ Vérifier les CORS si hébergées ailleurs
- ✅ Valider le format d'image (JPG, PNG, WEBP)

### Comment optimiser les descriptions avec l'IA ?

1. Aller sur la page du produit
2. Cliquer sur "Optimiser avec IA"
3. Choisir le ton et le style
4. Générer et valider
5. La description est automatiquement mise à jour

## Commandes & CRM

### Comment suivre une commande ?

1. Aller dans Commandes
2. Rechercher par numéro, client ou date
3. Cliquer sur la commande
4. Voir les détails et le tracking

### Comment configurer les emails automatiques ?

**Configuration:**
```typescript
// Dans Marketing → Automation
{
  trigger: 'order_placed',
  action: 'send_email',
  template: 'order_confirmation',
  delay: 0
}
```

### Les webhooks ne fonctionnent pas

**Checklist de debug:**
- ✅ Vérifier l'URL du webhook est accessible publiquement
- ✅ Vérifier les logs Edge Functions
- ✅ S'assurer que le secret webhook est correct
- ✅ Tester avec un outil comme Webhook.site

## Intégrations

### Comment connecter Shopify ?

1. Aller dans Intégrations → Shopify
2. Cliquer sur "Connecter"
3. Se connecter à votre boutique Shopify
4. Autoriser les permissions
5. La synchronisation démarre automatiquement

### Erreur "Integration sync failed"

**Solutions:**
1. Vérifier les tokens d'API ne sont pas expirés
2. Vérifier les quotas de l'API tierce
3. Consulter les logs: Monitoring → Edge Functions
4. Réessayer la synchronisation

### Comment ajouter un nouveau fournisseur ?

**Pour les développeurs:**
1. Créer un adapter dans `src/services/integrations/`
2. Implémenter l'interface `IntegrationAdapter`
3. Ajouter la configuration dans `integration_connections`
4. Créer un Edge Function pour sync
5. Tester avec des données de staging

## Analytics & Monitoring

### Les métriques ne se mettent pas à jour

**Solutions:**
- Les données sont mises à jour toutes les 5 minutes
- Vérifier Edge Function `calculate-metrics` dans les logs
- Forcer un recalcul via API:
  ```bash
  curl -X POST https://your-project.supabase.co/functions/v1/calculate-metrics \
    -H "Authorization: Bearer YOUR_TOKEN"
  ```

### Comment exporter les analytics ?

1. Aller dans Analytics
2. Sélectionner la période
3. Cliquer sur "Exporter"
4. Choisir le format (CSV, Excel, PDF)
5. Télécharger le rapport

## Performance

### L'application est lente

**Optimisations:**
1. Activer le cache Redis (voir PERFORMANCE.md)
2. Réduire la taille des images
3. Implémenter le lazy loading
4. Vérifier les indexes de base de données
5. Augmenter la taille de l'instance Supabase

### Erreur "Too many requests"

**Rate limiting atteint:**
- Passer à un plan supérieur
- Implémenter du throttling côté client
- Utiliser le cache pour réduire les appels API

## Sécurité

### Comment activer 2FA ?

**Pour les utilisateurs:**
1. Profil → Sécurité
2. Activer "Authentification à deux facteurs"
3. Scanner le QR code avec Google Authenticator
4. Confirmer avec un code

**Pour forcer 2FA (admins):**
```sql
-- Dans Supabase SQL Editor
UPDATE profiles 
SET require_2fa = true 
WHERE role = 'admin';
```

### Une faille de sécurité a été détectée

**Procédure:**
1. **NE PAS** créer d'issue publique GitHub
2. Envoyer un email à: security@drop-craft-ai.com
3. Inclure:
   - Description détaillée
   - Steps to reproduce
   - Impact potentiel
   - Preuve de concept (si applicable)
4. Nous répondrons sous 24-48h

## Déploiement

### Comment déployer en production ?

**Via GitHub Actions (recommandé):**
```bash
git push origin main
# Le CI/CD déploie automatiquement
```

**Manuel:**
```bash
npm run build
# Déployer le dossier dist/ sur votre hébergeur
```

### Comment configurer un domaine personnalisé ?

**Netlify/Vercel:**
1. Ajouter le domaine dans les settings
2. Configurer les DNS records:
   ```
   A     @       76.76.21.21
   CNAME www     your-app.netlify.app
   ```
3. Activer HTTPS automatique

### Erreur "Build failed"

**Checklist:**
- ✅ Toutes les dépendances sont installées
- ✅ Variables d'environnement configurées
- ✅ Pas d'erreurs TypeScript: `npm run typecheck`
- ✅ Pas d'erreurs ESLint: `npm run lint`

## Dépannage

### Vider le cache

**Browser:**
- Chrome: Ctrl+Shift+Del
- Firefox: Ctrl+Shift+Del
- Safari: Cmd+Option+E

**Application:**
```typescript
// Console navigateur
localStorage.clear();
sessionStorage.clear();
location.reload();
```

**React Query:**
```typescript
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();
queryClient.clear();
```

### Logs de debug

**Frontend:**
```typescript
// Activer les logs détaillés
localStorage.setItem('debug', 'app:*');
location.reload();
```

**Backend (Edge Functions):**
```bash
# Voir les logs en temps réel
npx supabase functions logs --project-ref YOUR_PROJECT_REF
```

### Réinitialiser la base de données

⚠️ **ATTENTION: Supprime toutes les données!**

```bash
npm run supabase:reset
npm run supabase:migrate
npm run supabase:seed
```

## Support

### Où obtenir de l'aide ?

**Community:**
- 💬 Discord: [discord.gg/dropcraft](https://discord.gg/dropcraft)
- 📧 Email: support@drop-craft-ai.com
- 📚 Documentation: [docs.drop-craft-ai.com](https://docs.drop-craft-ai.com)

**Support Premium (Ultra Pro):**
- 🚀 Support prioritaire 24/7
- 📞 Assistance téléphonique
- 🎯 Onboarding dédié

### Comment contribuer au projet ?

1. Fork le repository
2. Créer une branche: `git checkout -b feature/ma-feature`
3. Commit: `git commit -m 'feat: ajouter ma feature'`
4. Push: `git push origin feature/ma-feature`
5. Ouvrir une Pull Request

Voir [CONTRIBUTING.md](./CONTRIBUTING.md) pour plus de détails.

### Comment signaler un bug ?

1. Aller sur [GitHub Issues](https://github.com/your-org/drop-craft-ai/issues)
2. Cliquer "New Issue"
3. Choisir "Bug Report"
4. Remplir le template:
   - Description du bug
   - Steps to reproduce
   - Comportement attendu vs actuel
   - Screenshots/logs
   - Environment (OS, navigateur, version)

## Glossaire

- **RLS**: Row Level Security (sécurité au niveau des lignes)
- **Edge Function**: Fonction serverless Supabase
- **Webhook**: Callback HTTP automatique
- **JWT**: JSON Web Token (authentification)
- **CRUD**: Create, Read, Update, Delete
- **SSO**: Single Sign-On
- **2FA**: Two-Factor Authentication
- **CI/CD**: Continuous Integration/Deployment

---

**Dernière mise à jour**: 2024-01-XX  
**Version**: 1.0.0

💡 **Vous ne trouvez pas votre réponse ?** Contactez-nous sur Discord ou par email!
