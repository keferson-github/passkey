-- Migration: Add RPC function to get users with emails for admin
-- Created: 2025-01-20
-- Description: Creates a function to allow admins to fetch user emails

-- Create function to get users with emails (admin only)
CREATE OR REPLACE FUNCTION get_users_with_emails(user_ids UUID[])
RETURNS TABLE(id UUID, email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND is_admin = true 
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Return user emails for the provided user IDs
  RETURN QUERY
  SELECT 
    au.id,
    au.email
  FROM auth.users au
  WHERE au.id = ANY(user_ids);
END;
$$;

-- Grant execute permission to authenticated users (function will check admin status internally)
GRANT EXECUTE ON FUNCTION get_users_with_emails(UUID[]) TO authenticated;

-- Verify the function was created
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_users_with_emails') THEN
        RAISE NOTICE 'SUCCESS: get_users_with_emails function created successfully';
    ELSE
        RAISE NOTICE 'WARNING: get_users_with_emails function was not created';
    END IF;
END $$;