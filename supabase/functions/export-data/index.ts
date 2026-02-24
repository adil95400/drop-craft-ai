import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { requireAuth, handlePreflight, errorResponse } from '../_shared/jwt-auth.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

// Input validation schemas
const ExportTypeSchema = z.enum(['products', 'orders', 'customers', 'suppliers', 'imported_products'])
const FormatSchema = z.enum(['csv', 'json'])
const FiltersSchema = z.object({
  ids: z.array(z.string().uuid()).optional(),
  status: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
}).optional()

const ExportRequestSchema = z.object({
  type: ExportTypeSchema,
  format: FormatSchema.default('csv'),
  filters: FiltersSchema,
})

serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)

    // 3. Parse and validate input
    const body = await req.json()
    const parseResult = ExportRequestSchema.safeParse(body)
    
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid request',
          details: parseResult.error.flatten()
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { type, format, filters } = parseResult.data

    console.log('[SECURE] Export data:', { type, format, user_id: userId })

    let data
    let tableName = type

    // Map type to actual table name
    if (type === 'products') {
      tableName = 'imported_products'
    }

    // Build query - ALWAYS SCOPED by user_id
    let query = supabase
      .from(tableName)
      .select('*')
      .eq('user_id', userId) // CRITICAL: scope to user

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from)
    }
    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to)
    }

    const { data: queryData, error: queryError } = await query

    if (queryError) throw queryError
    data = queryData

    // Apply ID filter if specified
    if (filters?.ids && Array.isArray(filters.ids)) {
      data = data.filter((item: any) => filters.ids!.includes(item.id))
    }

    // Generate file based on format
    let fileContent: string
    let contentType: string

    if (format === 'csv') {
      if (!data || data.length === 0) {
        throw new Error('No data to export')
      }

      const headers = Object.keys(data[0])
      const csvRows = [
        headers.join(','),
        ...data.map((row: any) =>
          headers.map(header => {
            const value = row[header]
            if (value === null || value === undefined) return ''
            const str = String(value)
            return str.includes(',') || str.includes('"')
              ? `"${str.replace(/"/g, '""')}"`
              : str
          }).join(',')
        )
      ]
      fileContent = csvRows.join('\n')
      contentType = 'text/csv'
    } else if (format === 'json') {
      fileContent = JSON.stringify(data, null, 2)
      contentType = 'application/json'
    } else {
      throw new Error(`Unsupported format: ${format}`)
    }

    // Log security event and activity
    await logSecurityEvent(supabase, userId, 'data_export', 'info', {
      type,
      format,
      count: data.length
    })
    
    await supabase.from('activity_logs').insert({
      user_id: userId, // CRITICAL: from token only
      action: 'data_exported',
      description: `Export ${type} (${format})`,
      entity_type: type,
      metadata: { type, format, count: data.length }
    })

    return new Response(
      fileContent,
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${type}-export-${Date.now()}.${format}"`
        } 
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...getSecureCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  }
})
