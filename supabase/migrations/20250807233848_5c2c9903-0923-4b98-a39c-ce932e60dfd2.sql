
-- 1) Função helper para checar admin sem consultar auth.users diretamente na política
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = auth.uid()
      AND email = 'kauankg@hotmail.com'
  );
$$;

-- 2) Permissão para a função
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- 3) Garantir RLS habilitado
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 4) Recriar política de admin usando a função
DROP POLICY IF EXISTS "Admin total access" ON public.user_profiles;

CREATE POLICY "Admin total access"
ON public.user_profiles
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());
