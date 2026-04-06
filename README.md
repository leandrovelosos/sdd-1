# Sistema de Gerenciamento de Usuários

API REST para gerenciamento de usuários, construída com Node.js, TypeScript, Express e SQLite (sql.js).

---

## Tecnologias

- **Runtime**: Node.js
- **Linguagem**: TypeScript
- **Framework**: Express
- **Banco de dados**: SQLite via sql.js (in-memory)
- **Hash de senhas**: bcrypt
- **Testes**: Vitest + fast-check (property-based testing)

---

## Estrutura do Projeto

```
src/
├── app.ts                        # Configuração do Express e injeção de dependências
├── index.ts                      # Ponto de entrada
├── types/index.ts                # Interfaces, DTOs e erros customizados
├── database/
│   ├── connection.ts             # Inicialização do banco SQLite
│   └── migrations/
│       └── 001_create_users.sql  # Schema da tabela users
├── repositories/
│   └── SqliteUserRepository.ts   # Implementação do repositório com sql.js
├── services/
│   ├── UserServiceImpl.ts        # Lógica de negócio
│   ├── BcryptPasswordHasher.ts   # Hash de senhas com bcrypt
│   └── EmailValidatorImpl.ts     # Validação de formato e unicidade de email
├── routes/
│   └── userRoutes.ts             # Endpoints REST
└── middleware/
    └── errorHandler.ts           # Tratamento centralizado de erros
```

---

## Modelo de Dados

| Campo           | Tipo      | Descrição                |
| --------------- | --------- | ------------------------ |
| `id`            | INTEGER   | Identificador único (PK) |
| `name`          | VARCHAR   | Nome do usuário          |
| `email`         | VARCHAR   | Email único              |
| `password_hash` | VARCHAR   | Senha criptografada      |
| `created_at`    | TIMESTAMP | Data de criação          |

> A senha nunca é retornada nas respostas da API.

---

## Endpoints

### `POST /users` — Criar usuário

**Body:**
```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "minimo8chars"
}
```

**Resposta `201`:**
```json
{
  "id": 1,
  "name": "Alice",
  "email": "alice@example.com",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

---

### `GET /users` — Listar usuários

**Resposta `200`:** array de usuários (sem `password_hash`)

---

### `GET /users/:id` — Buscar usuário por ID

**Resposta `200`:** objeto do usuário  
**Resposta `404`:** usuário não encontrado

---

### `PUT /users/:id` — Atualizar usuário

**Body** (todos os campos são opcionais):
```json
{
  "name": "Alice Updated",
  "email": "new@example.com",
  "password": "novasenha123"
}
```

**Resposta `200`:** `{ "message": "User updated successfully" }`

---

### `DELETE /users/:id` — Remover usuário

**Resposta `200`:** `{ "message": "User deleted successfully" }`  
**Resposta `404`:** usuário não encontrado

---

## Regras de Negócio

- `name`, `email` e `password` são obrigatórios na criação
- Email deve ter formato válido (RFC 5322)
- Email deve ser único no sistema
- Senha deve ter no mínimo 8 caracteres
- Senhas são armazenadas com hash bcrypt (10 salt rounds)
- A senha nunca é exposta em nenhuma resposta

---

## Erros

| Tipo              | HTTP | Quando ocorre                |
| ----------------- | ---- | ---------------------------- |
| `ValidationError` | 400  | Campos inválidos ou ausentes |
| `NotFoundError`   | 404  | Usuário não encontrado       |
| `ConflictError`   | 409  | Email já cadastrado          |

---

## Como Executar

```bash
# Instalar dependências
npm install

# Desenvolvimento
npm run dev

# Build
npm run build

# Produção
npm start
```

---

## Testes

```bash
# Executar todos os testes
npm test
```

O projeto utiliza **property-based testing** com `fast-check` para validar propriedades de corretude do sistema:

| Propriedade | Descrição                                                            |
| ----------- | -------------------------------------------------------------------- |
| 1           | Criação com dados válidos sempre retorna usuário sem `password_hash` |
| 2           | Email duplicado sempre lança `ConflictError` na criação              |
| 3           | Senha com menos de 8 caracteres sempre lança `ValidationError`       |
| 4           | Senha nunca é armazenada em texto puro                               |
| 5           | Campos obrigatórios vazios sempre lançam `ValidationError`           |
| 6           | Listagem nunca expõe `password_hash`                                 |
| 7           | Busca por ID nunca expõe `password_hash`                             |
| 9           | Atualização de usuário inexistente lança `NotFoundError`             |
| 11          | Email duplicado na atualização lança `ConflictError`                 |
| 12          | Nova senha nunca é armazenada em texto puro                          |
