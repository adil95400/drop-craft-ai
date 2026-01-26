import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-version',
}

const CURRENT_VERSION = '5.7.0'
const MIN_SUPPORTED_VERSION = '5.0.0'

interface VersionInfo {
  current: string
  latest: string
  updateAvailable: boolean
  updateRequired: boolean
  changelog: string[]
  downloadUrl: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const currentVersion = req.headers.get('x-extension-version') || '0.0.0'

    // Compare versions
    const updateAvailable = compareVersions(CURRENT_VERSION, currentVersion) > 0
    const updateRequired = compareVersions(MIN_SUPPORTED_VERSION, currentVersion) > 0

    // Get changelog
    const { data: changelog } = await supabase
      .from('extension_versions')
      .select('version, release_notes, released_at')
      .gt('version', currentVersion)
      .order('released_at', { ascending: false })

    const versionInfo: VersionInfo = {
      current: currentVersion,
      latest: CURRENT_VERSION,
      updateAvailable,
      updateRequired,
      changelog: changelog?.map(v => `v${v.version}: ${v.release_notes}`) || [
        'v1.2.0: Amélioration de la synchronisation temps réel',
        'v1.1.0: Ajout du système d\'authentification sécurisé',
        'v1.0.0: Version initiale avec scraping automatique'
      ],
      downloadUrl: `${supabaseUrl}/functions/v1/extension-download`
    }

    // Log version check
    await supabase.from('extension_analytics').insert({
      event_type: 'version_check',
      event_data: {
        current_version: currentVersion,
        latest_version: CURRENT_VERSION,
        update_available: updateAvailable,
        update_required: updateRequired
      }
    })

    // If update required, send notification
    if (updateRequired) {
      console.log(`⚠️ Critical update required for version ${currentVersion}`)
    }

    return new Response(
      JSON.stringify(versionInfo),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Version check error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number)
  const parts2 = v2.split('.').map(Number)
  
  for (let i = 0; i < 3; i++) {
    if (parts1[i] > parts2[i]) return 1
    if (parts1[i] < parts2[i]) return -1
  }
  
  return 0
}
