
-- Landing page dynamic content
CREATE TABLE public.landing_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL,
  content_key TEXT NOT NULL,
  content_value JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(section, content_key)
);

-- No RLS needed — public read-only content
ALTER TABLE public.landing_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active landing content"
  ON public.landing_content FOR SELECT
  USING (is_active = true);

-- Seed testimonials
INSERT INTO public.landing_content (section, content_key, content_value, sort_order) VALUES
('testimonials', 'testimonial_1', '{"quote": "ShopOpti+ saved me 20 hours a week. My revenue went up 40% in just 2 months.", "author": "Marie D.", "role": "Shopify merchant, €50K/mo", "avatar": "M", "metric": "+40% revenue"}', 1),
('testimonials', 'testimonial_2', '{"quote": "The AI pricing alone paid for itself in the first week. It automatically adjusts my margins based on demand.", "author": "Thomas M.", "role": "Dropshipping pro, 3 stores", "avatar": "T", "metric": "3x ROI in 7 days"}', 2),
('testimonials', 'testimonial_3', '{"quote": "We manage 30+ client stores through ShopOpti+. The multi-tenant setup and API are enterprise-grade.", "author": "Sophie L.", "role": "CEO, E-commerce Agency", "avatar": "S", "metric": "30+ stores managed"}', 3);

-- Seed social proof metrics
INSERT INTO public.landing_content (section, content_key, content_value) VALUES
('social_proof', 'metrics', '{"merchantCount": "2,000+", "timeSaved": "20h+", "supplierCount": "99+", "rating": "4.8/5", "reviewCount": 247}');

-- Seed pricing plans
INSERT INTO public.landing_content (section, content_key, content_value, sort_order) VALUES
('pricing', 'basic', '{"name": "Basic", "monthlyPrice": 29, "annualPrice": 23, "desc": "For new merchants getting started", "features": ["500 products", "1 store", "AI optimization", "Email support", "Basic analytics"], "cta": "Start Free Trial", "popular": false}', 1),
('pricing', 'pro', '{"name": "Pro", "monthlyPrice": 79, "annualPrice": 63, "desc": "For growing stores ready to scale", "features": ["10,000 products", "Unlimited stores", "Advanced AI + Predictive Analytics", "Priority support 24/7", "Marketing automation", "Competitor tracking"], "cta": "Start Free Trial", "popular": true}', 2),
('pricing', 'ultra_pro', '{"name": "Ultra Pro", "monthlyPrice": 199, "annualPrice": 159, "desc": "For power sellers & agencies", "features": ["Unlimited products", "Multi-tenant dashboard", "Dedicated REST API", "Account manager", "Custom integrations", "White-label options"], "cta": "Contact Sales", "popular": false, "contactSales": true}', 3);
