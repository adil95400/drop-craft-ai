-- Create storage bucket for return attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('return-attachments', 'return-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Users can upload return attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'return-attachments' 
  AND auth.role() = 'authenticated'
);

-- Allow public read access to return attachments
CREATE POLICY "Public read access for return attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'return-attachments');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their return attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'return-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add attachments column to returns table
ALTER TABLE public.returns 
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;