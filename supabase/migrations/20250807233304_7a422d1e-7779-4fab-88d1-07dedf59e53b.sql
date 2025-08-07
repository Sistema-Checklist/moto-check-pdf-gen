-- Remover todas as políticas RLS problemáticas e recriar de forma simples
DROP POLICY IF EXISTS "Admin pode ver todos os perfis" ON user_profiles;
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON user_profiles;
DROP POLICY IF EXISTS "Admin pode atualizar todos os perfis" ON user_profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON user_profiles;
DROP POLICY IF EXISTS "Admin pode criar perfis" ON user_profiles;
DROP POLICY IF EXISTS "Admin pode deletar perfis" ON user_profiles;

-- Criar políticas simples e diretas para admin
CREATE POLICY "Admin total access" ON user_profiles
FOR ALL USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'kauankg@hotmail.com'
);

-- Política para usuários verem seus próprios perfis
CREATE POLICY "Users see own profile" ON user_profiles
FOR SELECT USING (auth.uid() = user_id);

-- Política para usuários atualizarem seus próprios perfis
CREATE POLICY "Users update own profile" ON user_profiles
FOR UPDATE USING (auth.uid() = user_id);