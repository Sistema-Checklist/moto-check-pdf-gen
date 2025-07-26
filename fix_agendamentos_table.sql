-- Script robusto para verificar e corrigir a tabela agendamentos
-- Execute este código no SQL Editor do Supabase

-- 1. Verificar se a tabela existe e sua estrutura atual
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'agendamentos'
ORDER BY ordinal_position;

-- 2. Se a tabela não existir, criar com estrutura completa
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agendamentos') THEN
        CREATE TABLE agendamentos (
            id SERIAL PRIMARY KEY,
            nome VARCHAR(255) NOT NULL,
            telefone VARCHAR(20) NOT NULL,
            placa VARCHAR(10) NOT NULL,
            tipo VARCHAR(100) NOT NULL,
            data DATE NOT NULL,
            horario TIME NOT NULL,
            obs TEXT,
            status VARCHAR(20) DEFAULT 'pendente',
            locatario_rg VARCHAR(20) DEFAULT '',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Tabela agendamentos criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela agendamentos já existe';
    END IF;
END $$;

-- 3. Verificar e adicionar colunas que podem estar faltando
DO $$
BEGIN
    -- Adicionar coluna 'data' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'agendamentos'
        AND column_name = 'data'
    ) THEN
        ALTER TABLE agendamentos ADD COLUMN data DATE NOT NULL DEFAULT CURRENT_DATE;
        RAISE NOTICE 'Coluna data adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna data já existe';
    END IF;

    -- Adicionar coluna 'horario' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'agendamentos'
        AND column_name = 'horario'
    ) THEN
        ALTER TABLE agendamentos ADD COLUMN horario TIME NOT NULL DEFAULT '00:00';
        RAISE NOTICE 'Coluna horario adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna horario já existe';
    END IF;

    -- Adicionar coluna 'obs' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'agendamentos'
        AND column_name = 'obs'
    ) THEN
        ALTER TABLE agendamentos ADD COLUMN obs TEXT;
        RAISE NOTICE 'Coluna obs adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna obs já existe';
    END IF;

    -- Adicionar coluna 'status' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'agendamentos'
        AND column_name = 'status'
    ) THEN
        ALTER TABLE agendamentos ADD COLUMN status VARCHAR(20) DEFAULT 'pendente';
        RAISE NOTICE 'Coluna status adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna status já existe';
    END IF;

    -- Adicionar coluna 'locatario_rg' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'agendamentos'
        AND column_name = 'locatario_rg'
    ) THEN
        ALTER TABLE agendamentos ADD COLUMN locatario_rg VARCHAR(20) DEFAULT '';
        RAISE NOTICE 'Coluna locatario_rg adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna locatario_rg já existe';
    END IF;

    -- Adicionar coluna 'created_at' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'agendamentos'
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE agendamentos ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Coluna created_at adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna created_at já existe';
    END IF;
END $$;

-- 4. Verificar estrutura final
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'agendamentos'
ORDER BY ordinal_position;

-- 5. Configurar RLS se não estiver configurado
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'agendamentos' 
        AND policyname = 'Permitir inserções públicas'
    ) THEN
        ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Permitir inserções públicas" ON agendamentos
            FOR INSERT WITH CHECK (true);
            
        CREATE POLICY "Permitir leitura para usuários autenticados" ON agendamentos
            FOR SELECT USING (auth.role() = 'authenticated');
            
        RAISE NOTICE 'RLS configurado com sucesso';
    ELSE
        RAISE NOTICE 'RLS já está configurado';
    END IF;
END $$;

-- 6. Testar inserção
INSERT INTO agendamentos (nome, telefone, placa, tipo, data, horario, obs, status, locatario_rg)
VALUES ('Teste Sistema', '(11) 99999-9999', 'ABC-1234', 'Manutenção Preventiva', CURRENT_DATE, '14:00', 'Teste de funcionamento', 'pendente', '')
RETURNING id, nome, data, horario, created_at; 