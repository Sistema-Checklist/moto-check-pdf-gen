-- Habilitar RLS na tabela agendamentos se ainda não estiver habilitado
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

-- Verificar se a tabela tem user_id, se não tiver, adicionar
ALTER TABLE public.agendamentos 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Criar políticas RLS para agendamentos
CREATE POLICY "Usuários podem ver seus próprios agendamentos" 
ON public.agendamentos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios agendamentos" 
ON public.agendamentos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios agendamentos" 
ON public.agendamentos 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios agendamentos" 
ON public.agendamentos 
FOR DELETE 
USING (auth.uid() = user_id);