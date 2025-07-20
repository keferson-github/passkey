-- Migration: Add Personal category
-- Created: 2025-01-20
-- Description: Adds the "Personal" category to password_categories table

-- Insert Personal category
INSERT INTO public.password_categories (name, description, icon, is_active) 
VALUES ('Personal', 'Contas pessoais e privadas', 'User', true)
ON CONFLICT (name) DO NOTHING;

-- Verify the insertion
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.password_categories WHERE name = 'Personal') THEN
        RAISE NOTICE 'SUCCESS: Personal category added successfully';
    ELSE
        RAISE NOTICE 'WARNING: Personal category was not added';
    END IF;
END $$;