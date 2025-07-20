-- Migration: Add Institucional subcategory
-- Created: 2025-01-20
-- Description: Adds "Institucional" as a general subcategory for multiple account types

-- First, let's add a general "Institucional" account type if it doesn't exist
INSERT INTO public.account_types (name, icon, is_active) 
VALUES ('Institucional', 'Building', true)
ON CONFLICT (name) DO NOTHING;

-- Then add "Institucional" as a subcategory for the Institucional account type
INSERT INTO public.account_subcategories (account_type_id, name, icon, is_active)
SELECT 
    at.id,
    'Institucional',
    'Building',
    true
FROM public.account_types at
WHERE at.name = 'Institucional'
ON CONFLICT (account_type_id, name) DO NOTHING;

-- Also add "Institucional" as a subcategory for other relevant account types
-- For Google (for institutional Google accounts)
INSERT INTO public.account_subcategories (account_type_id, name, icon, is_active)
SELECT 
    at.id,
    'Institucional',
    'Building',
    true
FROM public.account_types at
WHERE at.name = 'Google'
ON CONFLICT (account_type_id, name) DO NOTHING;

-- For Microsoft (for institutional Microsoft accounts)
INSERT INTO public.account_subcategories (account_type_id, name, icon, is_active)
SELECT 
    at.id,
    'Institucional',
    'Building',
    true
FROM public.account_types at
WHERE at.name = 'Microsoft'
ON CONFLICT (account_type_id, name) DO NOTHING;

-- Verify the insertions
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.account_types WHERE name = 'Institucional') THEN
        RAISE NOTICE 'SUCCESS: Institucional account type added successfully';
    END IF;
    
    IF EXISTS (SELECT 1 FROM public.account_subcategories WHERE name = 'Institucional') THEN
        RAISE NOTICE 'SUCCESS: Institucional subcategory added successfully';
    ELSE
        RAISE NOTICE 'WARNING: Institucional subcategory was not added';
    END IF;
END $$;