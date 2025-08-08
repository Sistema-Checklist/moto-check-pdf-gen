-- 1) Função genérica para assegurar user_id nos INSERTs/UPDATEs
CREATE OR REPLACE FUNCTION public.ensure_user_id_on_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Define user_id como o usuário autenticado se vier nulo
    IF NEW.user_id IS NULL THEN
      NEW.user_id = auth.uid();
    ELSIF NEW.user_id <> auth.uid() THEN
      RAISE EXCEPTION 'Não é permitido definir user_id diferente do usuário autenticado';
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Impede mover o registro para outro usuário
    IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'user_id não pode ser alterado';
    END IF;
    -- Apenas o dono pode atualizar
    IF OLD.user_id IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'Apenas o dono do registro pode atualizá-lo';
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

-- 2) Garantir RLS habilitado (idempotente)
ALTER TABLE public.motos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locatarios ENABLE ROW LEVEL SECURITY;

-- 3) Triggers para motos
DROP TRIGGER IF EXISTS ensure_user_id_on_write_motos ON public.motos;
CREATE TRIGGER ensure_user_id_on_write_motos
BEFORE INSERT OR UPDATE ON public.motos
FOR EACH ROW
EXECUTE FUNCTION public.ensure_user_id_on_write();

-- 4) Triggers para locatarios
DROP TRIGGER IF EXISTS ensure_user_id_on_write_locatarios ON public.locatarios;
CREATE TRIGGER ensure_user_id_on_write_locatarios
BEFORE INSERT OR UPDATE ON public.locatarios
FOR EACH ROW
EXECUTE FUNCTION public.ensure_user_id_on_write();

-- 5) Índices em user_id para performance
CREATE INDEX IF NOT EXISTS idx_motos_user_id ON public.motos(user_id);
CREATE INDEX IF NOT EXISTS idx_locatarios_user_id ON public.locatarios(user_id);