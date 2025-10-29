-- =====================================================
-- ACADEMY SYSTEM - Version Complète
-- Tables pour système de formation complet
-- =====================================================

-- Table des cours
CREATE TABLE public.academy_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  thumbnail_url TEXT,
  thumbnail_emoji TEXT,
  category TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  duration_minutes INTEGER NOT NULL,
  total_lessons INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  price_credits INTEGER DEFAULT 0,
  instructor_name TEXT,
  instructor_bio TEXT,
  learning_objectives TEXT[],
  prerequisites TEXT[],
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des leçons
CREATE TABLE public.academy_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'text', 'quiz', 'exercise')),
  video_url TEXT,
  content_text TEXT,
  duration_minutes INTEGER,
  order_index INTEGER NOT NULL,
  is_preview BOOLEAN DEFAULT false,
  resources JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table de progression des cours
CREATE TABLE public.user_course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  completed_lessons INTEGER DEFAULT 0,
  total_time_spent_minutes INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Table de progression des leçons
CREATE TABLE public.user_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.academy_lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT false,
  time_spent_minutes INTEGER DEFAULT 0,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  last_position_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Table des quiz
CREATE TABLE public.academy_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.academy_lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER DEFAULT 70 CHECK (passing_score >= 0 AND passing_score <= 100),
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des résultats de quiz
CREATE TABLE public.user_quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.academy_quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  answers JSONB NOT NULL,
  passed BOOLEAN NOT NULL,
  time_taken_seconds INTEGER,
  attempt_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des certificats
CREATE TABLE public.academy_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  certificate_number TEXT UNIQUE NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT now(),
  verification_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Table des achievements/badges
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  points INTEGER DEFAULT 0,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des commentaires
CREATE TABLE public.academy_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.academy_lessons(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.academy_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_pinned BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des favoris
CREATE TABLE public.academy_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- =====================================================
-- INDEXES pour performance
-- =====================================================

CREATE INDEX idx_academy_lessons_course_id ON public.academy_lessons(course_id);
CREATE INDEX idx_academy_lessons_order ON public.academy_lessons(course_id, order_index);
CREATE INDEX idx_user_course_progress_user_id ON public.user_course_progress(user_id);
CREATE INDEX idx_user_course_progress_status ON public.user_course_progress(user_id, status);
CREATE INDEX idx_user_lesson_progress_user_id ON public.user_lesson_progress(user_id);
CREATE INDEX idx_user_lesson_progress_course ON public.user_lesson_progress(user_id, course_id);
CREATE INDEX idx_academy_quizzes_lesson_id ON public.academy_quizzes(lesson_id);
CREATE INDEX idx_user_quiz_results_user_id ON public.user_quiz_results(user_id);
CREATE INDEX idx_academy_certificates_user_id ON public.academy_certificates(user_id);
CREATE INDEX idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX idx_academy_comments_course_id ON public.academy_comments(course_id);
CREATE INDEX idx_academy_comments_user_id ON public.academy_comments(user_id);
CREATE INDEX idx_academy_favorites_user_id ON public.academy_favorites(user_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.academy_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_favorites ENABLE ROW LEVEL SECURITY;

-- Policies pour les cours (lecture publique, écriture admin)
CREATE POLICY "Courses are viewable by everyone"
  ON public.academy_courses FOR SELECT
  USING (is_published = true);

-- Policies pour les leçons (lecture publique)
CREATE POLICY "Lessons are viewable by everyone"
  ON public.academy_lessons FOR SELECT
  USING (true);

-- Policies pour progression des cours
CREATE POLICY "Users can view own course progress"
  ON public.user_course_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own course progress"
  ON public.user_course_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own course progress"
  ON public.user_course_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies pour progression des leçons
CREATE POLICY "Users can view own lesson progress"
  ON public.user_lesson_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lesson progress"
  ON public.user_lesson_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lesson progress"
  ON public.user_lesson_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies pour quiz (lecture publique)
CREATE POLICY "Quizzes are viewable by everyone"
  ON public.academy_quizzes FOR SELECT
  USING (true);

-- Policies pour résultats de quiz
CREATE POLICY "Users can view own quiz results"
  ON public.user_quiz_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz results"
  ON public.user_quiz_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies pour certificats
CREATE POLICY "Users can view own certificates"
  ON public.academy_certificates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own certificates"
  ON public.academy_certificates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies pour achievements
CREATE POLICY "Users can view own achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON public.user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies pour commentaires
CREATE POLICY "Comments are viewable by everyone"
  ON public.academy_comments FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own comments"
  ON public.academy_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON public.academy_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.academy_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Policies pour favoris
CREATE POLICY "Users can view own favorites"
  ON public.academy_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON public.academy_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON public.academy_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS pour updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_academy_courses_updated_at
  BEFORE UPDATE ON public.academy_courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_academy_lessons_updated_at
  BEFORE UPDATE ON public.academy_lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_course_progress_updated_at
  BEFORE UPDATE ON public.user_course_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_lesson_progress_updated_at
  BEFORE UPDATE ON public.user_lesson_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_academy_comments_updated_at
  BEFORE UPDATE ON public.academy_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTIONS utilitaires
-- =====================================================

-- Fonction pour générer un numéro de certificat unique
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
  cert_number TEXT;
BEGIN
  cert_number := 'DCAI-' || to_char(now(), 'YYYY') || '-' || LPAD(floor(random() * 999999)::text, 6, '0');
  RETURN cert_number;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour la progression du cours automatiquement
CREATE OR REPLACE FUNCTION update_course_progress()
RETURNS TRIGGER AS $$
DECLARE
  total_lessons INTEGER;
  completed_lessons INTEGER;
  new_progress INTEGER;
BEGIN
  -- Compter le total de leçons pour ce cours
  SELECT COUNT(*) INTO total_lessons
  FROM academy_lessons
  WHERE course_id = NEW.course_id;

  -- Compter les leçons complétées
  SELECT COUNT(*) INTO completed_lessons
  FROM user_lesson_progress
  WHERE user_id = NEW.user_id
    AND course_id = NEW.course_id
    AND is_completed = true;

  -- Calculer le pourcentage
  IF total_lessons > 0 THEN
    new_progress := (completed_lessons * 100) / total_lessons;
  ELSE
    new_progress := 0;
  END IF;

  -- Mettre à jour ou insérer la progression du cours
  INSERT INTO user_course_progress (user_id, course_id, progress_percentage, completed_lessons, status, last_accessed_at)
  VALUES (
    NEW.user_id,
    NEW.course_id,
    new_progress,
    completed_lessons,
    CASE 
      WHEN new_progress = 0 THEN 'not_started'
      WHEN new_progress = 100 THEN 'completed'
      ELSE 'in_progress'
    END,
    now()
  )
  ON CONFLICT (user_id, course_id)
  DO UPDATE SET
    progress_percentage = new_progress,
    completed_lessons = completed_lessons,
    status = CASE 
      WHEN new_progress = 0 THEN 'not_started'
      WHEN new_progress = 100 THEN 'completed'
      ELSE 'in_progress'
    END,
    completed_at = CASE WHEN new_progress = 100 THEN now() ELSE user_course_progress.completed_at END,
    last_accessed_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_course_progress_trigger
  AFTER INSERT OR UPDATE ON user_lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_course_progress();

-- =====================================================
-- DONNÉES INITIALES (Exemple de cours)
-- =====================================================

INSERT INTO public.academy_courses (title, slug, description, thumbnail_emoji, category, level, duration_minutes, total_lessons, instructor_name, learning_objectives, tags) VALUES
('Dropshipping : Démarrer de Zéro', 'dropshipping-debutant', 'Apprenez les bases du dropshipping et lancez votre première boutique en ligne', '🚀', 'basics', 'beginner', 270, 12, 'Expert DropCraft', 
  ARRAY['Comprendre le dropshipping', 'Configurer sa boutique', 'Trouver des produits', 'Réaliser sa première vente'],
  ARRAY['dropshipping', 'débutant', 'e-commerce']),

('Product Research Avancé', 'product-research-avance', 'Maîtrisez les techniques de recherche de produits gagnants avec l''IA', '🔍', 'research', 'intermediate', 200, 10, 'Expert DropCraft',
  ARRAY['Analyser les tendances', 'Utiliser le scoring IA', 'Valider un marché', 'Trouver des niches'],
  ARRAY['research', 'IA', 'produits']),

('Marketing & Publicités Facebook', 'marketing-facebook-ads', 'Créez des campagnes publicitaires rentables qui convertissent', '📱', 'marketing', 'intermediate', 315, 15, 'Expert DropCraft',
  ARRAY['Créer des créatives', 'Cibler des audiences', 'Optimiser le ROI', 'Scaler les campagnes'],
  ARRAY['marketing', 'facebook', 'publicité']),

('Automatisation avec DropCraft AI', 'automatisation-dropcraft', 'Automatisez votre business avec nos outils d''IA avancés', '🤖', 'automation', 'advanced', 240, 11, 'Expert DropCraft',
  ARRAY['Créer des workflows', 'Auto-fulfillment', 'Customer intelligence', 'Optimisation continue'],
  ARRAY['automation', 'IA', 'workflows']),

('Scaling : De 0 à 10k$/mois', 'scaling-ecommerce', 'Stratégies éprouvées pour scaler votre dropshipping store', '📈', 'scaling', 'advanced', 390, 18, 'Expert DropCraft',
  ARRAY['Expansion catalogue', 'Team building', 'Systèmes scalables', 'Gestion financière'],
  ARRAY['scaling', 'croissance', 'business']),

('Customer Service Excellence', 'customer-service-excellence', 'Gérez vos clients comme un pro et augmentez votre LTV', '💬', 'customer', 'intermediate', 165, 8, 'Expert DropCraft',
  ARRAY['SAV efficace', 'Gestion litiges', 'Fidélisation client', 'Support multicanal'],
  ARRAY['customer-service', 'SAV', 'fidélisation']);