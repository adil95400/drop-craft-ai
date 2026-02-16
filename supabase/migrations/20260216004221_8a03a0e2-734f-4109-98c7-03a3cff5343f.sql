
-- Gamification: user achievements & XP tracking
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Gamification: XP & level tracking
CREATE TABLE public.user_gamification (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  streak_days INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE DEFAULT CURRENT_DATE,
  total_actions INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own gamification" ON public.user_gamification
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own gamification" ON public.user_gamification
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own gamification" ON public.user_gamification
  FOR UPDATE USING (auth.uid() = user_id);

-- Feature discovery: track which tutorials/tips user has seen
CREATE TABLE public.user_feature_discovery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  feature_id TEXT NOT NULL,
  seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  dismissed BOOLEAN DEFAULT false,
  UNIQUE(user_id, feature_id)
);

ALTER TABLE public.user_feature_discovery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feature discovery" ON public.user_feature_discovery
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own feature discovery" ON public.user_feature_discovery
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own feature discovery" ON public.user_feature_discovery
  FOR UPDATE USING (auth.uid() = user_id);
