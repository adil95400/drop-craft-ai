-- Create user_video_progress table to track video watching progress
CREATE TABLE public.user_video_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  video_id TEXT NOT NULL,
  watched_seconds INTEGER DEFAULT 0,
  total_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- Enable RLS
ALTER TABLE public.user_video_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for users to manage their own progress
CREATE POLICY "Users can manage their own video progress" 
ON public.user_video_progress 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_video_progress_user_id ON public.user_video_progress(user_id);
CREATE INDEX idx_video_progress_video_id ON public.user_video_progress(video_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_video_progress_updated_at
  BEFORE UPDATE ON public.user_video_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();