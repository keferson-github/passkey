-- Políticas de segurança para a tabela profiles

-- Política para permitir que administradores vejam todos os perfis
CREATE POLICY "Admins podem ver todos os perfis" ON public.profiles
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE is_admin = true
    )
  );

-- Política para permitir que usuários vejam apenas seu próprio perfil
CREATE POLICY "Usuários podem ver apenas seu próprio perfil" ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = user_id
  );

-- Política para permitir que administradores atualizem qualquer perfil
CREATE POLICY "Admins podem atualizar qualquer perfil" ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE is_admin = true
    )
  );

-- Política para permitir que usuários atualizem apenas seu próprio perfil
CREATE POLICY "Usuários podem atualizar apenas seu próprio perfil" ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() = user_id
  );

-- Política para permitir que administradores excluam qualquer perfil
CREATE POLICY "Admins podem excluir qualquer perfil" ON public.profiles
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE is_admin = true
    )
  );

-- Política para permitir que usuários excluam apenas seu próprio perfil
CREATE POLICY "Usuários podem excluir apenas seu próprio perfil" ON public.profiles
  FOR DELETE
  USING (
    auth.uid() = user_id
  );

-- Política para permitir que administradores insiram novos perfis
CREATE POLICY "Admins podem inserir novos perfis" ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE is_admin = true
    )
  );

-- Política para permitir que novos usuários criem seu próprio perfil
CREATE POLICY "Novos usuários podem criar seu próprio perfil" ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );