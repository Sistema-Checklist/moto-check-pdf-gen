-- Script para adicionar campos de empresa à tabela user_profiles
-- Execute este código no SQL Editor do Supabase

-- 1. Adicionar colunas de empresa
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255) DEFAULT '',
ADD COLUMN IF NOT EXISTS company_logo TEXT DEFAULT '';

-- 2. Verificar resultado
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position; 