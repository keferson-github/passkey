-- Add admin and active status columns to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN is_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

-- Set the admin email as admin user
UPDATE user_profiles 
SET is_admin = TRUE 
WHERE email = 'contato@techsolutionspro.com.br';

-- Create index for faster queries
CREATE INDEX idx_user_profiles_is_admin ON user_profiles(is_admin);
CREATE INDEX idx_user_profiles_is_active ON user_profiles(is_active);
