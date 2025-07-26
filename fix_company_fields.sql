-- Script robusto para adicionar campos de empresa à tabela user_profiles
-- Execute este código no SQL Editor do Supabase

-- 1. Verificar se as colunas já existem
DO $$
BEGIN
    -- Adicionar company_name se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'company_name'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN company_name VARCHAR(255) DEFAULT '';
        RAISE NOTICE 'Coluna company_name adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna company_name já existe';
    END IF;

    -- Adicionar company_logo se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'company_logo'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN company_logo TEXT DEFAULT '';
        RAISE NOTICE 'Coluna company_logo adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna company_logo já existe';
    END IF;
END $$;

-- 2. Verificar estrutura atual da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- 3. Testar inserção de dados
UPDATE user_profiles 
SET company_name = 'Teste', company_logo = 'teste_logo'
WHERE user_id = (SELECT user_id FROM user_profiles LIMIT 1)
RETURNING user_id, company_name, company_logo; 