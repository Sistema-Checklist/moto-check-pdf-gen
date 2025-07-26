-- Script simples para criar a tabela user_profiles
-- Execute este código no SQL Editor do Supabase

-- 1. Criar a tabela user_profiles
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    is_approved BOOLEAN DEFAULT false,
    is_frozen BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar perfil do admin
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
ON CONFLICT (email) DO UPDATE SET
    is_approved = true,
    is_frozen = false;

-- 3. Verificar resultado
SELECT * FROM user_profiles WHERE email = 'kauankg@hotmail.com'; 