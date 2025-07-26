-- Script SQL para corrigir o erro do login do admin (SEM whatsapp)
-- Execute este código no SQL Editor do Supabase

-- 1. Remover coluna whatsapp se existir (opcional)
ALTER TABLE user_profiles 
DROP COLUMN IF EXISTS whatsapp;

-- 2. Criar perfil do admin se não existir
INSERT INTO user_profiles (user_id, name, email, phone, is_approved, is_frozen, created_at)
SELECT 
    au.id,
    'Admin Geral',
    'kauankg@hotmail.com',
    '(11) 99999-9999',
    true,
    false,
    NOW()
FROM auth.users au
WHERE au.email = 'kauankg@hotmail.com'
ON CONFLICT (user_id) DO UPDATE SET
    is_approved = true,
    is_frozen = false,
    updated_at = NOW();

-- 3. Verificar resultado
SELECT * FROM user_profiles WHERE email = 'kauankg@hotmail.com'; 