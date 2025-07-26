-- Script SQL para corrigir o erro do login do admin
-- Execute este script no seu banco de dados Supabase

-- 1. Primeiro, vamos adicionar a coluna whatsapp se ela não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'whatsapp'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN whatsapp VARCHAR(255) DEFAULT '';
    END IF;
END $$;

-- 2. Verificar se o admin já existe na tabela user_profiles
-- Se não existir, vamos criar o perfil do admin
INSERT INTO user_profiles (user_id, name, email, phone, whatsapp, is_approved, is_frozen, created_at)
SELECT 
    au.id as user_id,
    'Admin Geral' as name,
    'kauankg@hotmail.com' as email,
    '(11) 99999-9999' as phone,
    '' as whatsapp,
    true as is_approved,
    false as is_frozen,
    NOW() as created_at
FROM auth.users au
WHERE au.email = 'kauankg@hotmail.com'
AND NOT EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.user_id = au.id
);

-- 3. Se o admin já existe, vamos garantir que está aprovado
UPDATE user_profiles 
SET 
    is_approved = true,
    is_frozen = false,
    whatsapp = COALESCE(whatsapp, ''),
    updated_at = NOW()
WHERE email = 'kauankg@hotmail.com';

-- 4. Verificar se a operação foi bem-sucedida
SELECT 
    'Perfil do Admin configurado com sucesso!' as status,
    up.*
FROM user_profiles up
WHERE up.email = 'kauankg@hotmail.com';

-- 5. Listar todos os usuários para verificar
SELECT 
    id,
    user_id,
    name,
    email,
    phone,
    whatsapp,
    is_approved,
    is_frozen,
    created_at
FROM user_profiles
ORDER BY created_at DESC; 