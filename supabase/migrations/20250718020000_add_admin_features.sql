-- Add admin and active status columns to profiles table
ALTER TABLE profiles
ADD COLUMN is_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

-- Set the admin email as admin user
-- First, we need to find the user_id from auth.users and then update profiles
UPDATE profiles 
SET is_admin = TRUE 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email = 'contato@techsolutionspro.com.br'
);

-- Create index for faster queries
CREATE INDEX idx_profiles_is_admin ON profiles(is_admin);
CREATE INDEX idx_profiles_is_active ON profiles(is_active);
