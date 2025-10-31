# Arquitetura Técnica - Sistema de Gerenciamento Financeiro

## 1. Architecture design

```mermaid
graph TD
    A[User Browser] --> B[Next.js Frontend Application]
    B --> C[Supabase SDK]
    C --> D[Supabase Service]

    subgraph "Frontend Layer"
        B
        E[React Components]
        F[Tailwind CSS]
        G[Form Validation]
    end

    subgraph "Service Layer (Provided by Supabase)"
        D
        H[PostgreSQL Database]
        I[Authentication Service]
        J[Real-time Subscriptions]
    end

    B --> E
    B --> F
    B --> G
    C --> H
    C --> I
    C --> J
```

## 2. Technology Description

* Frontend: Next.js\@14 + React\@18 + TypeScript + Tailwind CSS\@3 + React Hook Form + Zod

* Backend: Supabase (PostgreSQL + Auth + Real-time)

* Deployment: Vercel (Frontend) + Supabase Cloud

## 3. Route definitions

| Route           | Purpose                                                                      |
| --------------- | ---------------------------------------------------------------------------- |
| /               | Página inicial - redireciona para /login ou /dashboard conforme autenticação |
| /login          | Página de login e autenticação de usuários                                   |
| /dashboard      | Dashboard principal com resumo financeiro e navegação                        |
| /servicos/novo  | Formulário para cadastro de novos serviços                                   |
| /servicos       | Lista completa de serviços com filtros e paginação                           |
| /servicos/\[id] | Página de edição de serviço específico                                       |
| /relatorios     | Página de relatórios e estatísticas financeiras                              |
| /perfil         | Configurações do perfil do usuário                                           |

## 4. API definitions

### 4.1 Core API

**Autenticação (Supabase Auth)**

```typescript
// Login
supabase.auth.signInWithPassword({
  email: string,
  password: string
})

// Logout
supabase.auth.signOut()

// Recuperação de senha
supabase.auth.resetPasswordForEmail(email: string)
```

**Serviços CRUD**

```typescript
// Criar serviço
supabase.from('servicos').insert({
  nome_aparelho: string,
  valor_total: number,
  custo_peca: number,
  observacoes?: string,
  user_id: string
})

// Listar serviços
supabase.from('servicos')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })

// Atualizar serviço
supabase.from('servicos')
  .update(updateData)
  .eq('id', serviceId)
  .eq('user_id', userId)

// Deletar serviço
supabase.from('servicos')
  .delete()
  .eq('id', serviceId)
  .eq('user_id', userId)
```

**Tipos TypeScript**

```typescript
interface Servico {
  id: string;
  nome_aparelho: string;
  valor_total: number;
  custo_peca: number;
  lucro: number; // calculado: valor_total - custo_peca
  observacoes?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface RelatorioResumo {
  lucro_total: number;
  total_servicos: number;
  ticket_medio: number;
  custo_medio_pecas: number;
}

interface FiltrosPeriodo {
  data_inicio?: string;
  data_fim?: string;
}
```

## 5. Server architecture diagram

```mermaid
graph TD
    A[Next.js App Router] --> B[Page Components]
    B --> C[React Components]
    C --> D[Custom Hooks]
    D --> E[Supabase Client]
    E --> F[Supabase Services]

    subgraph "Frontend Architecture"
        A
        B
        C
        D
    end

    subgraph "Data Layer"
        E
        F
        G[PostgreSQL Database]
        H[Auth Service]
    end

    F --> G
    F --> H
```

## 6. Data model

### 6.1 Data model definition

```mermaid
erDiagram
    USERS ||--o{ SERVICOS : owns
    
    USERS {
        uuid id PK
        string email
        string encrypted_password
        timestamp created_at
        timestamp updated_at
    }
    
    SERVICOS {
        uuid id PK
        string nome_aparelho
        decimal valor_total
        decimal custo_peca
        decimal lucro
        text observacoes
        timestamp created_at
        timestamp updated_at
        uuid user_id FK
    }
```

### 6.2 Data Definition Language

**Tabela de Serviços (servicos)**

```sql
-- Criar tabela de serviços
CREATE TABLE servicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_aparelho VARCHAR(255) NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL CHECK (valor_total >= 0),
    custo_peca DECIMAL(10,2) NOT NULL CHECK (custo_peca >= 0),
    lucro DECIMAL(10,2) GENERATED ALWAYS AS (valor_total - custo_peca) STORED,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Criar índices para performance
CREATE INDEX idx_servicos_user_id ON servicos(user_id);
CREATE INDEX idx_servicos_created_at ON servicos(created_at DESC);
CREATE INDEX idx_servicos_lucro ON servicos(lucro DESC);

-- Configurar RLS (Row Level Security)
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;

-- Política para usuários autenticados acessarem apenas seus próprios dados
CREATE POLICY "Users can view own servicos" ON servicos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own servicos" ON servicos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own servicos" ON servicos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own servicos" ON servicos
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_servicos_updated_at 
    BEFORE UPDATE ON servicos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Dados iniciais para demonstração (opcional)
INSERT INTO servicos (nome_aparelho, valor_total, custo_peca, observacoes, user_id)
VALUES 
    ('Smartphone Samsung Galaxy', 150.00, 80.00, 'Troca de tela', auth.uid()),
    ('iPhone 12', 300.00, 200.00, 'Reparo da bateria', auth.uid()),
    ('Notebook Dell', 250.00, 120.00, 'Limpeza e troca de pasta térmica', auth.uid())
WHERE auth.uid() IS NOT NULL;
```

**Configurações de Permissões Supabase**

```sql
-- Garantir acesso básico para usuários anônimos (apenas para auth)
GRANT USAGE ON SCHEMA public TO anon;

-- Garantir acesso completo para usuários autenticados
GRANT ALL PRIVILEGES ON TABLE servicos TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
```

