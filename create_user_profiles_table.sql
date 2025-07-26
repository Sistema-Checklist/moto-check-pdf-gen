-- Script para criar a tabela user_profiles e configurar o admin
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_approved ON user_profiles(is_approved);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas de segurança
-- Política para usuários verem apenas seu próprio perfil
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Política para usuários editarem apenas seu próprio perfil
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para inserção de novos perfis
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para admin ver todos os perfis
CREATE POLICY "Admin can view all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND email = 'kauankg@hotmail.com'
        )
    );

-- Política para admin editar todos os perfis
CREATE POLICY "Admin can update all profiles" ON user_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND email = 'kauankg@hotmail.com'
        )
    );

-- 5. Criar perfil do admin se não existir
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
    is_frozen = false,
    updated_at = NOW();

-- 6. Verificar se a tabela foi criada e o admin configurado
SELECT 
    'Tabela user_profiles criada com sucesso!' as status,
    COUNT(*) as total_users
FROM user_profiles;

-- 7. Mostrar o perfil do admin
SELECT * FROM user_profiles WHERE email = 'kauankg@hotmail.com'; 