-- Create a storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up access policies for the avatars bucket
-- Allow users to upload their own avatars
CREATE POLICY "Users can upload their own avatars" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'user-avatars' AND
    (storage.foldername(name))[1] = 'avatars' AND
    auth.uid() IS NOT NULL
  );

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatars" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'user-avatars' AND
    (storage.foldername(name))[1] = 'avatars' AND
    auth.uid() IS NOT NULL
  );

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'user-avatars' AND
    (storage.foldername(name))[1] = 'avatars' AND
    auth.uid() IS NOT NULL
  );

-- Allow public read access to all avatars
CREATE POLICY "Public read access for avatars" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'user-avatars');