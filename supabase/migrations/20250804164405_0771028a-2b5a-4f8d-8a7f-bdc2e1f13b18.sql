-- Atualizar políticas RLS da tabela locatários para serem específicas por usuário
-- Remover políticas existentes
DROP POLICY IF EXISTS "Usuários podem ver locatários" ON public.locatarios;
DROP POLICY IF EXISTS "Usuários podem criar locatários" ON public.locatarios;
DROP POLICY IF EXISTS "Usuários podem atualizar locatários" ON public.locatarios;

-- Adicionar coluna user_id se não existir
ALTER TABLE public.locatarios 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Criar novas políticas que vinculam locatários ao usuário
CREATE POLICY "Usuários podem ver seus próprios locatários" 
ON public.locatarios 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios locatários" 
ON public.locatarios 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios locatários" 
ON public.locatarios 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios locatários" 
ON public.locatarios 
FOR DELETE 
USING (auth.uid() = user_id);

-- Atualizar políticas RLS da tabela motos para serem específicas por usuário
-- Remover políticas existentes
DROP POLICY IF EXISTS "Usuários podem ver suas próprias motos" ON public.motos;
DROP POLICY IF EXISTS "Usuários podem criar motos" ON public.motos;
DROP POLICY IF EXISTS "Usuários podem atualizar motos" ON public.motos;

-- Adicionar coluna user_id se não existir
ALTER TABLE public.motos 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Criar novas políticas que vinculam motos ao usuário
CREATE POLICY "Usuários podem ver suas próprias motos" 
ON public.motos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias motos" 
ON public.motos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias motos" 
ON public.motos 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias motos" 
ON public.motos 
FOR DELETE 
USING (auth.uid() = user_id);