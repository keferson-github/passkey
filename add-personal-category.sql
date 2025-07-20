-- Adicionar categoria "Personal" (Pessoal) ao banco de dados
INSERT INTO public.password_categories (name, description, icon) 
VALUES ('Personal', 'Contas pessoais e privadas', 'User')
ON CONFLICT (name) DO NOTHING;