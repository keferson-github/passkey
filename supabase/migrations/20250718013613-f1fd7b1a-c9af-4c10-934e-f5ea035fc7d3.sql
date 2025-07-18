-- PassKey Password Manager Database Schema
-- Creating comprehensive multi-tenant password management system

-- First, create user profiles for additional user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create password categories
CREATE TABLE public.password_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT, -- Icon name for UI
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create account types (Google, Microsoft, Meta, etc.)
CREATE TABLE public.account_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT, -- Icon name for UI
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subcategories for account types (Gmail, Google Calendar, etc.)
CREATE TABLE public.account_subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_type_id UUID NOT NULL REFERENCES public.account_types(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT, -- Icon name for UI
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(account_type_id, name)
);

-- Create passwords table
CREATE TABLE public.passwords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.password_categories(id),
  account_type_id UUID NOT NULL REFERENCES public.account_types(id),
  subcategory_id UUID REFERENCES public.account_subcategories(id),
  title TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL, -- Encrypted password
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create password history for deleted passwords
CREATE TABLE public.password_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_password_id UUID,
  category_name TEXT NOT NULL,
  account_type_name TEXT NOT NULL,
  subcategory_name TEXT,
  title TEXT NOT NULL,
  email TEXT NOT NULL,
  description TEXT,
  deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

-- Create policies for password categories (admin-only management)
CREATE POLICY "Everyone can view active categories" 
ON public.password_categories 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage categories" 
ON public.password_categories 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

-- Create policies for account types (admin-only management)
CREATE POLICY "Everyone can view active account types" 
ON public.account_types 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage account types" 
ON public.account_types 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

-- Create policies for account subcategories
CREATE POLICY "Everyone can view active subcategories" 
ON public.account_subcategories 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage subcategories" 
ON public.account_subcategories 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

-- Create policies for passwords
CREATE POLICY "Users can view their own passwords" 
ON public.passwords 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own passwords" 
ON public.passwords 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own passwords" 
ON public.passwords 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own passwords" 
ON public.passwords 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all passwords" 
ON public.passwords 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Admins can manage all passwords" 
ON public.passwords 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

-- Create policies for password history
CREATE POLICY "Users can view their own password history" 
ON public.password_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own password history" 
ON public.password_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all password history" 
ON public.password_history 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_password_categories_updated_at
BEFORE UPDATE ON public.password_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_account_types_updated_at
BEFORE UPDATE ON public.account_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_account_subcategories_updated_at
BEFORE UPDATE ON public.account_subcategories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_passwords_updated_at
BEFORE UPDATE ON public.passwords
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Insert default data
INSERT INTO public.password_categories (name, description, icon) VALUES
('Social Media', 'Redes sociais e plataformas de comunicação', 'Users'),
('Work & Business', 'Contas profissionais e empresariais', 'Briefcase'),
('Entertainment', 'Entretenimento e streaming', 'Play'),
('Finance', 'Bancos e aplicações financeiras', 'CreditCard'),
('Shopping', 'E-commerce e compras online', 'ShoppingBag'),
('Education', 'Plataformas educacionais', 'GraduationCap'),
('Development', 'Ferramentas de desenvolvimento', 'Code'),
('Health', 'Saúde e fitness', 'Heart');

INSERT INTO public.account_types (name, icon) VALUES
('Google', 'Mail'),
('Microsoft', 'Monitor'),
('Meta', 'Facebook'),
('Apple', 'Smartphone'),
('Amazon', 'Package'),
('Netflix', 'Play'),
('GitHub', 'Github'),
('Discord', 'MessageCircle'),
('Spotify', 'Music'),
('Instagram', 'Instagram'),
('LinkedIn', 'Linkedin'),
('Twitter', 'Twitter'),
('TikTok', 'Video'),
('WhatsApp', 'MessageSquare'),
('Telegram', 'Send');

-- Insert Google subcategories
INSERT INTO public.account_subcategories (account_type_id, name, icon) 
SELECT id, subcategory, 'Mail' FROM public.account_types, 
(VALUES ('Gmail'), ('Google Drive'), ('Google Calendar'), ('Google Cloud'), ('Google Play'), ('Google Ads'), ('YouTube'), ('Google Photos')) AS t(subcategory) 
WHERE name = 'Google';

-- Insert Microsoft subcategories
INSERT INTO public.account_subcategories (account_type_id, name, icon) 
SELECT id, subcategory, 'Monitor' FROM public.account_types, 
(VALUES ('Outlook'), ('OneDrive'), ('Teams'), ('Azure'), ('Xbox'), ('Office 365'), ('Skype')) AS t(subcategory) 
WHERE name = 'Microsoft';

-- Insert Meta subcategories
INSERT INTO public.account_subcategories (account_type_id, name, icon) 
SELECT id, subcategory, 'Facebook' FROM public.account_types, 
(VALUES ('Facebook'), ('Instagram'), ('WhatsApp'), ('Messenger'), ('Threads')) AS t(subcategory) 
WHERE name = 'Meta';