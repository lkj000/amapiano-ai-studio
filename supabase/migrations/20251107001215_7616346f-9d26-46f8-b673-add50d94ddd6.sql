-- Add user_id column to quantized_models and set up RLS policies

-- Add user_id column if it doesn't exist
ALTER TABLE quantized_models
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Set user_id to the current user for existing rows (if any)
UPDATE quantized_models
SET user_id = auth.uid()
WHERE user_id IS NULL;

-- Make user_id non-nullable after setting values
ALTER TABLE quantized_models
ALTER COLUMN user_id SET NOT NULL;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own quantized models" ON quantized_models;
DROP POLICY IF EXISTS "Users can insert their own quantized models" ON quantized_models;
DROP POLICY IF EXISTS "Users can update their own quantized models" ON quantized_models;
DROP POLICY IF EXISTS "Users can delete their own quantized models" ON quantized_models;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view their own quantized models"
  ON quantized_models FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quantized models"
  ON quantized_models FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quantized models"
  ON quantized_models FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quantized models"
  ON quantized_models FOR DELETE
  USING (auth.uid() = user_id);