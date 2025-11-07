-- Create storage bucket for audio samples
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'samples',
  'samples',
  true,
  52428800, -- 50MB limit
  ARRAY['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-wav', 'audio/wave']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public samples are viewable by anyone" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload samples" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own samples" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own samples" ON storage.objects;

-- Storage policies for samples bucket
CREATE POLICY "Public samples are viewable by anyone"
ON storage.objects
FOR SELECT
USING (bucket_id = 'samples');

CREATE POLICY "Authenticated users can upload samples"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'samples' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own samples"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'samples' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their own samples"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'samples' 
  AND auth.uid() IS NOT NULL
);