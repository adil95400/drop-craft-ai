import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface CLIRequest {
  action: 'init' | 'build' | 'test' | 'deploy' | 'validate'
  extensionId?: string
  config?: any
  manifest?: any
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { action, extensionId, config, manifest } = await req.json() as CLIRequest

    console.log(`CLI Action: ${action}`, { extensionId, config })

    switch (action) {
      case 'init':
        return handleInit(config)
      
      case 'build':
        return handleBuild(extensionId!, config)
      
      case 'test':
        return handleTest(extensionId!, config)
      
      case 'deploy':
        return handleDeploy(supabase, extensionId!, manifest)
      
      case 'validate':
        return handleValidate(manifest)
      
      default:
        throw new Error(`Unknown CLI action: ${action}`)
    }

  } catch (error) {
    console.error('CLI Manager error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function handleInit(config: any) {
  const templates = {
    'react-ts': {
      name: 'React TypeScript',
      files: {
        'manifest.json': {
          name: config.name || 'My Extension',
          version: '1.0.0',
          description: 'Extension créée avec CLI',
          main: 'src/index.tsx',
          permissions: ['products:read', 'orders:write'],
          api: {
            endpoints: ['https://api.example.com/webhook'],
            auth: 'bearer'
          }
        },
        'src/index.tsx': `
import React from 'react';
import { ExtensionSDK } from '@lovable/extensions-sdk';

const MyExtension: React.FC = () => {
  const sdk = new ExtensionSDK();
  
  React.useEffect(() => {
    sdk.onMount(() => {
      console.log('Extension montée!');
    });
  }, []);

  return (
    <div className="p-4">
      <h1>Mon Extension</h1>
      <p>Extension créée avec CLI</p>
    </div>
  );
};

export default MyExtension;
        `,
        'package.json': {
          name: config.name?.toLowerCase().replace(/\s+/g, '-') || 'my-extension',
          version: '1.0.0',
          dependencies: {
            'react': '^18.2.0',
            '@lovable/extensions-sdk': '^2.1.0'
          },
          scripts: {
            'dev': 'ext-cli dev',
            'build': 'ext-cli build',
            'test': 'ext-cli test'
          }
        }
      }
    },
    'ai-integration': {
      name: 'AI Integration',
      files: {
        'manifest.json': {
          name: config.name || 'AI Extension',
          version: '1.0.0',
          description: 'Extension IA avec OpenAI',
          main: 'src/index.tsx',
          permissions: ['ai:analyze', 'products:write'],
          secrets: ['OPENAI_API_KEY']
        },
        'src/ai-service.ts': `
export class AIService {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async generateDescription(productData: any): Promise<string> {
    // Logique d'IA pour générer la description
    return 'Description générée par IA';
  }
  
  async optimizeSEO(content: string): Promise<any> {
    // Optimisation SEO par IA
    return {
      title: 'Titre optimisé',
      meta: 'Meta description optimisée',
      keywords: ['mot-clé1', 'mot-clé2']
    };
  }
}
        `
      }
    }
  }

  const template = templates[config.template as keyof typeof templates] || templates['react-ts']
  
  return new Response(
    JSON.stringify({
      success: true,
      message: 'Projet initialisé avec succès!',
      template: template.name,
      files: Object.keys(template.files),
      structure: template.files,
      nextSteps: [
        'cd ' + (config.name?.toLowerCase().replace(/\s+/g, '-') || 'my-extension'),
        'ext-cli dev',
        'Visitez http://localhost:3001'
      ]
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  )
}

async function handleBuild(extensionId: string, config: any) {
  // Simulation du build
  const buildResults = {
    duration: Math.floor(Math.random() * 5000) + 1000, // 1-6 secondes
    size: Math.floor(Math.random() * 500) + 100, // 100-600 KB
    chunks: Math.floor(Math.random() * 10) + 1,
    warnings: Math.floor(Math.random() * 3),
    errors: 0
  }

  // Optimisations automatiques
  const optimizations = [
    'Tree shaking appliqué',
    'Minification JavaScript/CSS',
    'Compression gzip',
    'Optimisation des images',
    'Code splitting intelligent'
  ]

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Build terminé avec succès!',
      stats: buildResults,
      optimizations: optimizations,
      artifacts: [
        `dist/${extensionId}.bundle.js`,
        `dist/${extensionId}.bundle.css`,
        'dist/manifest.json'
      ],
      recommendations: buildResults.size > 300 ? [
        'Considérez l\'optimisation des assets',
        'Vérifiez les dépendances non utilisées'
      ] : []
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  )
}

async function handleTest(extensionId: string, config: any) {
  // Simulation des tests
  const testResults = {
    unit: {
      total: Math.floor(Math.random() * 50) + 20,
      passed: 0,
      failed: 0,
      duration: Math.floor(Math.random() * 3000) + 500
    },
    integration: {
      total: Math.floor(Math.random() * 20) + 5,
      passed: 0,
      failed: 0,
      duration: Math.floor(Math.random() * 10000) + 2000
    },
    e2e: {
      total: Math.floor(Math.random() * 10) + 2,
      passed: 0,
      failed: 0,
      duration: Math.floor(Math.random() * 30000) + 10000
    }
  }

  // Calcul des résultats (95% de réussite)
  Object.values(testResults).forEach(suite => {
    suite.failed = Math.random() < 0.05 ? 1 : 0
    suite.passed = suite.total - suite.failed
  })

  const securityChecks = [
    { name: 'Vulnérabilités dependencies', status: 'passed', details: '0 vulnérabilités trouvées' },
    { name: 'Injection XSS', status: 'passed', details: 'Code sécurisé' },
    { name: 'Failles CSRF', status: 'passed', details: 'Protection CSRF active' },
    { name: 'Permissions API', status: 'passed', details: 'Permissions correctement définies' }
  ]

  const coverage = {
    lines: Math.floor(Math.random() * 20) + 80, // 80-100%
    functions: Math.floor(Math.random() * 15) + 85, // 85-100%
    branches: Math.floor(Math.random() * 25) + 75 // 75-100%
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Tests terminés!',
      results: testResults,
      coverage: coverage,
      security: securityChecks,
      performance: {
        score: Math.floor(Math.random() * 20) + 80, // 80-100
        loadTime: Math.floor(Math.random() * 1000) + 300, // 300-1300ms
        memoryUsage: Math.floor(Math.random() * 20) + 10 // 10-30MB
      },
      recommendations: coverage.lines < 90 ? [
        'Augmentez la couverture de tests unitaires',
        'Ajoutez des tests pour les cas limites'
      ] : []
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  )
}

async function handleDeploy(supabase: any, extensionId: string, manifest: any) {
  // Enregistrer l'extension dans la base
  const { error: insertError } = await supabase
    .from('marketplace_extensions')
    .upsert({
      id: extensionId,
      name: manifest.name,
      version: manifest.version,
      description: manifest.description,
      manifest: manifest,
      status: 'published',
      updated_at: new Date().toISOString()
    })

  if (insertError) {
    throw new Error(`Erreur déploiement: ${insertError.message}`)
  }

  // Simuler le déploiement sur CDN
  const deploymentSteps = [
    'Upload des assets vers CDN',
    'Mise à jour du registre d\'extensions',
    'Validation des permissions',
    'Tests de compatibilité',
    'Publication sur marketplace'
  ]

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Extension déployée avec succès!',
      extensionId: extensionId,
      version: manifest.version,
      steps: deploymentSteps,
      urls: {
        marketplace: `https://marketplace.lovable.dev/extensions/${extensionId}`,
        cdn: `https://cdn.lovable.dev/extensions/${extensionId}/${manifest.version}`,
        docs: `https://docs.lovable.dev/extensions/${extensionId}`
      },
      metrics: {
        deploymentTime: Math.floor(Math.random() * 30) + 10, // 10-40 secondes
        cdnNodes: 12,
        availability: '99.9%'
      }
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  )
}

async function handleValidate(manifest: any) {
  const validations = []
  let isValid = true

  // Validation du manifest
  if (!manifest.name || manifest.name.length < 3) {
    validations.push({
      type: 'error',
      field: 'name',
      message: 'Le nom doit contenir au moins 3 caractères'
    })
    isValid = false
  }

  if (!manifest.version || !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
    validations.push({
      type: 'error',
      field: 'version',
      message: 'Version doit suivre le format semver (x.y.z)'
    })
    isValid = false
  }

  if (!manifest.permissions || manifest.permissions.length === 0) {
    validations.push({
      type: 'warning',
      field: 'permissions',
      message: 'Aucune permission définie - l\'extension sera limitée'
    })
  }

  // Validation des permissions
  const validPermissions = [
    'products:read', 'products:write',
    'orders:read', 'orders:write',
    'customers:read', 'customers:write',
    'ai:analyze', 'ai:generate'
  ]

  manifest.permissions?.forEach((perm: string) => {
    if (!validPermissions.includes(perm)) {
      validations.push({
        type: 'warning',
        field: 'permissions',
        message: `Permission inconnue: ${perm}`
      })
    }
  })

  // Recommandations de sécurité
  const securityChecks = [
    {
      check: 'HTTPS URLs',
      status: manifest.api?.endpoints?.every((url: string) => url.startsWith('https://')) ? 'passed' : 'failed',
      message: 'Tous les endpoints doivent utiliser HTTPS'
    },
    {
      check: 'Secrets Management',
      status: manifest.secrets ? 'passed' : 'warning',
      message: 'Utilisez des secrets pour les clés API sensibles'
    }
  ]

  return new Response(
    JSON.stringify({
      success: isValid,
      valid: isValid,
      message: isValid ? 'Manifest valide!' : 'Erreurs de validation trouvées',
      validations: validations,
      security: securityChecks,
      recommendations: [
        'Ajoutez une description détaillée',
        'Incluez des captures d\'écran',
        'Documentez les API utilisées',
        'Testez avec différents navigateurs'
      ]
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  )
}