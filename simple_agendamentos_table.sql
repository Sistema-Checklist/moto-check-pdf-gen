-- Script simples para criar tabela agendamentos
-- Execute este código no SQL Editor do Supabase

-- 1. Remover tabela se existir
DROP TABLE IF EXISTS agendamentos CASCADE;

-- 2. Criar tabela com colunas mínimas
CREATE TABLE agendamentos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    placa VARCHAR(10) NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'pendente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Configurar RLS
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de acesso
CREATE POLICY "Permitir inserções públicas" ON agendamentos
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir leitura para usuários autenticados" ON agendamentos
    FOR SELECT USING (auth.role() = 'authenticated');

-- 5. Testar inserção
INSERT INTO agendamentos (nome, telefone, placa, tipo, status)
VALUES ('Teste', '(11) 99999-9999', 'ABC-1234', 'Manutenção Preventiva', 'pendente')
RETURNING id, nome, created_at; 