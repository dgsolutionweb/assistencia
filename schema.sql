-- Schema para o sistema de checklist de assistência técnica

-- Habilita a extensão UUID para gerar IDs únicos
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de clientes
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL UNIQUE,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de ordens de serviço
CREATE TABLE ordens_servico (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  problema_relatado TEXT NOT NULL,
  tecnico_responsavel TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'aguardando',
  observacoes_internas TEXT,
  localizacao_fisica TEXT,
  data_entrada TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de dispositivos
CREATE TABLE dispositivos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ordem_servico_id UUID REFERENCES ordens_servico(id) ON DELETE CASCADE,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  imei TEXT,
  serial TEXT,
  senha TEXT,
  condicao_externa TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de acessórios
CREATE TABLE acessorios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dispositivo_id UUID REFERENCES dispositivos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de categorias de checklist
CREATE TABLE categorias_checklist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  ordem INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de itens de checklist
CREATE TABLE itens_checklist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  categoria_id UUID REFERENCES categorias_checklist(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  ordem INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de verificações de checklist
CREATE TABLE verificacoes_checklist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ordem_servico_id UUID REFERENCES ordens_servico(id) ON DELETE CASCADE,
  item_checklist_id UUID REFERENCES itens_checklist(id) ON DELETE CASCADE,
  verificado BOOLEAN NOT NULL DEFAULT FALSE,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ordem_servico_id, item_checklist_id)
);

-- Inserir categorias padrão de checklist
INSERT INTO categorias_checklist (titulo, ordem) VALUES
('Verificação Inicial', 1),
('Diagnóstico de Hardware', 2),
('Diagnóstico de Software', 3),
('Testes Finais', 4);

-- Inserir itens padrão para a categoria "Verificação Inicial"
INSERT INTO itens_checklist (categoria_id, descricao, ordem)
SELECT id, 'Verificar condição física externa', 1
FROM categorias_checklist
WHERE titulo = 'Verificação Inicial';

INSERT INTO itens_checklist (categoria_id, descricao, ordem)
SELECT id, 'Verificar funcionamento dos botões', 2
FROM categorias_checklist
WHERE titulo = 'Verificação Inicial';

INSERT INTO itens_checklist (categoria_id, descricao, ordem)
SELECT id, 'Verificar se liga normalmente', 3
FROM categorias_checklist
WHERE titulo = 'Verificação Inicial';

-- Inserir itens padrão para a categoria "Diagnóstico de Hardware"
INSERT INTO itens_checklist (categoria_id, descricao, ordem)
SELECT id, 'Verificar funcionamento da tela', 1
FROM categorias_checklist
WHERE titulo = 'Diagnóstico de Hardware';

INSERT INTO itens_checklist (categoria_id, descricao, ordem)
SELECT id, 'Verificar funcionamento do touch', 2
FROM categorias_checklist
WHERE titulo = 'Diagnóstico de Hardware';

INSERT INTO itens_checklist (categoria_id, descricao, ordem)
SELECT id, 'Verificar funcionamento da câmera', 3
FROM categorias_checklist
WHERE titulo = 'Diagnóstico de Hardware';

INSERT INTO itens_checklist (categoria_id, descricao, ordem)
SELECT id, 'Verificar funcionamento do alto-falante', 4
FROM categorias_checklist
WHERE titulo = 'Diagnóstico de Hardware';

INSERT INTO itens_checklist (categoria_id, descricao, ordem)
SELECT id, 'Verificar funcionamento do microfone', 5
FROM categorias_checklist
WHERE titulo = 'Diagnóstico de Hardware';

-- Inserir itens padrão para a categoria "Diagnóstico de Software"
INSERT INTO itens_checklist (categoria_id, descricao, ordem)
SELECT id, 'Verificar sistema operacional', 1
FROM categorias_checklist
WHERE titulo = 'Diagnóstico de Software';

INSERT INTO itens_checklist (categoria_id, descricao, ordem)
SELECT id, 'Verificar aplicativos básicos', 2
FROM categorias_checklist
WHERE titulo = 'Diagnóstico de Software';

INSERT INTO itens_checklist (categoria_id, descricao, ordem)
SELECT id, 'Verificar conectividade Wi-Fi', 3
FROM categorias_checklist
WHERE titulo = 'Diagnóstico de Software';

INSERT INTO itens_checklist (categoria_id, descricao, ordem)
SELECT id, 'Verificar conectividade Bluetooth', 4
FROM categorias_checklist
WHERE titulo = 'Diagnóstico de Software';

-- Inserir itens padrão para a categoria "Testes Finais"
INSERT INTO itens_checklist (categoria_id, descricao, ordem)
SELECT id, 'Realizar teste de bateria', 1
FROM categorias_checklist
WHERE titulo = 'Testes Finais';

INSERT INTO itens_checklist (categoria_id, descricao, ordem)
SELECT id, 'Realizar teste de desempenho', 2
FROM categorias_checklist
WHERE titulo = 'Testes Finais';

INSERT INTO itens_checklist (categoria_id, descricao, ordem)
SELECT id, 'Verificar se todos os problemas foram resolvidos', 3
FROM categorias_checklist
WHERE titulo = 'Testes Finais';

INSERT INTO itens_checklist (categoria_id, descricao, ordem)
SELECT id, 'Realizar limpeza final do dispositivo', 4
FROM categorias_checklist
WHERE titulo = 'Testes Finais';

-- Criação de políticas de segurança (RLS)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispositivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE acessorios ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE verificacoes_checklist ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso anônimo para leitura e escrita (para desenvolvimento)
CREATE POLICY "Permitir acesso anônimo para clientes" ON clientes FOR ALL USING (true);
CREATE POLICY "Permitir acesso anônimo para ordens de serviço" ON ordens_servico FOR ALL USING (true);
CREATE POLICY "Permitir acesso anônimo para dispositivos" ON dispositivos FOR ALL USING (true);
CREATE POLICY "Permitir acesso anônimo para acessórios" ON acessorios FOR ALL USING (true);
CREATE POLICY "Permitir acesso anônimo para categorias de checklist" ON categorias_checklist FOR ALL USING (true);
CREATE POLICY "Permitir acesso anônimo para itens de checklist" ON itens_checklist FOR ALL USING (true);
CREATE POLICY "Permitir acesso anônimo para verificações de checklist" ON verificacoes_checklist FOR ALL USING (true);

-- Trigger para atualizar o timestamp de data_atualizacao
CREATE OR REPLACE FUNCTION update_ordem_servico_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.data_atualizacao = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ordem_servico_timestamp
BEFORE UPDATE ON ordens_servico
FOR EACH ROW
EXECUTE FUNCTION update_ordem_servico_timestamp();

-- Índices para melhorar a performance
CREATE INDEX idx_ordens_servico_cliente_id ON ordens_servico(cliente_id);
CREATE INDEX idx_dispositivos_ordem_servico_id ON dispositivos(ordem_servico_id);
CREATE INDEX idx_acessorios_dispositivo_id ON acessorios(dispositivo_id);
CREATE INDEX idx_itens_checklist_categoria_id ON itens_checklist(categoria_id);
CREATE INDEX idx_verificacoes_ordem_servico_id ON verificacoes_checklist(ordem_servico_id);
CREATE INDEX idx_verificacoes_item_checklist_id ON verificacoes_checklist(item_checklist_id);
