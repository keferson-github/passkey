-- Create a storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up access policies for the avatars bucket
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload avatars" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

-- Allow users to update their own files
CREATE POLICY "Allow users to update their own avatars" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars');

-- Allow users to delete their own files
CREATE POLICY "Allow users to delete their own avatars" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars');

-- Allow public read access to all avatars
CREATE POLICY "Allow public read access to avatars" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');