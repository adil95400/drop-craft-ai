-- Create trigger for updated_at if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_customer_behavior_analytics_updated_at'
  ) THEN
    CREATE TRIGGER update_customer_behavior_analytics_updated_at
      BEFORE UPDATE ON public.customer_behavior_analytics
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END
$$;