-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  read BOOLEAN NOT NULL DEFAULT false,
  action_label TEXT,
  action_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own notifications
CREATE POLICY "select_own_notifications" ON public.notifications
FOR SELECT
USING (user_id = auth.uid());

-- Create policy for users to update their own notifications
CREATE POLICY "update_own_notifications" ON public.notifications
FOR UPDATE
USING (user_id = auth.uid());

-- Create policy for inserting notifications (for system/admin use)
CREATE POLICY "insert_notifications" ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Create policy for deleting own notifications
CREATE POLICY "delete_own_notifications" ON public.notifications
FOR DELETE
USING (user_id = auth.uid());

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create trigger for updated_at
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();