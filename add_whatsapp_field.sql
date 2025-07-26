-- Script para adicionar campo WhatsApp à tabela user_profiles
-- Execute este código no SQL Editor do Supabase

-- 1. Adicionar coluna WhatsApp
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20) DEFAULT '';

-- 2. Verificar resultado
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 3. Testar inserção de dados
UPDATE user_profiles
SET whatsapp = '(11) 99999-9999'
WHERE user_id = (SELECT user_id FROM user_profiles LIMIT 1)
RETURNING user_id, whatsapp; 