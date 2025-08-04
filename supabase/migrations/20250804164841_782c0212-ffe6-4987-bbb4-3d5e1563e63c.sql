-- Habilitar RLS na tabela user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para user_profiles
CREATE POLICY "Usuários podem ver seu próprio perfil" 
ON public.user_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil" 
ON public.user_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Política para admin ver todos os perfis
CREATE POLICY "Admin pode ver todos os perfis" 
ON public.user_profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'kauankg@hotmail.com'
  )
);

-- Política para admin atualizar todos os perfis
CREATE POLICY "Admin pode atualizar todos os perfis" 
ON public.user_profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'kauankg@hotmail.com'
  )
);

-- Política para admin criar perfis
CREATE POLICY "Admin pode criar perfis" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'kauankg@hotmail.com'
  )
);

-- Política para admin deletar perfis
CREATE POLICY "Admin pode deletar perfis" 
ON public.user_profiles 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'kauankg@hotmail.com'
  )
);