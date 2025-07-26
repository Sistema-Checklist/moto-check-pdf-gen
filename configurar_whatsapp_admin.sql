-- Script para configurar WhatsApp do admin
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se o admin existe
SELECT * FROM user_profiles WHERE email = 'kauankg@hotmail.com';

-- 2. Atualizar ou inserir WhatsApp do admin
-- Substitua '11999999999' pelo número real do WhatsApp do admin
UPDATE user_profiles 
SET whatsapp = '11999999999'
WHERE email = 'kauankg@hotmail.com';

-- 3. Se o admin não existir, criar
INSERT INTO user_profiles (email, whatsapp, is_approved, is_frozen)
SELECT 'kauankg@hotmail.com', '11999999999', true, false
WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles WHERE email = 'kauankg@hotmail.com'
);

-- 4. Verificar resultado
SELECT email, whatsapp, is_approved FROM user_profiles WHERE email = 'kauankg@hotmail.com';

-- 5. Listar todos os usuários com WhatsApp configurado
SELECT email, whatsapp FROM user_profiles WHERE whatsapp IS NOT NULL AND whatsapp != ''; 