# Documentação Técnica - Planejador de Despesas para Representantes Comerciais

## 1. Visão Geral do Projeto

O **Planejador de Despesas** é uma aplicação web full-stack desenvolvida para permitir que representantes comerciais gerenciem suas programações de despesas semanais de forma intuitiva e eficiente. O sistema oferece cálculos automáticos, exportação em PDF e rastreamento de custos ao longo da semana.

**Tecnologias Utilizadas:**
- **Frontend:** React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **Backend:** Express 4, tRPC 11, Node.js
- **Banco de Dados:** MySQL/TiDB
- **Autenticação:** Manus OAuth
- **Exportação:** jsPDF, jspdf-autotable

---

## 2. Arquitetura do Sistema

### 2.1 Estrutura de Pastas

```
expense_planner/
├── client/                          # Frontend React
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx            # Página inicial com opções
│   │   │   ├── ExpenseForm.tsx     # Formulário principal de despesas
│   │   │   └── NotFound.tsx        # Página 404
│   │   ├── components/
│   │   │   ├── DashboardLayout.tsx # Layout com sidebar
│   │   │   └── ui/                 # Componentes shadcn/ui
│   │   ├── lib/
│   │   │   └── trpc.ts             # Cliente tRPC
│   │   ├── App.tsx                 # Roteamento principal
│   │   ├── main.tsx                # Entrada da aplicação
│   │   └── index.css               # Estilos globais
│   ├── public/                      # Arquivos estáticos
│   └── index.html                   # Template HTML
├── server/                          # Backend Express
│   ├── routers.ts                  # Definição de rotas tRPC
│   ├── db.ts                       # Funções de banco de dados
│   └── _core/                      # Código interno do framework
├── drizzle/                         # Migrações e schema
│   ├── schema.ts                   # Definição de tabelas
│   └── migrations/                 # Arquivos de migração
├── shared/                          # Código compartilhado
└── package.json                     # Dependências do projeto
```

### 2.2 Fluxo de Dados

```
Cliente (React)
    ↓
tRPC Client (lib/trpc.ts)
    ↓
API tRPC (/api/trpc)
    ↓
Routers (server/routers.ts)
    ↓
Database Helpers (server/db.ts)
    ↓
Drizzle ORM
    ↓
MySQL Database
```

---

## 3. Modelo de Dados

### 3.1 Tabelas do Banco de Dados

#### **Tabela: users**
Armazena informações dos representantes comerciais.

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openId VARCHAR(64) UNIQUE NOT NULL,
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **Tabela: expenseCategories**
Categorias de despesas personalizáveis por usuário.

```sql
CREATE TABLE expenseCategories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

#### **Tabela: expenses**
Registro detalhado de todas as despesas.

```sql
CREATE TABLE expenses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  categoryId INT,
  description VARCHAR(255) NOT NULL,
  amount INT NOT NULL,              -- Armazenado em centavos
  date TIMESTAMP NOT NULL,           -- Data da despesa
  notes TEXT,
  status ENUM('planned', 'completed', 'cancelled') DEFAULT 'planned',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (categoryId) REFERENCES expenseCategories(id)
);
```

#### **Tabela: workWeeks** (NOVA - A IMPLEMENTAR)
Registro de semanas de trabalho com datas e trajetos.

```sql
CREATE TABLE workWeeks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  weekStartDate DATE NOT NULL,
  weekEndDate DATE NOT NULL,
  workDays JSON,                     -- Array com dias trabalhados (0-6)
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

#### **Tabela: routes** (NOVA - A IMPLEMENTAR)
Trajetos entre cidades com quilometragem.

```sql
CREATE TABLE routes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  workWeekId INT NOT NULL,
  origin VARCHAR(100) NOT NULL,     -- Cidade de origem
  destination VARCHAR(100) NOT NULL,-- Cidade de destino
  distance DECIMAL(10, 2) NOT NULL, -- Quilometragem
  dayOfWeek INT NOT NULL,            -- 0-6 (segunda a domingo)
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (workWeekId) REFERENCES workWeeks(id)
);
```

---

## 4. Funcionalidades Principais

### 4.1 Página Inicial (Home.tsx)

**Objetivo:** Apresentar o aplicativo e permitir navegação para as principais funcionalidades.

**Componentes:**
- Header com nome do usuário e botão de logout
- Cards com opções: "Programar Despesas" e "Histórico"
- Seção "Como Funciona" com 3 passos

**Fluxo:**
1. Usuário não autenticado vê tela de login
2. Usuário autenticado vê dashboard com opções
3. Clique em "Programar Despesas" leva para ExpenseForm

---

### 4.2 Formulário de Despesas (ExpenseForm.tsx)

**Objetivo:** Permitir que o representante preencha suas despesas semanais com cálculos automáticos.

#### **4.2.1 Seção de Seleção de Datas e Dias de Trabalho** (NOVA)

**Campos:**
- Seletor de semana (data inicial)
- Checkboxes para cada dia da semana (Segunda a Domingo)
- Indicador visual dos dias selecionados

**Funcionalidade:**
- Usuário seleciona apenas os dias que vai trabalhar
- Tabela de despesas mostra apenas os dias selecionados
- Cálculos consideram apenas dias de trabalho

**Exemplo:**
```
Semana de: 10/11/2025 a 16/11/2025

Dias de Trabalho:
☑ Segunda (10/11)  ☑ Terça (11/11)  ☑ Quarta (12/11)  ☐ Quinta (13/11)
☐ Sexta (14/11)    ☐ Sábado (15/11) ☐ Domingo (16/11)
```

#### **4.2.2 Seção de Preenchimento Rápido** (EXISTENTE)

**Campos:**
- Input para cada categoria (Hospedagem, Alimentação, Combustível, Diárias/Balsa)
- Botão "Aplicar" para replicar valor para todos os dias

**Funcionalidade:**
- Insira valor uma vez
- Clique em "Aplicar"
- Valor é preenchido automaticamente em todos os dias selecionados

---

#### **4.2.3 Tabela de Despesas Diárias** (MODIFICADA)

**Estrutura:**
```
┌─────────────┬──────────┬──────────┬──────────┬─────────────────┐
│ Categoria   │ Segunda  │ Terça    │ Quarta   │ Total Semana    │
├─────────────┼──────────┼──────────┼──────────┼─────────────────┤
│ Hospedagem  │ 160,00   │ 160,00   │ 160,00   │ 480,00          │
│ Alimentação │ 70,00    │ 70,00    │ 70,00    │ 210,00          │
│ Combustível │ 0,00     │ 0,00     │ 0,00     │ 0,00            │
│ Diárias     │ 0,00     │ 0,00     │ 0,00     │ 0,00            │
├─────────────┼──────────┼──────────┼──────────┼─────────────────┤
│ Total Dia   │ 230,00   │ 230,00   │ 230,00   │ 690,00          │
└─────────────┴──────────┴──────────┴──────────┴─────────────────┘
```

**Funcionalidade:**
- Mostra apenas dias selecionados
- Inputs numéricos para cada célula
- Cálculos automáticos de totais
- Cores alternadas para melhor legibilidade

---

#### **4.2.4 Seção de Trajetos** (NOVA)

**Objetivo:** Registrar quilometragem entre cidades para cálculo de deslocamento.

**Campos:**
```
Trajetos da Semana:

Dia: Segunda (10/11)
┌──────────────────┬──────────────────┬──────────────┐
│ Origem           │ Destino          │ Quilômetros  │
├──────────────────┼──────────────────┼──────────────┤
│ Uberaba          │ Parauapebas      │ 800          │
│ Parauapebas      │ Redenção         │ 100          │
└──────────────────┴──────────────────┴──────────────┘

Dia: Terça (11/11)
┌──────────────────┬──────────────────┬──────────────┐
│ Origem           │ Destino          │ Quilômetros  │
├──────────────────┼──────────────────┼──────────────┤
│ Redenção         │ Parauapebas      │ 200          │
└──────────────────┴──────────────────┴──────────────┘

Total Quilômetros da Semana: 1.100 KM
```

**Funcionalidade:**
- Adicionar/remover trajetos por dia
- Cálculo automático de total de KM
- Persistência no banco de dados

---

#### **4.2.5 Seção de Deslocamento Simplificada** (MODIFICADA)

**Campos:**
- Input: Quilometragem total (preenchida automaticamente dos trajetos)
- Display: Litros necessários (calculado automaticamente)
- Display: Custo total (calculado automaticamente)

**Cálculos:**
```
Quilometragem: 1.100 KM
Média KM/L: 12 KM/L
Valor/Litro: R$ 7,00

Litros = 1.100 / 12 = 91,67 L
Custo = 91,67 × 7,00 = R$ 641,67
```

---

#### **4.2.6 Projeção de Custos ao Longo da Semana** (NOVA)

**Objetivo:** Mostrar acumulado de despesas dia a dia.

**Exemplo:**
```
Projeção de Custos Acumulados:

Segunda (10/11):     R$ 230,00
Terça (11/11):       R$ 460,00 (230 + 230)
Quarta (12/11):      R$ 690,00 (460 + 230)

Total até Quarta: R$ 690,00
```

**Visualização:**
- Gráfico de linha mostrando evolução
- Tabela com dias e valores acumulados
- Atualiza em tempo real conforme usuário preenche

---

#### **4.2.7 Resumo da Semana** (EXISTENTE)

**Cards:**
- Total Despesas: R$ 690,00
- Total Deslocamento: R$ 641,67
- Total Geral: R$ 1.331,67

---

### 4.3 Botões de Ação

**Salvar Programação:**
- Salva todas as despesas no banco de dados
- Cria registros na tabela `expenses`
- Cria registro em `workWeeks` com dias selecionados
- Cria registros em `routes` com trajetos

**Exportar PDF:**
- Gera PDF com:
  - Cabeçalho: Nome do representante, semana, datas
  - Tabela de despesas diárias
  - Tabela de trajetos
  - Seção de deslocamento
  - Resumo semanal
  - Projeção de custos

---

## 5. Rotas tRPC (API)

### 5.1 Autenticação

```typescript
// GET - Obter usuário autenticado
trpc.auth.me.useQuery()

// POST - Fazer logout
trpc.auth.logout.useMutation()
```

### 5.2 Despesas

```typescript
// GET - Listar despesas por período
trpc.expenses.list.useQuery({
  startDate: Date,
  endDate: Date
})

// POST - Criar despesa
trpc.expenses.create.useMutation({
  description: string,
  amount: number,
  date: Date,
  categoryId?: number,
  notes?: string,
  status: 'planned' | 'completed' | 'cancelled'
})

// PUT - Atualizar despesa
trpc.expenses.update.useMutation({
  id: number,
  description?: string,
  amount?: number,
  date?: Date,
  categoryId?: number,
  notes?: string,
  status?: 'planned' | 'completed' | 'cancelled'
})

// DELETE - Deletar despesa
trpc.expenses.delete.useMutation({
  id: number
})
```

### 5.3 Categorias

```typescript
// GET - Listar categorias do usuário
trpc.categories.list.useQuery()

// POST - Criar categoria
trpc.categories.create.useMutation({
  name: string,
  color?: string
})

// DELETE - Deletar categoria
trpc.categories.delete.useMutation({
  id: number
})
```

### 5.4 Semanas de Trabalho (A IMPLEMENTAR)

```typescript
// POST - Criar semana de trabalho
trpc.workWeeks.create.useMutation({
  weekStartDate: Date,
  weekEndDate: Date,
  workDays: number[] // [1, 2, 3] = Segunda, Terça, Quarta
})

// GET - Obter semana de trabalho
trpc.workWeeks.get.useQuery({
  weekStartDate: Date
})
```

### 5.5 Trajetos (A IMPLEMENTAR)

```typescript
// POST - Criar trajeto
trpc.routes.create.useMutation({
  workWeekId: number,
  origin: string,
  destination: string,
  distance: number,
  dayOfWeek: number
})

// GET - Listar trajetos da semana
trpc.routes.list.useQuery({
  workWeekId: number
})

// DELETE - Deletar trajeto
trpc.routes.delete.useMutation({
  id: number
})
```

---

## 6. Fluxo de Uso

### 6.1 Cenário Típico

1. **Login:** Representante acessa o app e faz login via Manus OAuth
2. **Página Inicial:** Vê opções de "Programar Despesas" e "Histórico"
3. **Seleção de Semana:** Escolhe a semana e marca dias que vai trabalhar (ex: Seg-Qua)
4. **Preenchimento Rápido:** Insere R$ 160 em Hospedagem e clica "Aplicar"
5. **Ajustes Manuais:** Adiciona valores específicos em outras categorias
6. **Trajetos:** Registra trajetos entre cidades (Uberaba → Parauapebas: 800 KM)
7. **Revisão:** Vê projeção de custos acumulados
8. **Exportação:** Clica "Exportar PDF" para gerar relatório
9. **Salvamento:** Clica "Salvar Programação" para registrar no sistema

---

## 7. Configurações e Constantes

### 7.1 Categorias Padrão

```typescript
const DEFAULT_CATEGORIES = [
  { name: "Hospedagem", color: "#3B82F6" },
  { name: "Alimentação", color: "#10B981" },
  { name: "Combustível", color: "#F59E0B" },
  { name: "Diárias/Balsa", color: "#8B5CF6" },
];
```

### 7.2 Configuração de Combustível

```typescript
const FUEL_CONFIG = {
  kmPerLiter: 12,      // Média KM/L (personalizável)
  literPrice: 7.0,     // Valor do litro (personalizável)
};
```

### 7.3 Dias da Semana

```typescript
const DAYS_OF_WEEK = [
  "Segunda", "Terça", "Quarta", "Quinta", 
  "Sexta", "Sábado", "Domingo"
];
```

---

## 8. Dependências Principais

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^4.0.0",
    "@radix-ui/react-*": "^1.0.0",
    "express": "^4.0.0",
    "trpc": "^11.0.0",
    "drizzle-orm": "^0.30.0",
    "mysql2": "^3.0.0",
    "jspdf": "^3.0.0",
    "jspdf-autotable": "^5.0.0"
  }
}
```

---

## 9. Variáveis de Ambiente

```env
# Banco de Dados
DATABASE_URL=mysql://user:password@localhost:3306/expense_planner

# Autenticação
JWT_SECRET=seu_secret_aqui
VITE_APP_ID=seu_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im

# Aplicação
VITE_APP_TITLE=Planejador de Despesas
VITE_APP_LOGO=/logo.png

# APIs Internas
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=seu_api_key
```

---

## 10. Instruções de Deployment

### 10.1 Preparação

1. Clonar repositório
2. Instalar dependências: `pnpm install`
3. Configurar variáveis de ambiente
4. Executar migrações: `pnpm db:push`

### 10.2 Desenvolvimento

```bash
pnpm dev
```

Acessa em `http://localhost:3000`

### 10.3 Produção

```bash
pnpm build
pnpm start
```

---

## 11. Estrutura de Pastas de Componentes

```
client/src/components/
├── ui/                    # shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── label.tsx
│   └── ...
├── DashboardLayout.tsx    # Layout com sidebar
└── ErrorBoundary.tsx      # Tratamento de erros
```

---

## 12. Próximas Implementações

- [ ] Página de histórico de programações
- [ ] Dashboard com gráficos de despesas
- [ ] Edição e exclusão de despesas salvas
- [ ] Configurações personalizáveis por representante
- [ ] Relatórios gerenciais para gestores
- [ ] Notificações de limite de despesas
- [ ] Integração com sistemas de contabilidade
- [ ] App mobile (React Native)

---

## 13. Suporte e Manutenção

**Contato:** Manus Support
**Email:** support@manus.im
**Documentação:** https://docs.manus.im

---

**Versão:** 1.0.0  
**Última Atualização:** 14/11/2025  
**Status:** Em Desenvolvimento
