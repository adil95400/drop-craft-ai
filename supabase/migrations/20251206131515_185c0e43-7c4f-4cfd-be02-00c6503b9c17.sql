-- Fix 7 admin policies that use vulnerable raw_user_meta_data pattern
-- Replace with secure has_role() function that checks user_roles table

-- ============================================
-- VIDEO_TUTORIALS TABLE POLICIES (4 policies)
-- ============================================

-- Drop existing vulnerable policies
DROP POLICY IF EXISTS "Admins can view all video tutorials" ON public.video_tutorials;
DROP POLICY IF EXISTS "Admins can insert video tutorials" ON public.video_tutorials;
DROP POLICY IF EXISTS "Admins can update video tutorials" ON public.video_tutorials;
DROP POLICY IF EXISTS "Admins can delete video tutorials" ON public.video_tutorials;

-- Recreate with secure has_role() function
CREATE POLICY "Admins can view all video tutorials" 
ON public.video_tutorials 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert video tutorials" 
ON public.video_tutorials 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update video tutorials" 
ON public.video_tutorials 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete video tutorials" 
ON public.video_tutorials 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- STORAGE.OBJECTS POLICIES (3 policies)
-- ============================================

-- Drop existing vulnerable storage policies
DROP POLICY IF EXISTS "Admins can upload video tutorials" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update video tutorials" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete video tutorials" ON storage.objects;

-- Recreate with secure has_role() function
CREATE POLICY "Admins can upload video tutorials" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'video-tutorials' 
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update video tutorials" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'video-tutorials' 
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete video tutorials" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'video-tutorials' 
  AND public.has_role(auth.uid(), 'admin')
);