-- Script extremamente básico para criar tabela agendamentos
-- Execute este código no SQL Editor do Supabase

-- 1. Verificar se a tabela existe
SELECT table_name FROM information_schema.tables WHERE table_name = 'agendamentos';

-- 2. Remover tabela se existir
DROP TABLE IF EXISTS agendamentos;

-- 3. Criar tabela do zero
CREATE TABLE agendamentos (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    telefone TEXT NOT NULL,
    placa TEXT NOT NULL,
    tipo TEXT NOT NULL,
    status TEXT DEFAULT 'pendente'
);

-- 4. Verificar se foi criada
SELECT * FROM agendamentos LIMIT 1;

-- 5. Testar inserção
INSERT INTO agendamentos (nome, telefone, placa, tipo, status) 
VALUES ('Teste', '(11) 99999-9999', 'ABC-1234', 'Manutenção', 'pendente');

-- 6. Verificar inserção
SELECT * FROM agendamentos; 