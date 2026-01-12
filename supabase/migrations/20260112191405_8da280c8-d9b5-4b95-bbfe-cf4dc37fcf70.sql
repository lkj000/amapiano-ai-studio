-- Create storage bucket for audio files used in LANDR Layers and mastering
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-files',
  'audio-files',
  true,
  104857600, -- 100MB limit
  ARRAY['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-wav', 'audio/ogg', 'audio/flac', 'audio/aiff', 'audio/x-aiff']
) ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own audio files
CREATE POLICY "Users can upload their own audio files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'audio-files' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to read their own audio files
CREATE POLICY "Users can read their own audio files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'audio-files'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to audio files (for playback)
CREATE POLICY "Public read access to audio files"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio-files');

-- Allow users to delete their own audio files
CREATE POLICY "Users can delete their own audio files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'audio-files'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);