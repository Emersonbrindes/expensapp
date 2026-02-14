# ExpensApp - Standalone Version

Sistema de controle de despesas de viagens, modificado para funcionar fora da plataforma Manus.

## 🚀 Deploy no Railway

### 1. Variáveis de Ambiente Necessárias

Configure as seguintes variáveis no Railway:

```
DATABASE_URL=<gerado automaticamente pelo Railway MySQL>
NODE_ENV=production
PORT=3000
VITE_APP_TITLE=ExpensApp
VITE_APP_LOGO=/logo.svg
JWT_SECRET=<sua-chave-secreta-aleatoria>
```

### 2. Serviços Necessários

- **MySQL Database** (adicione via Railway)
- **Node.js Service** (conectado ao repositório GitHub)

### 3. Build Commands

O Railway detecta automaticamente os comandos do `package.json`:

- **Build:** `pnpm run build`
- **Start:** `pnpm run start`

### 4. Após o Deploy

1. Acesse o domínio gerado pelo Railway
2. O sistema criará automaticamente um usuário padrão
3. Todas as funcionalidades estarão disponíveis!

## 📝 Funcionalidades

- ✅ Gerenciamento de despesas
- ✅ Categorias personalizadas
- ✅ Semanas de trabalho
- ✅ Rotas e distâncias
- ✅ Relatórios e histórico
- ✅ Interface responsiva (mobile-first)

## 🔧 Modificações Realizadas

Esta versão foi modificada para funcionar independentemente do Manus:

1. ✂️ Removido `vite-plugin-manus-runtime`
2. 🔓 Autenticação simplificada (usuário único automático)
3. ✅ Mantidas todas as funcionalidades principais

## 💻 Desenvolvimento Local

```bash
# Instalar dependências
pnpm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com suas configurações

# Executar migrações do banco
pnpm run db:push

# Iniciar servidor de desenvolvimento
pnpm run dev
```

## 📦 Build para Produção

```bash
pnpm run build
pnpm run start
```

---

**Desenvolvido originalmente no Manus, adaptado para deploy standalone.**
