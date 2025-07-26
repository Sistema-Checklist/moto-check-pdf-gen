-- Script simples para corrigir o erro do admin
-- Execute este código no SQL Editor do Supabase

-- 1. Adicionar coluna whatsapp se não existir
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(255) DEFAULT '';

-- 2. Criar perfil do admin se não existir
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
ON CONFLICT (user_id) DO UPDATE SET
    is_approved = true,
    is_frozen = false,
    whatsapp = COALESCE(user_profiles.whatsapp, ''),
    updated_at = NOW();

-- 3. Verificar resultado
SELECT * FROM user_profiles WHERE email = 'kauankg@hotmail.com'; 