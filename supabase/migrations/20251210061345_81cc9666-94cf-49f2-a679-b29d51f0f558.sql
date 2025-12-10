-- Create storage bucket for temporary audio files (Modal GPU processing)
INSERT INTO storage.buckets (id, name, public)
VALUES ('temp-audio', 'temp-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to temp-audio bucket
CREATE POLICY "Users can upload temp audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'temp-audio');

-- Allow public read access (Modal needs public URLs)
CREATE POLICY "Public can read temp audio"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'temp-audio');

-- Allow users to delete their own temp files
CREATE POLICY "Users can delete own temp audio"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'temp-audio' AND auth.uid()::text = (storage.foldername(name))[1]);