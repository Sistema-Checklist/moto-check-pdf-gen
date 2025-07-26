-- Script final para criar a tabela agendamentos
-- Este script remove a tabela existente (se houver) e cria uma nova com todas as colunas

-- 1. Remover a tabela agendamentos se existir
DROP TABLE IF EXISTS agendamentos CASCADE;

-- 2. Criar a tabela agendamentos com todas as colunas necessárias
CREATE TABLE agendamentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    telefone TEXT NOT NULL,
    placa TEXT NOT NULL,
    tipo TEXT NOT NULL,
    status TEXT DEFAULT 'pendente',
    data DATE,
    horario TIME,
    obs TEXT,
    locatario_rg TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas de segurança
-- Política para inserção (qualquer usuário autenticado pode inserir)
CREATE POLICY "Usuários autenticados podem inserir agendamentos" ON agendamentos
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para visualização (apenas usuários autenticados podem ver)
CREATE POLICY "Usuários autenticados podem visualizar agendamentos" ON agendamentos
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para atualização (apenas usuários autenticados podem atualizar)
CREATE POLICY "Usuários autenticados podem atualizar agendamentos" ON agendamentos
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 5. Criar função para atualizar o timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Criar trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_agendamentos_updated_at 
    BEFORE UPDATE ON agendamentos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Verificar se a tabela foi criada corretamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'agendamentos' 
ORDER BY ordinal_position;

-- 8. Inserir um registro de teste para verificar
INSERT INTO agendamentos (nome, telefone, placa, tipo, status) 
VALUES ('Teste', '11999999999', 'ABC1234', 'manutencao', 'pendente');

-- 9. Verificar se o registro foi inserido
SELECT * FROM agendamentos;

-- 10. Limpar o registro de teste
DELETE FROM agendamentos WHERE nome = 'Teste';

-- Mensagem de confirmação
SELECT 'Tabela agendamentos criada com sucesso!' as status; 