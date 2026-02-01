import type { ModuleDocumentation } from '../types';

export const automationDocumentation: ModuleDocumentation = {
  id: 'automation',
  slug: 'automation',
  title: 'Automatisation & Workflows',
  subtitle: 'Studio d\'automatisation no-code',
  description: 'Le module Automatisation vous permet de créer des workflows qui s\'exécutent automatiquement en réponse à des événements. Éliminez les tâches répétitives et laissez ShopOpti+ travailler pour vous 24/7.',
  icon: 'Zap',
  category: 'automation',
  routes: ['/automation', '/automation/workflows', '/automation/rules', '/automation/logs'],
  
  minPlan: 'pro',
  targetLevels: ['advanced', 'expert'],
  estimatedReadTime: 20,
  lastUpdated: '2025-02-01',
  version: '2.0',
  tags: ['automatisation', 'workflows', 'règles', 'triggers', 'actions', 'no-code'],
  
  overview: {
    purpose: 'Automatiser les tâches répétitives et les processus métier. Créez des automatisations IF/THEN sans code qui réagissent aux événements (nouvelle commande, stock bas, nouveau produit...).',
    whenToUse: 'Dès que vous faites une tâche répétitive plus de 3 fois. L\'automatisation libère du temps pour les tâches à haute valeur ajoutée.',
    targetAudience: 'Gestionnaires e-commerce cherchant à scaler sans augmenter les effectifs, ops managers, fondateurs solo.',
    prerequisites: [
      'Plan Pro ou Ultra Pro',
      'Comprendre les concepts de trigger/action',
      'Avoir des processus définis à automatiser'
    ],
    keyFeatures: [
      'Builder de workflows visuel drag & drop',
      '50+ triggers disponibles (événements produits, commandes, stocks...)',
      '30+ actions (email, Slack, modification produit, création tâche...)',
      'Conditions avancées (AND/OR, comparaisons, regex)',
      'Logs d\'exécution détaillés',
      'Templates pré-configurés',
      'Webhooks entrants/sortants'
    ]
  },
  
  useCases: [
    {
      level: 'advanced',
      title: 'Alerter sur stock bas',
      description: 'Vous voulez être notifié quand un produit passe sous 10 unités.',
      steps: [
        'Accédez à Automatisation > Créer un workflow',
        'Trigger: "Stock modifié"',
        'Condition: stock < 10 ET produit.status = "actif"',
        'Action: Envoyer email + Notification Slack',
        'Activez et testez'
      ],
      expectedOutcome: 'Plus jamais de rupture non anticipée.'
    },
    {
      level: 'advanced',
      title: 'Auto-enrichir les nouveaux produits',
      description: 'Chaque nouveau produit importé doit être automatiquement enrichi par l\'IA.',
      steps: [
        'Trigger: "Produit créé"',
        'Condition: description.length < 100 OU attributs.manquants > 3',
        'Action: "Enrichir avec IA" (description, attributs)',
        'Action: "Ajouter tag" = "enrichi-auto"'
      ],
      expectedOutcome: 'Tous les nouveaux produits sont enrichis sans intervention.'
    },
    {
      level: 'expert',
      title: 'Workflow complet de traitement commande',
      description: 'Orchestrer le traitement d\'une commande de A à Z automatiquement.',
      steps: [
        'Trigger: "Nouvelle commande"',
        'Action: Vérifier stock',
        'Branche SI stock OK: Passer commande fournisseur + Générer étiquette + Notifier client',
        'Branche SI stock KO: Créer tâche "Contacter client" + Alerte équipe',
        'Action finale: Logger dans CRM'
      ],
      expectedOutcome: 'Traitement 100% automatique pour 80% des commandes.'
    }
  ],
  
  stepByStep: [
    {
      stepNumber: 1,
      title: 'Accéder au studio d\'automatisation',
      description: 'Le studio affiche vos workflows existants avec leur statut (actif/pause) et les stats d\'exécution. Cliquez "Créer" pour un nouveau workflow.',
      tip: 'Explorez les templates pour démarrer rapidement.'
    },
    {
      stepNumber: 2,
      title: 'Choisir le trigger',
      description: 'Le trigger est l\'événement déclencheur: nouvelle commande, stock modifié, produit créé, heure planifiée... Vous ne pouvez avoir qu\'un trigger par workflow.',
      tip: 'Utilisez "Webhook entrant" pour déclencher depuis des outils externes.'
    },
    {
      stepNumber: 3,
      title: 'Ajouter des conditions',
      description: 'Les conditions filtrent les exécutions. Ex: "SI commande.total > 100€ ET client.type = VIP". Sans condition, le workflow s\'exécute à chaque trigger.',
      tip: 'Combinez AND/OR pour des logiques complexes. Testez vos conditions sur des données réelles.'
    },
    {
      stepNumber: 4,
      title: 'Définir les actions',
      description: 'Les actions sont ce que fait le workflow: modifier un produit, envoyer un email, appeler une API, créer une tâche... Chaînez plusieurs actions.',
      tip: 'L\'ordre des actions compte. Elles s\'exécutent séquentiellement.',
      warning: 'Évitez les boucles infinies (action qui déclenche son propre trigger).'
    },
    {
      stepNumber: 5,
      title: 'Tester le workflow',
      description: 'Cliquez "Tester" pour simuler une exécution avec des données de test. Vérifiez que chaque étape s\'exécute comme prévu.',
      tip: 'Le mode debug affiche chaque étape en temps réel.'
    },
    {
      stepNumber: 6,
      title: 'Activer et monitorer',
      description: 'Une fois testé, activez le workflow. L\'onglet Logs affiche chaque exécution avec succès/échec et détails.',
      tip: 'Configurez des alertes email si un workflow échoue plus de 3 fois.'
    }
  ],
  
  bestPractices: {
    recommendations: [
      {
        title: 'Commencez simple',
        description: 'Votre premier workflow devrait avoir 1 trigger, 0-1 condition, 1 action. Complexifiez progressivement.',
        impact: 'high'
      },
      {
        title: 'Nommez clairement',
        description: 'Un nom comme "Auto-enrich-new-products" est clair. "Workflow 1" ne l\'est pas.',
        impact: 'medium'
      },
      {
        title: 'Utilisez les tags pour le debugging',
        description: 'Ajoutez un tag "auto-traité" aux éléments traités par un workflow. Facilite le suivi.',
        impact: 'medium'
      },
      {
        title: 'Documentez vos workflows',
        description: 'Ajoutez une description expliquant pourquoi ce workflow existe et ce qu\'il fait.',
        impact: 'medium'
      }
    ],
    pitfalls: [
      {
        title: 'Boucles infinies',
        description: 'Un workflow qui modifie un produit peut déclencher un workflow sur modification. Utilisez des conditions de sortie.',
        impact: 'high'
      },
      {
        title: 'Trop de workflows non monitorés',
        description: '50 workflows dont 30 échouent silencieusement = chaos. Surveillez les logs.',
        impact: 'high'
      },
      {
        title: 'Automatiser sans comprendre le processus',
        description: 'Automatiser un mauvais processus = amplifier les problèmes. Optimisez d\'abord manuellement.',
        impact: 'medium'
      }
    ]
  },
  
  troubleshooting: [
    {
      symptom: 'Le workflow ne se déclenche pas',
      cause: 'Workflow désactivé, condition trop restrictive ou trigger mal configuré',
      solution: 'Vérifiez que le workflow est actif. Testez sans condition pour isoler le problème.',
      severity: 'medium'
    },
    {
      symptom: 'L\'action échoue avec erreur',
      cause: 'Données manquantes, permissions insuffisantes ou service externe down',
      solution: 'Consultez les logs détaillés. Vérifiez que les données requises sont présentes.',
      severity: 'medium'
    },
    {
      symptom: 'Le workflow s\'exécute en boucle',
      cause: 'L\'action déclenche le même trigger sans condition de sortie',
      solution: 'Ajoutez une condition "tag != traité" et ajoutez le tag en fin de workflow.',
      severity: 'high'
    },
    {
      symptom: 'Les emails ne sont pas envoyés',
      cause: 'Limite quotidienne atteinte ou configuration email incorrecte',
      solution: 'Vérifiez les quotas dans Paramètres > Email. Testez la configuration SMTP.',
      severity: 'medium'
    }
  ],
  
  expertTips: [
    {
      title: 'Pensez en "événements métier"',
      content: 'Ne pensez pas "clic utilisateur" mais "commande validée", "client fidélisé", "produit populaire". Les bons workflows reflètent des événements business.',
      differentiator: 'ShopOpti+ génère des événements métier de haut niveau, pas juste des CRUD techniques.'
    },
    {
      title: 'Combinez avec l\'IA',
      content: 'L\'action "Décision IA" analyse le contexte et choisit la branche à suivre. Ex: "Client mécontent ? → Route vers SAV prioritaire."',
      differentiator: 'L\'IA peut être un nœud de décision dans vos workflows.'
    },
    {
      title: 'Versionnez vos workflows',
      content: 'Avant de modifier un workflow critique, dupliquez-le. Si la nouvelle version échoue, revenez à l\'ancienne.',
      differentiator: 'Historique des versions avec rollback en 1 clic.'
    }
  ],
  
  callToValue: {
    headline: 'Libérez 20h/semaine grâce à l\'automatisation',
    description: 'Les utilisateurs ShopOpti+ automatisent en moyenne 40 tâches répétitives par semaine. C\'est 20h de temps retrouvé pour la stratégie et la croissance.',
    metrics: [
      { label: 'Temps économisé', value: '20h/sem', improvement: '' },
      { label: 'Tâches automatisées', value: '40+/sem', improvement: '' },
      { label: 'Erreurs humaines', value: '-85%', improvement: '' }
    ],
    cta: {
      label: 'Créer un workflow',
      route: '/automation'
    }
  },
  
  faqs: [
    {
      question: 'Combien de workflows puis-je créer ?',
      answer: 'Pro: 50 workflows actifs. Ultra Pro: illimité. Les workflows désactivés ne comptent pas.'
    },
    {
      question: 'Les workflows s\'exécutent-ils en temps réel ?',
      answer: 'Oui, les triggers événementiels (nouvelle commande...) s\'exécutent en < 30 secondes. Les triggers planifiés s\'exécutent à l\'heure configurée.'
    },
    {
      question: 'Puis-je connecter des outils externes ?',
      answer: 'Oui via webhooks. Déclenchez des workflows depuis n\'importe quel outil (Zapier, Make...) et appelez des APIs externes en action.'
    }
  ],
  
  relatedModules: ['ai', 'orders', 'products', 'marketing'],
  externalResources: [
    { label: 'Templates d\'automatisation', url: '/templates/automation' },
    { label: 'Webinaire: Automatiser son e-commerce', url: '/academy/automation-masterclass' }
  ]
};
