import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'
import { withErrorHandler, ValidationError } from '../_shared/error-handler.ts'
import { parseJsonValidated, z } from '../_shared/validators.ts'

const BodySchema = z.object({
  extension_id: z.string().min(1, 'extension_id required'),
  job_type: z.string().min(1, 'job_type required'),
  parameters: z.record(z.unknown()).optional()
})

serve(
  withErrorHandler(async (req) => {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    const { extension_id, job_type, parameters } = await parseJsonValidated(req, BodySchema)
    
    console.log(`🔄 Extension sync: ${job_type} for ${extension_id}`)

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 2000))

    const result = {
      success: true,
      job_type,
      extension_id,
      items_processed: Math.floor(Math.random() * 100) + 10,
      execution_time: 2000
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  }, corsHeaders)
)
