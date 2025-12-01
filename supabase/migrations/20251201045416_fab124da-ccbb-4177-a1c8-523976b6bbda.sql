-- Create samples storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'samples',
  'samples',
  true,
  104857600, -- 100MB limit
  ARRAY['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/flac']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/flac'];

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload samples" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to samples" ON storage.objects;

-- Create RLS policies for samples bucket
CREATE POLICY "Allow authenticated users to upload samples"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'samples');

CREATE POLICY "Allow public read access to samples"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'samples');