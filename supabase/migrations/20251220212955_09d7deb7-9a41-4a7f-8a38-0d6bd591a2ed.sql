-- Create audio-samples storage bucket for training data
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-samples', 'audio-samples', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for audio-samples bucket
CREATE POLICY "Anyone can view audio samples"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'audio-samples');

CREATE POLICY "Authenticated users can upload audio samples"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'audio-samples' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own audio samples"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'audio-samples' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own audio samples"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'audio-samples' AND auth.uid()::text = (storage.foldername(name))[1]);