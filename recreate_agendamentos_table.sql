-- Script para recriar completamente a tabela agendamentos
-- Execute este código no SQL Editor do Supabase

-- 1. Remover tabela existente (se existir)
DROP TABLE IF EXISTS agendamentos CASCADE;

-- 2. Criar tabela com estrutura completa
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

-- 3. Verificar estrutura criada
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'agendamentos'
ORDER BY ordinal_position;

-- 4. Configurar RLS
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas de acesso
CREATE POLICY "Permitir inserções públicas" ON agendamentos
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir leitura para usuários autenticados" ON agendamentos
    FOR SELECT USING (auth.role() = 'authenticated');

-- 6. Testar inserção
INSERT INTO agendamentos (nome, telefone, placa, tipo, data, horario, obs, status, locatario_rg)
VALUES ('Teste Sistema', '(11) 99999-9999', 'ABC-1234', 'Manutenção Preventiva', CURRENT_DATE, '14:00', 'Teste de funcionamento', 'pendente', '')
RETURNING id, nome, data, horario, created_at; 