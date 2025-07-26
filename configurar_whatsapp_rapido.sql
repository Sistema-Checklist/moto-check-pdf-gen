-- Script RÁPIDO para configurar WhatsApp
-- Execute este script no SQL Editor do Supabase

-- 1. Inserir ou atualizar admin com WhatsApp
-- IMPORTANTE: Substitua '5515991653601' pelo número real do WhatsApp
INSERT INTO user_profiles (email, whatsapp, is_approved, is_frozen, created_at)
VALUES ('kauankg@hotmail.com', '5515991653601', true, false, NOW())
ON CONFLICT (email) 
DO UPDATE SET 
    whatsapp = '5515991653601',
    is_approved = true,
    is_frozen = false,
    updated_at = NOW();

-- 2. Verificar se foi configurado
SELECT email, whatsapp, is_approved FROM user_profiles WHERE email = 'kauankg@hotmail.com';

-- 3. Listar todos os usuários com WhatsApp
SELECT email, whatsapp FROM user_profiles WHERE whatsapp IS NOT NULL AND whatsapp != '';

-- 4. Mensagem de sucesso
SELECT 'WhatsApp configurado com sucesso!' as status; 