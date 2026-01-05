/**
 * Landing Page Builder Service
 * Gestion des landing pages avec éditeur drag-and-drop
 * Adapté à la structure de table existante
 */
import { supabase } from '@/integrations/supabase/client';

export interface PageBlock {
  id: string;
  type: 'hero' | 'features' | 'testimonials' | 'cta' | 'pricing' | 'form' | 'text' | 'image' | 'video' | 'countdown' | 'benefits' | 'faq';
  props: Record<string, any>;
}

export interface LandingPage {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  description?: string;
  page_type?: string;
  content: PageBlock[];
  status: 'draft' | 'published' | 'archived';
  seo_title?: string;
  seo_description?: string;
  og_image?: string;
  template_id?: string;
  version: number;
  published_at?: string;
  published_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePageInput {
  title: string;
  slug?: string;
  description?: string;
  page_type?: string;
  content?: PageBlock[];
  template_id?: string;
}

// Helper to transform DB row to LandingPage
const transformPage = (data: any): LandingPage => {
  let content: PageBlock[] = [];
  try {
    if (Array.isArray(data.content)) {
      content = data.content as PageBlock[];
    } else if (data.content) {
      content = [];
    }
  } catch {
    content = [];
  }
  
  return {
    id: data.id,
    user_id: data.user_id,
    title: data.title,
    slug: data.slug,
    description: data.description,
    page_type: data.page_type,
    content,
    status: data.status || 'draft',
    seo_title: data.seo_title,
    seo_description: data.seo_description,
    og_image: data.og_image,
    template_id: data.template_id,
    version: data.version || 1,
    published_at: data.published_at,
    published_by: data.published_by,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
};

export const LandingPageService = {
  // ========== PAGES ==========

  async getPages(status?: string): Promise<LandingPage[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('landing_pages')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return (data || []).map(transformPage);
  },

  async getPage(pageId: string): Promise<LandingPage> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('id', pageId)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return transformPage(data);
  },

  async createPage(input: CreatePageInput): Promise<LandingPage> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const slug = input.slug || this.generateSlug(input.title);

    const { data, error } = await supabase
      .from('landing_pages')
      .insert({
        user_id: user.id,
        title: input.title,
        slug,
        description: input.description,
        page_type: input.page_type || 'landing',
        content: JSON.parse(JSON.stringify(input.content || [])),
        template_id: input.template_id,
        status: 'draft',
        version: 1
      })
      .select()
      .single();

    if (error) throw error;
    return transformPage(data);
  },

  async updatePage(pageId: string, updates: Partial<LandingPage>): Promise<LandingPage> {
    // Prepare updates for DB
    const dbUpdates: Record<string, any> = {
      updated_at: new Date().toISOString()
    };
    
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.slug !== undefined) dbUpdates.slug = updates.slug;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.page_type !== undefined) dbUpdates.page_type = updates.page_type;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.seo_title !== undefined) dbUpdates.seo_title = updates.seo_title;
    if (updates.seo_description !== undefined) dbUpdates.seo_description = updates.seo_description;
    if (updates.og_image !== undefined) dbUpdates.og_image = updates.og_image;
    if (updates.published_at !== undefined) dbUpdates.published_at = updates.published_at;
    if (updates.content !== undefined) {
      dbUpdates.content = JSON.parse(JSON.stringify(updates.content));
    }

    const { data, error } = await supabase
      .from('landing_pages')
      .update(dbUpdates)
      .eq('id', pageId)
      .select()
      .single();

    if (error) throw error;
    return transformPage(data);
  },

  async deletePage(pageId: string): Promise<void> {
    const { error } = await supabase
      .from('landing_pages')
      .delete()
      .eq('id', pageId);

    if (error) throw error;
  },

  async publishPage(pageId: string): Promise<LandingPage> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('landing_pages')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        published_by: user?.id
      })
      .eq('id', pageId)
      .select()
      .single();

    if (error) throw error;
    return transformPage(data);
  },

  async unpublishPage(pageId: string): Promise<LandingPage> {
    const { data, error } = await supabase
      .from('landing_pages')
      .update({ status: 'draft' })
      .eq('id', pageId)
      .select()
      .single();

    if (error) throw error;
    return transformPage(data);
  },

  async duplicatePage(pageId: string): Promise<LandingPage> {
    const original = await this.getPage(pageId);
    
    return this.createPage({
      title: `${original.title} (copie)`,
      slug: `${original.slug}-copy-${Date.now()}`,
      description: original.description,
      page_type: original.page_type,
      content: original.content
    });
  },

  // ========== CONTENT ==========

  async updateContent(pageId: string, content: PageBlock[]): Promise<LandingPage> {
    return this.updatePage(pageId, { content });
  },

  async addBlock(pageId: string, block: PageBlock, position?: number): Promise<LandingPage> {
    const page = await this.getPage(pageId);
    const newContent = [...page.content];
    
    if (position !== undefined) {
      newContent.splice(position, 0, block);
    } else {
      newContent.push(block);
    }

    return this.updateContent(pageId, newContent);
  },

  async updateBlock(pageId: string, blockId: string, updates: Partial<PageBlock>): Promise<LandingPage> {
    const page = await this.getPage(pageId);
    const newContent = page.content.map(block => 
      block.id === blockId ? { ...block, ...updates } : block
    );

    return this.updateContent(pageId, newContent);
  },

  async removeBlock(pageId: string, blockId: string): Promise<LandingPage> {
    const page = await this.getPage(pageId);
    const newContent = page.content.filter(block => block.id !== blockId);

    return this.updateContent(pageId, newContent);
  },

  async reorderBlocks(pageId: string, blockIds: string[]): Promise<LandingPage> {
    const page = await this.getPage(pageId);
    const blockMap = new Map(page.content.map(b => [b.id, b]));
    const newContent = blockIds.map(id => blockMap.get(id)!).filter(Boolean);

    return this.updateContent(pageId, newContent);
  },

  // ========== HELPERS ==========

  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      + '-' + Date.now().toString(36);
  },

  generateBlockId(): string {
    return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  getDefaultBlockProps(type: PageBlock['type']): Record<string, any> {
    const defaults: Record<string, Record<string, any>> = {
      hero: {
        title: 'Titre de votre page',
        subtitle: 'Sous-titre accrocheur pour vos visiteurs',
        buttonText: 'Découvrir',
        buttonUrl: '#',
        alignment: 'center',
        backgroundType: 'color',
        backgroundColor: '#1a1a2e'
      },
      features: {
        title: 'Nos Caractéristiques',
        columns: 3,
        items: [
          { icon: 'star', title: 'Qualité', description: 'Description de la caractéristique' },
          { icon: 'zap', title: 'Rapidité', description: 'Description de la caractéristique' },
          { icon: 'shield', title: 'Sécurité', description: 'Description de la caractéristique' }
        ]
      },
      testimonials: {
        title: 'Ce que disent nos clients',
        items: [
          { name: 'Client 1', role: 'CEO', quote: 'Témoignage positif...', avatar: '' },
          { name: 'Client 2', role: 'Fondateur', quote: 'Autre témoignage...', avatar: '' }
        ]
      },
      cta: {
        title: 'Prêt à commencer?',
        subtitle: 'Rejoignez des milliers de clients satisfaits',
        buttonText: 'Commencer maintenant',
        buttonUrl: '#',
        variant: 'primary'
      },
      pricing: {
        title: 'Nos Tarifs',
        plans: [
          { name: 'Starter', price: '29€', period: '/mois', features: ['Feature 1', 'Feature 2'], highlighted: false },
          { name: 'Pro', price: '79€', period: '/mois', features: ['Feature 1', 'Feature 2', 'Feature 3'], highlighted: true }
        ]
      },
      form: {
        title: 'Contactez-nous',
        fields: [
          { name: 'name', type: 'text', placeholder: 'Votre nom', required: true },
          { name: 'email', type: 'email', placeholder: 'Votre email', required: true }
        ],
        buttonText: 'Envoyer',
        successMessage: 'Merci pour votre message!'
      },
      text: {
        content: '<p>Votre contenu texte ici...</p>',
        alignment: 'left'
      },
      image: {
        src: '',
        alt: 'Image',
        width: '100%',
        caption: ''
      },
      video: {
        url: '',
        provider: 'youtube',
        autoplay: false
      },
      countdown: {
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        title: 'Offre expire dans:',
        expiredMessage: 'Offre expirée'
      },
      benefits: {
        title: 'Pourquoi nous choisir?',
        items: ['Avantage 1', 'Avantage 2', 'Avantage 3']
      },
      faq: {
        title: 'Questions Fréquentes',
        items: [
          { question: 'Question 1?', answer: 'Réponse 1' },
          { question: 'Question 2?', answer: 'Réponse 2' }
        ]
      }
    };

    return defaults[type] || {};
  },

  // Stats
  async getStats(): Promise<{
    total_pages: number;
    published_pages: number;
    draft_pages: number;
  }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: pages } = await supabase
      .from('landing_pages')
      .select('status')
      .eq('user_id', user.id);

    const allPages = pages || [];

    return {
      total_pages: allPages.length,
      published_pages: allPages.filter(p => p.status === 'published').length,
      draft_pages: allPages.filter(p => p.status === 'draft').length
    };
  }
};
