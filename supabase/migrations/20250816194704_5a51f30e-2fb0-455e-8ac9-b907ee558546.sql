-- Créer les tables pour le chat en temps réel
CREATE TABLE IF NOT EXISTS public.realtime_chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_name TEXT NOT NULL DEFAULT 'Chat IA',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'paused')),
  language TEXT NOT NULL DEFAULT 'fr',
  voice_preference TEXT NOT NULL DEFAULT 'alloy',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.realtime_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.realtime_chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT,
  audio_data TEXT, -- Base64 encoded audio
  transcript TEXT,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'audio', 'function_call')),
  function_name TEXT,
  function_arguments JSONB,
  function_result JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.realtime_presence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_name TEXT NOT NULL,
  presence_data JSONB NOT NULL DEFAULT '{}',
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, channel_name)
);

-- Activer RLS
ALTER TABLE public.realtime_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.realtime_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.realtime_presence ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les sessions de chat
CREATE POLICY "Users can view their own chat sessions" 
ON public.realtime_chat_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat sessions" 
ON public.realtime_chat_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat sessions" 
ON public.realtime_chat_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Politiques RLS pour les messages
CREATE POLICY "Users can view messages from their sessions" 
ON public.realtime_chat_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.realtime_chat_sessions 
    WHERE id = session_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages in their sessions" 
ON public.realtime_chat_messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.realtime_chat_sessions 
    WHERE id = session_id AND user_id = auth.uid()
  )
);

-- Politiques RLS pour la présence
CREATE POLICY "Users can view presence data" 
ON public.realtime_presence 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their own presence" 
ON public.realtime_presence 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Triggers pour les timestamps
CREATE TRIGGER update_realtime_chat_sessions_updated_at
BEFORE UPDATE ON public.realtime_chat_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour les performances
CREATE INDEX idx_realtime_chat_sessions_user_id ON public.realtime_chat_sessions(user_id);
CREATE INDEX idx_realtime_chat_messages_session_id ON public.realtime_chat_messages(session_id);
CREATE INDEX idx_realtime_chat_messages_created_at ON public.realtime_chat_messages(created_at);
CREATE INDEX idx_realtime_presence_user_channel ON public.realtime_presence(user_id, channel_name);
CREATE INDEX idx_realtime_presence_last_seen ON public.realtime_presence(last_seen);

-- Activer la réplication en temps réel
ALTER TABLE public.realtime_chat_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.realtime_chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.realtime_presence REPLICA IDENTITY FULL;