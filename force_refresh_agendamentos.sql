-- Script para forçar a criação da tabela agendamentos
-- Execute este script no SQL Editor do Supabase

-- 1. Forçar remoção da tabela
DROP TABLE IF EXISTS agendamentos CASCADE;

-- 2. Criar tabela simples
CREATE TABLE agendamentos (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    telefone TEXT NOT NULL,
    placa TEXT NOT NULL,
    tipo TEXT NOT NULL,
    status TEXT DEFAULT 'pendente',
    data DATE,
    horario TIME,
    obs TEXT,
    locatario_rg TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Habilitar RLS
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

-- 4. Política simples
CREATE POLICY "Permitir tudo para usuários autenticados" ON agendamentos
    FOR ALL USING (auth.role() = 'authenticated');

-- 5. Teste de inserção
INSERT INTO agendamentos (nome, telefone, placa, tipo) 
VALUES ('Teste', '11999999999', 'ABC1234', 'manutencao');

-- 6. Verificar
SELECT * FROM agendamentos;

-- 7. Limpar teste
DELETE FROM agendamentos WHERE nome = 'Teste';

-- 8. Confirmar estrutura
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'agendamentos' ORDER BY ordinal_position; 