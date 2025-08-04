-- Adicionar campo whatsapp na tabela user_profiles se não existir
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(50) DEFAULT '';

-- Atualizar dados existentes que tenham whatsapp vazio com o valor do phone
UPDATE public.user_profiles 
SET whatsapp = phone 
WHERE whatsapp = '' OR whatsapp IS NULL;