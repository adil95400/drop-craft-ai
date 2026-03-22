/**
 * AI Compliance & Security — Phase 5.4
 * Multi-jurisdiction compliance, automated audit, threat detection, privacy management
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { requireAuth, handlePreflight, errorResponse, successResponse } from '../_shared/jwt-auth.ts'
import { generateJSON } from '../_shared/ai-client.ts'

serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const ctx = await requireAuth(req)
    const body = await req.json()
    const { action, ...params } = body

    switch (action) {
      case 'compliance_audit': return handleComplianceAudit(ctx, params)
      case 'threat_assessment': return handleThreatAssessment(ctx, params)
      case 'privacy_scan': return handlePrivacyScan(ctx, params)
      case 'regulatory_report': return handleRegulatoryReport(ctx, params)
      default:
        return errorResponse(`Unknown action: ${action}`, ctx.corsHeaders)
    }
  } catch (e) {
    if (e instanceof Response) return e
    console.error('Compliance & Security error:', e)
    return new Response(JSON.stringify({ success: false, error: 'Internal error' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
})

async function callAI(systemPrompt: string, userPrompt: string) {
  return generateJSON(systemPrompt, userPrompt, { module: 'automation', temperature: 0.3, enableCache: true })
}

async function handleComplianceAudit(ctx: any, params: any) {
  const { jurisdictions = ['GDPR', 'CCPA'] } = params

  const { data: auditLogs } = await ctx.supabase
    .from('audit_logs')
    .select('action, action_category, severity, resource_type, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  const { data: securityEvents } = await ctx.supabase
    .from('security_events')
    .select('event_type, severity, description, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  const { data: customers } = await ctx.supabase
    .from('customers')
    .select('id', { count: 'exact', head: true })

  const result = await callAI(
    `You are a compliance auditor specializing in e-commerce regulations. Perform a comprehensive compliance audit. Return JSON:
    { "compliance_score": number (0-100),
      "status": "compliant"|"partial"|"non_compliant",
      "by_jurisdiction": [{ "jurisdiction": string, "score": number, "status": string,
        "findings": [{ "category": string, "finding": string, "severity": "critical"|"high"|"medium"|"low", "remediation": string }] }],
      "data_handling": { "consent_management": string, "data_retention": string, "right_to_erasure": string, "data_portability": string },
      "audit_trail_assessment": { "completeness": number, "gaps": [...] },
      "action_items": [{ "priority": number, "item": string, "deadline": string, "responsible": string }] }`,
    `Jurisdictions: ${JSON.stringify(jurisdictions)}.
    Audit logs (${auditLogs?.length || 0} entries): ${JSON.stringify(auditLogs?.slice(0, 100) || [])}.
    Security events: ${JSON.stringify(securityEvents?.slice(0, 50) || [])}.
    Customer data count: ${customers?.length || 0}.`
  )

  return successResponse({ audit: result }, ctx.corsHeaders)
}

async function handleThreatAssessment(ctx: any, params: any) {
  const { data: securityEvents } = await ctx.supabase
    .from('security_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  const { data: apiLogs } = await ctx.supabase
    .from('api_logs')
    .select('endpoint, method, status_code, ip_address, created_at')
    .in('status_code', [401, 403, 429, 500])
    .order('created_at', { ascending: false })
    .limit(100)

  const { data: activityLogs } = await ctx.supabase
    .from('activity_logs')
    .select('action, severity, ip_address, user_agent, created_at')
    .eq('severity', 'warn')
    .order('created_at', { ascending: false })
    .limit(50)

  const result = await callAI(
    `You are a cybersecurity threat analyst. Assess security threats and vulnerabilities. Return JSON:
    { "threat_level": "low"|"medium"|"high"|"critical",
      "risk_score": number (0-100),
      "active_threats": [{ "type": string, "severity": string, "description": string, "indicators": [...], "mitigation": string }],
      "vulnerability_assessment": [{ "area": string, "vulnerability": string, "exploitability": "easy"|"moderate"|"hard", "fix": string }],
      "suspicious_activity": [{ "pattern": string, "frequency": number, "risk": string, "action": string }],
      "security_posture": { "strengths": [...], "weaknesses": [...], "recommendations": [...] } }`,
    `Security events: ${JSON.stringify(securityEvents?.slice(0, 100) || [])}.
    Failed/blocked API calls: ${JSON.stringify(apiLogs || [])}.
    Warning activity: ${JSON.stringify(activityLogs || [])}.`
  )

  return successResponse({ threat_assessment: result }, ctx.corsHeaders)
}

async function handlePrivacyScan(ctx: any, params: any) {
  const { data: customers } = await ctx.supabase
    .from('customers')
    .select('id, email, phone, address, created_at, updated_at')
    .limit(10) // minimal PII sampling

  const { data: auditLogs } = await ctx.supabase
    .from('audit_logs')
    .select('action, resource_type, created_at')
    .in('action', ['customer_data_anonymized', 'user_data_exported', 'customer_created', 'customer_updated', 'customer_deleted'])
    .order('created_at', { ascending: false })
    .limit(50)

  const result = await callAI(
    `You are a privacy officer. Scan for PII exposure risks and data privacy compliance. Return JSON:
    { "privacy_score": number (0-100),
      "pii_inventory": [{ "data_type": string, "location": string, "sensitivity": "high"|"medium"|"low", "encrypted": boolean, "retention_policy": string }],
      "risks": [{ "risk": string, "severity": string, "affected_records": string, "remediation": string }],
      "consent_status": { "collected": boolean, "documented": boolean, "withdrawable": boolean },
      "data_subject_rights": { "access": string, "rectification": string, "erasure": string, "portability": string },
      "recommendations": [{ "priority": number, "action": string, "compliance_impact": string }] }`,
    `Customer data sample structure (${customers?.length || 0} sampled): ${JSON.stringify(customers?.map(c => ({ has_email: !!c.email, has_phone: !!c.phone, has_address: !!c.address })) || [])}.
    Privacy-related audit logs: ${JSON.stringify(auditLogs || [])}.`
  )

  return successResponse({ privacy_scan: result }, ctx.corsHeaders)
}

async function handleRegulatoryReport(ctx: any, params: any) {
  const { regulation, period = '30d' } = params

  const { data: auditStats } = await ctx.supabase.rpc('get_audit_statistics', { p_days: 30 })

  const result = await callAI(
    `You are a regulatory compliance reporter. Generate a formal compliance report. Return JSON:
    { "report": { "title": string, "regulation": string, "period": string, "generated_at": string,
        "executive_summary": string,
        "compliance_status": "compliant"|"partial"|"non_compliant",
        "sections": [{ "title": string, "status": string, "findings": [...], "evidence": [...], "recommendations": [...] }],
        "metrics": { "total_audited_events": number, "compliance_rate": number, "incidents": number, "resolved": number },
        "remediation_plan": [{ "item": string, "deadline": string, "status": string }],
        "certification_readiness": number } }`,
    `Regulation: ${regulation || 'GDPR'}. Period: ${period}.
    Audit statistics: ${JSON.stringify(auditStats || {})}.`
  )

  return successResponse({ report: result }, ctx.corsHeaders)
}
