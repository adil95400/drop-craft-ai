import { supabase } from '@/integrations/supabase/client';

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail_url?: string;
  thumbnail_emoji?: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration_minutes: number;
  total_lessons: number;
  is_published: boolean;
  instructor_name?: string;
  learning_objectives?: string[];
  tags?: string[];
  created_at: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  content_type: 'video' | 'text' | 'quiz' | 'exercise';
  video_url?: string;
  content_text?: string;
  duration_minutes?: number;
  order_index: number;
  is_preview: boolean;
  resources?: any[];
}

export interface UserCourseProgress {
  id: string;
  user_id: string;
  course_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress_percentage: number;
  completed_lessons: number;
  total_time_spent_minutes: number;
  started_at: string;
  completed_at?: string;
  last_accessed_at: string;
}

export interface UserLessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  course_id: string;
  is_completed: boolean;
  time_spent_minutes: number;
  progress_percentage: number;
  last_position_seconds: number;
  completed_at?: string;
}

export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  certificate_number: string;
  issued_at: string;
  verification_url?: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  achievement_type: string;
  achievement_name: string;
  description?: string;
  icon?: string;
  points: number;
  unlocked_at: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  lesson_id: string;
  course_id: string;
  title: string;
  description?: string;
  passing_score: number;
  questions: QuizQuestion[];
}

export const academyService = {
  // ============= COURSES =============
  async getCourses() {
    const { data, error } = await supabase
      .from('academy_courses')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Course[];
  },

  async getCourseBySlug(slug: string) {
    const { data, error } = await supabase
      .from('academy_courses')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) throw error;
    return data as Course;
  },

  async getCourseLessons(courseId: string) {
    const { data, error } = await supabase
      .from('academy_lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data as Lesson[];
  },

  // ============= PROGRESS =============
  async getUserCourseProgress(userId: string, courseId: string) {
    const { data, error } = await supabase
      .from('user_course_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (error) throw error;
    return data as UserCourseProgress | null;
  },

  async getUserAllProgress(userId: string) {
    const { data, error } = await supabase
      .from('user_course_progress')
      .select('*, academy_courses(*)')
      .eq('user_id', userId)
      .order('last_accessed_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async updateLessonProgress(
    userId: string,
    lessonId: string,
    courseId: string,
    progress: {
      is_completed?: boolean;
      time_spent_minutes?: number;
      progress_percentage?: number;
      last_position_seconds?: number;
    }
  ) {
    const { data, error } = await supabase
      .from('user_lesson_progress')
      .upsert({
        user_id: userId,
        lesson_id: lessonId,
        course_id: courseId,
        ...progress,
        completed_at: progress.is_completed ? new Date().toISOString() : undefined,
      })
      .select()
      .single();

    if (error) throw error;
    return data as UserLessonProgress;
  },

  async getUserLessonProgress(userId: string, courseId: string) {
    const { data, error } = await supabase
      .from('user_lesson_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId);

    if (error) throw error;
    return data as UserLessonProgress[];
  },

  // ============= CERTIFICATES =============
  async generateCertificate(userId: string, courseId: string) {
    // Générer le numéro de certificat
    const { data: certNumber } = await supabase.rpc('generate_certificate_number');
    
    const { data, error } = await supabase
      .from('academy_certificates')
      .insert({
        user_id: userId,
        course_id: courseId,
        certificate_number: certNumber,
        verification_url: `/academy/certificates/${certNumber}`,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Certificate;
  },

  async getUserCertificates(userId: string) {
    const { data, error } = await supabase
      .from('academy_certificates')
      .select('*, academy_courses(*)')
      .eq('user_id', userId)
      .order('issued_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getCertificateByNumber(certificateNumber: string) {
    const { data, error } = await supabase
      .from('academy_certificates')
      .select('*, academy_courses(*)')
      .eq('certificate_number', certificateNumber)
      .single();

    if (error) throw error;
    return data;
  },

  // ============= ACHIEVEMENTS =============
  async unlockAchievement(
    userId: string,
    achievement: {
      achievement_type: string;
      achievement_name: string;
      description?: string;
      icon?: string;
      points?: number;
    }
  ) {
    const { data, error } = await supabase
      .from('user_achievements')
      .insert({
        user_id: userId,
        ...achievement,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Achievement;
  },

  async getUserAchievements(userId: string) {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });

    if (error) throw error;
    return data as Achievement[];
  },

  // ============= QUIZZES =============
  async getQuizByLesson(lessonId: string) {
    const { data, error } = await supabase
      .from('academy_quizzes')
      .select('*')
      .eq('lesson_id', lessonId)
      .maybeSingle();

    if (error) throw error;
    return data ? { ...data, questions: data.questions as any as QuizQuestion[] } : null;
  },

  async submitQuizResult(
    userId: string,
    quizId: string,
    result: {
      score: number;
      answers: any;
      passed: boolean;
      time_taken_seconds?: number;
    }
  ) {
    // Get attempt number
    const { count } = await supabase
      .from('user_quiz_results')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('quiz_id', quizId);

    const { data, error } = await supabase
      .from('user_quiz_results')
      .insert({
        user_id: userId,
        quiz_id: quizId,
        attempt_number: (count || 0) + 1,
        ...result,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getUserQuizResults(userId: string, quizId: string) {
    const { data, error } = await supabase
      .from('user_quiz_results')
      .select('*')
      .eq('user_id', userId)
      .eq('quiz_id', quizId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // ============= COMMENTS =============
  async getCourseComments(courseId: string) {
    const { data, error } = await supabase
      .from('academy_comments')
      .select('*')
      .eq('course_id', courseId)
      .is('parent_id', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async addComment(
    userId: string,
    courseId: string,
    content: string,
    lessonId?: string,
    rating?: number
  ) {
    const { data, error } = await supabase
      .from('academy_comments')
      .insert({
        user_id: userId,
        course_id: courseId,
        lesson_id: lessonId,
        content,
        rating,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ============= FAVORITES =============
  async toggleFavorite(userId: string, courseId: string) {
    const { data: existing } = await supabase
      .from('academy_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('academy_favorites')
        .delete()
        .eq('id', existing.id);
      
      if (error) throw error;
      return { isFavorite: false };
    } else {
      const { error } = await supabase
        .from('academy_favorites')
        .insert({ user_id: userId, course_id: courseId });
      
      if (error) throw error;
      return { isFavorite: true };
    }
  },

  async getUserFavorites(userId: string) {
    const { data, error } = await supabase
      .from('academy_favorites')
      .select('*, academy_courses(*)')
      .eq('user_id', userId);

    if (error) throw error;
    return data;
  },

  // ============= STATS =============
  async getUserStats(userId: string) {
    const { data: progress } = await supabase
      .from('user_course_progress')
      .select('*')
      .eq('user_id', userId);

    const { data: certificates } = await supabase
      .from('academy_certificates')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { data: achievements } = await supabase
      .from('user_achievements')
      .select('points')
      .eq('user_id', userId);

    const totalPoints = achievements?.reduce((sum, a) => sum + (a.points || 0), 0) || 0;
    const completedCourses = progress?.filter(p => p.status === 'completed').length || 0;
    const inProgressCourses = progress?.filter(p => p.status === 'in_progress').length || 0;
    const totalTimeSpent = progress?.reduce((sum, p) => sum + p.total_time_spent_minutes, 0) || 0;

    return {
      totalCourses: progress?.length || 0,
      completedCourses,
      inProgressCourses,
      certificatesEarned: certificates || 0,
      totalPoints,
      totalTimeSpent,
      achievements: achievements?.length || 0,
    };
  },
};
