-- Migration: Add Site category
-- Created: 2025-01-20
-- Description: Adds the "Site" category to password_categories table

-- Insert Site category
INSERT INTO public.password_categories (name, description, icon, is_active) 
VALUES ('Site', 'Sites e páginas web em geral', 'Globe', true)
ON CONFLICT (name) DO NOTHING;

-- Verify the insertion
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.password_categories WHERE name = 'Site') THEN
        RAISE NOTICE 'SUCCESS: Site category added successfully';
    ELSE
        RAISE NOTICE 'WARNING: Site category was not added';
    END IF;
END $$;