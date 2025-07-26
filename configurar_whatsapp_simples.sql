-- Script simples para configurar WhatsApp do admin
-- IMPORTANTE: Substitua '11999999999' pelo número real do WhatsApp do admin

-- 1. Verificar se existe algum usuário
SELECT COUNT(*) as total_usuarios FROM user_profiles;

-- 2. Verificar se o admin existe
SELECT * FROM user_profiles WHERE email = 'kauankg@hotmail.com';

-- 3. Inserir ou atualizar o admin com WhatsApp
-- IMPORTANTE: Substitua '11999999999' pelo número real do WhatsApp
INSERT INTO user_profiles (email, whatsapp, is_approved, is_frozen, created_at)
VALUES ('kauankg@hotmail.com', '11999999999', true, false, NOW())
ON CONFLICT (email) 
DO UPDATE SET 
    whatsapp = '11999999999',
    is_approved = true,
    is_frozen = false,
    updated_at = NOW();

-- 4. Verificar se foi configurado
SELECT email, whatsapp, is_approved FROM user_profiles WHERE email = 'kauankg@hotmail.com';

-- 5. Listar todos os usuários com WhatsApp
SELECT email, whatsapp FROM user_profiles WHERE whatsapp IS NOT NULL AND whatsapp != '';

-- 6. Se não houver nenhum usuário, criar um admin básico
-- IMPORTANTE: Substitua '11999999999' pelo número real do WhatsApp
INSERT INTO user_profiles (email, whatsapp, is_approved, is_frozen, created_at)
SELECT 'admin@checksystem.com', '11999999999', true, false, NOW()
WHERE NOT EXISTS (SELECT 1 FROM user_profiles);

-- 7. Verificar resultado final
SELECT 'Configuração concluída!' as status;
SELECT email, whatsapp FROM user_profiles WHERE whatsapp IS NOT NULL AND whatsapp != ''; 