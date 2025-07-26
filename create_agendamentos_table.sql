-- Script para criar a tabela agendamentos
-- Execute este código no SQL Editor do Supabase

-- 1. Criar tabela agendamentos se não existir
CREATE TABLE IF NOT EXISTS agendamentos (
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

-- 2. Verificar se a tabela foi criada
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'agendamentos'
ORDER BY ordinal_position;

-- 3. Testar inserção
INSERT INTO agendamentos (nome, telefone, placa, tipo, data, horario, obs, status, locatario_rg)
VALUES ('Teste', '(11) 99999-9999', 'ABC-1234', 'Manutenção Preventiva', '2024-01-15', '14:00', 'Teste de inserção', 'pendente', '')
RETURNING id, nome, created_at;

-- 4. Configurar RLS (Row Level Security) se necessário
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

-- 5. Criar política para permitir inserções públicas
CREATE POLICY "Permitir inserções públicas" ON agendamentos
    FOR INSERT WITH CHECK (true);

-- 6. Criar política para permitir leitura para usuários autenticados
CREATE POLICY "Permitir leitura para usuários autenticados" ON agendamentos
    FOR SELECT USING (auth.role() = 'authenticated'); 