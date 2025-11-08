# Guide d'Ajout de Vidéos Tutoriels

## 📹 Système de Vidéos Intégré

Le système est maintenant prêt à accueillir vos vidéos tutoriels. Voici comment les ajouter :

## 🎬 Options d'Intégration

### Option 1: Vidéos YouTube (Recommandé)

**Avantages:**
- Hébergement gratuit et illimité
- Streaming optimisé automatiquement
- Pas de gestion de stockage
- Analytics YouTube intégrés

**Comment faire:**

1. **Uploadez votre vidéo sur YouTube**
   - Créez une chaîne YouTube dédiée si nécessaire
   - Uploadez vos tutoriels vidéo

2. **Récupérez l'ID de la vidéo**
   - URL YouTube: `https://www.youtube.com/watch?v=ABC123XYZ`
   - ID: `ABC123XYZ`

3. **Ajoutez l'ID dans le code**
   ```typescript
   // Dans src/pages/MarketplaceIntegrationGuidesPage.tsx
   videoTutorials: [
     {
       id: 'shopify-overview',
       title: 'Introduction à l\'intégration Shopify',
       description: 'Vue d\'ensemble complète du processus',
       duration: '5:30',
       youtubeId: 'ABC123XYZ', // ⬅️ Ajoutez votre ID ici
     }
   ]
   ```

### Option 2: Vidéos Hébergées (Supabase Storage)

**Avantages:**
- Contrôle total sur vos vidéos
- Pas de dépendance externe
- Branding cohérent

**Comment faire:**

1. **Préparez vos vidéos**
   - Format: MP4 (H.264)
   - Résolution: 1920x1080 ou 1280x720
   - Taille max recommandée: 500MB par vidéo

2. **Créez un bucket Supabase Storage**
   ```sql
   -- Exécutez cette migration
   INSERT INTO storage.buckets (id, name, public)
   VALUES ('video-tutorials', 'video-tutorials', true);

   -- Créez les politiques RLS
   CREATE POLICY "Videos are publicly accessible"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'video-tutorials');
   ```

3. **Uploadez vos vidéos**
   - Via l'interface Supabase Dashboard
   - Ou via code:
   ```typescript
   const { data, error } = await supabase.storage
     .from('video-tutorials')
     .upload('shopify/introduction.mp4', videoFile)
   ```

4. **Récupérez l'URL publique**
   ```typescript
   const { data } = supabase.storage
     .from('video-tutorials')
     .getPublicUrl('shopify/introduction.mp4')
   
   console.log(data.publicUrl) // Utilisez cette URL
   ```

5. **Ajoutez l'URL dans le code**
   ```typescript
   videoTutorials: [
     {
       id: 'shopify-overview',
       title: 'Introduction à l\'intégration Shopify',
       duration: '5:30',
       videoUrl: 'https://[votre-projet].supabase.co/storage/v1/object/public/video-tutorials/shopify/introduction.mp4',
       thumbnailUrl: shopifyApiKeysImg,
     }
   ]
   ```

### Option 3: Vidéos Externes (Vimeo, etc.)

Pour Vimeo ou d'autres plateformes:

```typescript
videoTutorials: [
  {
    id: 'shopify-overview',
    title: 'Introduction à l\'intégration Shopify',
    videoUrl: 'https://player.vimeo.com/video/123456789',
    duration: '5:30',
  }
]
```

## 📝 Structure des Données Vidéo

```typescript
interface VideoTutorial {
  id: string              // Identifiant unique
  title: string           // Titre de la vidéo
  description?: string    // Description courte
  youtubeId?: string      // ID YouTube (option 1)
  videoUrl?: string       // URL directe (option 2/3)
  duration?: string       // Durée (format: "5:30")
  thumbnailUrl?: string   // URL de la miniature
}
```

## 🎥 Conseils pour Créer vos Vidéos

### Contenu Recommandé par Plateforme:

**Shopify:**
1. Vue d'ensemble (5-7 min)
2. Création app privée + permissions (8-10 min)
3. Test de connexion (3-5 min)

**WooCommerce:**
1. Activation REST API (6-8 min)
2. Génération clés API (5-7 min)
3. Résolution problèmes courants (4-6 min)

**Etsy:**
1. Création compte développeur (4-5 min)
2. Configuration application (7-9 min)
3. Obtention clé API (3-4 min)

**PrestaShop:**
1. Activation Webservice (5-6 min)
2. Configuration permissions (8-10 min)
3. Test API (4-5 min)

### Outils d'Enregistrement Recommandés:

**Gratuits:**
- **OBS Studio** (Windows/Mac/Linux)
- **ShareX** (Windows)
- **Screencast-O-Matic** (Web)

**Payants:**
- **Camtasia** (Pro)
- **ScreenFlow** (Mac)
- **Loom** (Simple et rapide)

### Bonnes Pratiques:

✅ **À FAIRE:**
- Résolution 1080p minimum
- Audio clair (utilisez un micro correct)
- Montrez les erreurs courantes et leur résolution
- Ajoutez des chapitres/timestamps
- Testez sur plusieurs navigateurs
- Durée idéale: 5-10 minutes par vidéo

❌ **À ÉVITER:**
- Vidéos trop longues (>15 min)
- Audio de mauvaise qualité
- Texte trop petit illisible
- Transitions trop lentes
- Pas de table des matières

## 🔄 Mise à Jour des Vidéos

Pour remplacer une vidéo existante:

1. Uploadez la nouvelle version
2. Mettez à jour l'URL/ID dans le code
3. Conservez le même `id` pour maintenir les liens

## 📊 Tracking et Analytics

Pour suivre les vues (YouTube uniquement):
- Utilisez YouTube Analytics
- Ajoutez des paramètres UTM aux liens:
  ```
  https://youtube.com/watch?v=ABC123&utm_source=app&utm_medium=guide&utm_campaign=shopify
  ```

## 🚀 Prochaines Étapes

1. **Créez vos vidéos** avec les outils recommandés
2. **Uploadez-les** sur YouTube ou Supabase
3. **Ajoutez les URLs** dans le code
4. **Testez** l'affichage et la lecture
5. **Partagez** avec vos utilisateurs!

## ❓ Besoin d'Aide?

Si vous avez besoin d'assistance pour:
- Créer les vidéos
- Les uploader
- Configurer le storage
- Optimiser la qualité

N'hésitez pas à demander!
