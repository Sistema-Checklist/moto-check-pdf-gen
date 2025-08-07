-- Verificar e corrigir as políticas RLS para admin poder ver todos os perfis
DROP POLICY IF EXISTS "Admin pode ver todos os perfis" ON user_profiles;

-- Criar política mais específica para admin
CREATE POLICY "Admin pode ver todos os perfis" ON user_profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'kauankg@hotmail.com'
  )
);

-- Verificar se a política de visualização própria existe
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON user_profiles;

CREATE POLICY "Usuários podem ver seu próprio perfil" ON user_profiles
FOR SELECT USING (auth.uid() = user_id);