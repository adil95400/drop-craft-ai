import { supabase } from '@/integrations/supabase/client';

export interface AIContentTemplate {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  content_type: 'description' | 'title' | 'seo' | 'bullet_points';
  prompt_template: string;
  variables: string[];
  tone: 'professional' | 'casual' | 'luxury' | 'technical';
  language: string;
  max_tokens: number;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface AIGeneratedContent {
  id: string;
  user_id: string;
  template_id?: string;
  product_id?: string;
  content_type: string;
  original_content?: string;
  generated_content: string;
  variables_used: Record<string, any>;
  quality_score?: number;
  status: 'draft' | 'approved' | 'applied' | 'rejected';
  applied_at?: string;
  tokens_used?: number;
  generation_time_ms?: number;
  created_at: string;
  product?: { name: string; sku?: string };
  template?: { name: string };
}

export interface AIContentBatch {
  id: string;
  user_id: string;
  template_id?: string;
  name: string;
  product_filter: Record<string, any>;
  total_products: number;
  processed_products: number;
  successful_count: number;
  failed_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  started_at?: string;
  completed_at?: string;
  error_log: any[];
  created_at: string;
}

export const AIContentService = {
  // Templates
  async getTemplates(): Promise<AIContentTemplate[]> {
    const { data, error } = await supabase
      .from('ai_content_templates')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as unknown as AIContentTemplate[];
  },

  async createTemplate(template: Partial<AIContentTemplate>): Promise<AIContentTemplate> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('ai_content_templates')
      .insert({
        name: template.name || 'Nouveau template',
        prompt_template: template.prompt_template || '',
        content_type: template.content_type || 'description',
        description: template.description,
        variables: template.variables || [],
        tone: template.tone || 'professional',
        language: template.language || 'fr',
        max_tokens: template.max_tokens || 500,
        is_active: template.is_active ?? true,
        user_id: user.id
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as unknown as AIContentTemplate;
  },

  async updateTemplate(id: string, updates: Partial<AIContentTemplate>): Promise<AIContentTemplate> {
    const { data, error } = await supabase
      .from('ai_content_templates')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as unknown as AIContentTemplate;
  },

  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('ai_content_templates')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Generated Content
  async getGeneratedContent(filters?: { status?: string; productId?: string }): Promise<AIGeneratedContent[]> {
    let query = supabase
      .from('ai_generated_content')
      .select(`
        *,
        product:products(name, sku),
        template:ai_content_templates(name)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.productId) {
      query = query.eq('product_id', filters.productId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as AIGeneratedContent[];
  },

  async generateContent(productId: string, templateId: string, variables: Record<string, any>): Promise<AIGeneratedContent> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const startTime = Date.now();
    
    // Fetch the template to build the prompt
    const { data: template } = await supabase
      .from('ai_content_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (!template) throw new Error('Template not found');

    // Build prompt from template
    let prompt = template.prompt_template;
    for (const [key, value] of Object.entries(variables)) {
      prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
    }

    // Call the unified-ai edge function for real AI generation
    const { data: aiResponse, error: aiError } = await supabase.functions.invoke('unified-ai', {
      body: {
        action: 'generate',
        prompt,
        maxTokens: template.max_tokens || 500,
        context: `content_type:${template.content_type}, tone:${template.tone || 'professional'}, language:${template.language || 'fr'}`,
      }
    });

    if (aiError) throw new Error(`AI generation failed: ${aiError.message}`);
    
    const generatedText = aiResponse?.content || aiResponse?.text || `[AI generation error - no content returned]`;
    const tokensUsed = aiResponse?.usage?.total_tokens || 0;
    
    const { data, error } = await supabase
      .from('ai_generated_content')
      .insert({
        user_id: user.id,
        template_id: templateId,
        product_id: productId,
        content_type: template.content_type,
        generated_content: generatedText,
        variables_used: variables,
        quality_score: aiResponse?.quality_score || null,
        status: 'draft',
        tokens_used: tokensUsed,
        generation_time_ms: Date.now() - startTime
      })
      .select()
      .single();
    
    if (error) throw error;

    // Increment template usage count (non-critical, fire-and-forget)
    try {
      await (supabase.rpc as any)('increment_usage_counter', {
        p_user_id: user.id,
        p_counter_key: `template_${templateId}`,
      });
    } catch { /* non-critical */ }

    return data as unknown as AIGeneratedContent;
  },

  async updateContentStatus(id: string, status: AIGeneratedContent['status']): Promise<void> {
    const updates: any = { status };
    if (status === 'applied') {
      updates.applied_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('ai_generated_content')
      .update(updates)
      .eq('id', id);
    
    if (error) throw error;
  },

  // Batches
  async getBatches(): Promise<AIContentBatch[]> {
    const { data, error } = await supabase
      .from('ai_content_batches')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as unknown as AIContentBatch[];
  },

  async createBatch(batch: Partial<AIContentBatch>): Promise<AIContentBatch> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('ai_content_batches')
      .insert({
        name: batch.name || 'Nouveau batch',
        template_id: batch.template_id,
        product_filter: batch.product_filter || {},
        total_products: batch.total_products || 0,
        user_id: user.id
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as unknown as AIContentBatch;
  },

  async getContentStats(): Promise<{
    totalGenerated: number;
    pendingApproval: number;
    applied: number;
    avgQualityScore: number;
  }> {
    const { data, error } = await supabase
      .from('ai_generated_content')
      .select('status, quality_score');

    if (error) throw error;

    const contents = data || [];
    const scores = contents.filter(c => c.quality_score).map(c => c.quality_score as number);

    return {
      totalGenerated: contents.length,
      pendingApproval: contents.filter(c => c.status === 'draft').length,
      applied: contents.filter(c => c.status === 'applied').length,
      avgQualityScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    };
  }
};
