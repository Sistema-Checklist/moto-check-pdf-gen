-- Script robusto para adicionar campo WhatsApp à tabela user_profiles
-- Execute este código no SQL Editor do Supabase

-- 1. Verificar se a coluna já existe
DO $$
BEGIN
    -- Adicionar whatsapp se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles'
        AND column_name = 'whatsapp'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN whatsapp VARCHAR(20) DEFAULT '';
        RAISE NOTICE 'Coluna whatsapp adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna whatsapp já existe';
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
SET whatsapp = '(11) 99999-9999'
WHERE user_id = (SELECT user_id FROM user_profiles LIMIT 1)
RETURNING user_id, whatsapp; 