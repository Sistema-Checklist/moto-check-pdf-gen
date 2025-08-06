
-- Corrigir as políticas RLS para permitir acesso do admin
-- Primeiro, vamos dropar as políticas existentes que podem estar causando conflito
DROP POLICY IF EXISTS "Admin pode ver todos os perfis" ON user_profiles;
DROP POLICY IF EXISTS "Admin pode criar perfis" ON user_profiles;
DROP POLICY IF EXISTS "Admin pode atualizar todos os perfis" ON user_profiles;
DROP POLICY IF EXISTS "Admin pode deletar perfis" ON user_profiles;

-- Recriar as políticas com verificação mais robusta
-- Política para admin ver todos os perfis
CREATE POLICY "Admin pode ver todos os perfis" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND email = 'kauankg@hotmail.com'
        )
    );

-- Política para admin criar perfis (incluindo o próprio)
CREATE POLICY "Admin pode criar perfis" ON user_profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND email = 'kauankg@hotmail.com'
        ) OR email = 'kauankg@hotmail.com'
    );

-- Política para admin atualizar todos os perfis
CREATE POLICY "Admin pode atualizar todos os perfis" ON user_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND email = 'kauankg@hotmail.com'
        )
    );

-- Política para admin deletar perfis (exceto o próprio)
CREATE POLICY "Admin pode deletar perfis" ON user_profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND email = 'kauankg@hotmail.com'
        ) AND email != 'kauankg@hotmail.com'
    );

-- Política especial para permitir criação inicial do perfil admin
CREATE POLICY "Permitir criação inicial do admin" ON user_profiles
    FOR INSERT WITH CHECK (
        email = 'kauankg@hotmail.com' AND
        NOT EXISTS (SELECT 1 FROM user_profiles WHERE email = 'kauankg@hotmail.com')
    );

-- Garantir que o perfil do admin existe
INSERT INTO user_profiles (user_id, name, email, phone, whatsapp, is_approved, is_frozen, created_at)
SELECT 
    au.id,
    'Admin Geral',
    'kauankg@hotmail.com',
    '(11) 99999-9999',
    '',
    true,
    false,
    NOW()
FROM auth.users au
WHERE au.email = 'kauankg@hotmail.com'
ON CONFLICT (email) DO UPDATE SET
    is_approved = true,
    is_frozen = false,
    whatsapp = COALESCE(EXCLUDED.whatsapp, user_profiles.whatsapp, ''),
    updated_at = NOW();
