import type { ModuleDocumentation } from '../types';

export const imageDeduplicationDocumentation: ModuleDocumentation = {
  id: 'imageDeduplication',
  slug: 'image-deduplication',
  title: 'Déduplication d\'Images',
  subtitle: 'Détection et fusion des images similaires',
  description: 'Identifiez et fusionnez les images dupliquées ou visuellement similaires dans votre catalogue grâce au hashing perceptuel (pHash). Nettoyez votre catalogue et économisez de l\'espace.',
  icon: 'Image',
  category: 'catalog',
  routes: ['/catalog/image-dedup'],
  
  minPlan: 'pro',
  targetLevels: ['intermediate', 'advanced'],
  estimatedReadTime: 7,
  lastUpdated: '2025-06-01',
  version: '1.0',
  tags: ['images', 'déduplication', 'nettoyage', 'catalogue', 'pHash', 'optimisation'],
  
  overview: {
    purpose: 'La déduplication d\'images utilise le hashing perceptuel pour détecter les images identiques ou visuellement très proches dans votre catalogue. Fusionnez les doublons pour un catalogue propre.',
    whenToUse: 'Après des imports massifs depuis plusieurs fournisseurs, ou lors d\'un nettoyage périodique du catalogue.',
    targetAudience: 'Gestionnaires de catalogues volumineux (500+ produits) qui importent depuis plusieurs sources.',
    prerequisites: ['Avoir des produits avec images dans le catalogue'],
    keyFeatures: [
      'Scan complet du catalogue par hashing perceptuel',
      'Détection des images identiques et similaires',
      'Score de similarité en pourcentage',
      'Prévisualisation côte-à-côte des doublons',
      'Fusion en un clic (conserver la meilleure qualité)',
      'Suppression en masse des doublons confirmés',
      'Statistiques d\'espace récupéré',
      'Filtre par seuil de similarité'
    ]
  },
  
  useCases: [
    {
      level: 'intermediate',
      title: 'Nettoyer après un import multi-fournisseurs',
      description: 'Vous avez importé 500 produits depuis 3 fournisseurs. Certaines images sont identiques mais portent des noms différents.',
      steps: ['Lancez le scan de déduplication', 'Consultez les groupes de doublons détectés', 'Sélectionnez l\'image de meilleure qualité', 'Fusionnez les doublons'],
      expectedOutcome: '10-20% d\'espace récupéré et un catalogue sans images redondantes.'
    }
  ],
  
  stepByStep: [
    { stepNumber: 1, title: 'Accéder à la déduplication', description: 'Naviguez vers Catalogue > Déduplication d\'images.' },
    { stepNumber: 2, title: 'Lancer le scan', description: 'Cliquez "Scanner le catalogue" pour analyser toutes les images.', tip: 'Le scan peut prendre quelques minutes pour les grands catalogues (1000+ images).' },
    { stepNumber: 3, title: 'Ajuster le seuil', description: 'Le curseur de similarité permet de définir le seuil : 95% = quasi-identiques, 80% = très similaires.', warning: 'Un seuil trop bas (<75%) peut détecter des faux positifs.' },
    { stepNumber: 4, title: 'Vérifier les résultats', description: 'Chaque groupe de doublons est affiché avec une prévisualisation côte-à-côte et le score de similarité.' },
    { stepNumber: 5, title: 'Fusionner ou supprimer', description: 'Sélectionnez l\'image à conserver et cliquez "Fusionner" pour remplacer les doublons.' }
  ],
  
  bestPractices: {
    recommendations: [
      { title: 'Commencez avec un seuil élevé (95%)', description: 'Les images à 95%+ de similarité sont presque toujours de vrais doublons. Baissez progressivement.', impact: 'high' },
      { title: 'Scannez après chaque gros import', description: 'Intégrez le scan de déduplication dans votre processus post-import.', impact: 'medium' }
    ],
    pitfalls: [
      { title: 'Seuil trop bas', description: 'Un seuil < 75% détecte des images similaires mais pas identiques (variantes de couleur par ex.).', impact: 'high' },
      { title: 'Fusionner sans vérifier', description: 'Vérifiez toujours la prévisualisation avant de fusionner pour éviter de supprimer la mauvaise image.', impact: 'medium' }
    ]
  },
  
  troubleshooting: [
    { symptom: 'Le scan est très lent', cause: 'Grand nombre d\'images (5000+)', solution: 'Le scan est exécuté en arrière-plan. Vous serez notifié quand il sera terminé.', severity: 'low' },
    { symptom: 'Aucun doublon détecté', cause: 'Seuil trop élevé ou catalogue sans doublons', solution: 'Essayez de baisser le seuil à 85% pour détecter les images très similaires', severity: 'low' }
  ],
  
  expertTips: [
    { title: 'pHash vs MD5', content: 'Le hashing perceptuel (pHash) détecte les images visuellement similaires même avec des résolutions ou compressions différentes, contrairement au MD5 qui ne détecte que les copies binaires identiques.', differentiator: 'ShopOpti+ utilise le pHash pour une détection intelligente au-delà du simple copié-collé.' }
  ],
  
  callToValue: {
    headline: 'Nettoyez votre catalogue en 5 minutes',
    description: 'La déduplication automatique élimine les images redondantes et libère de l\'espace de stockage.',
    metrics: [
      { label: 'Espace récupéré', value: '15-20%', improvement: 'En moyenne' },
      { label: 'Temps de scan', value: '< 5 min', improvement: 'Pour 1000 images' }
    ],
    cta: { label: 'Scanner mon catalogue', route: '/catalog/image-dedup' }
  },
  
  faqs: [
    { question: 'Le scan supprime-t-il automatiquement des images ?', answer: 'Non, le scan détecte uniquement. Vous devez confirmer manuellement chaque fusion ou suppression.' },
    { question: 'Les images fournisseur originales sont-elles affectées ?', answer: 'Non, seules les images dans votre catalogue ShopOpti+ sont concernées.' }
  ],
  
  relatedModules: ['catalog', 'products'],
};
