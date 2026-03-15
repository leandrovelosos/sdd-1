# Design Document: User Management System

## Overview

O User Management System é uma API REST backend desenvolvida para fornecer operações completas de gerenciamento de usuários (CRUD). O sistema prioriza segurança, integridade de dados e validação robusta.

### Principais Características

- API REST com endpoints padronizados
- Validação de dados em múltiplas camadas
- Armazenamento seguro de credenciais com hashing criptográfico
- Garantia de unicidade de email
- Persistência em banco de dados relacional
- Tratamento de erros consistente

### Tecnologias Sugeridas

- **Backend Framework**: Node.js com Express, Python com FastAPI, ou Java com Spring Boot
- **Banco de Dados**: PostgreSQL ou MySQL
- **Hashing**: bcrypt ou argon2
- **Validação**: biblioteca de validação nativa do framework escolhido

## Architecture

O sistema segue uma arquitetura em camadas (layered architecture) para separar responsabilidades:

```
┌─────────────────────────────────────┐
│         API Layer (REST)            │
│  - Routing                          │
│  - Request/Response handling        │
│  - HTTP status codes                │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│       Service Layer                 │
│  - Business logic                   │
│  - Validation orchestration         │
│  - Error handling                   │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│      Repository Layer               │
│  - Data persistence                 │
│  - Database queries                 │
│  - Transaction management           │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│         Database                    │
│  - User records storage             │
│  - Constraints enforcement          │
└─────────────────────────────────────┘
```

### Componentes Auxiliares

```
┌─────────────────────┐    ┌─────────────────────┐
│  Password Hasher    │    │  Email Validator    │
│  - hash()           │    │  - isUnique()       │
│  - verify()         │    │  - isValid()        │
└─────────────────────┘    └─────────────────────┘
```

## Components and Interfaces

### 1. API Layer

**Responsabilidade**: Expor endpoints REST e gerenciar requisições HTTP.

**Endpoints**:

```typescript
POST   /users          // Criar usuário
GET    /users          // Listar todos os usuários
GET    /users/:id      // Obter usuário por ID
PUT    /users/:id      // Atualizar usuário
DELETE /users/:id      // Remover usuário
```

**Interface de Request/Response**:

```typescript
// POST /users - Request
{
  name: string,
  email: string,
  password: string
}

// POST /users - Response (201 Created)
{
  id: number,
  name: string,
  email: string,
  created_at: string
}

// GET /users - Response (200 OK)
[
  {
    id: number,
    name: string,
    email: string,
    created_at: string
  }
]

// GET /users/:id - Response (200 OK)
{
  id: number,
  name: string,
  email: string,
  created_at: string
}

// PUT /users/:id - Request
{
  name?: string,
  email?: string,
  password?: string
}

// PUT /users/:id - Response (200 OK)
{
  message: "User updated successfully"
}

// DELETE /users/:id - Response (200 OK)
{
  message: "User deleted successfully"
}
```

### 2. Service Layer

**Responsabilidade**: Implementar lógica de negócio e orquestrar validações.

**Interface**:

```typescript
interface UserService {
  createUser(data: CreateUserDTO): Promise<User>
  listUsers(): Promise<User[]>
  getUserById(id: number): Promise<User>
  updateUser(id: number, data: UpdateUserDTO): Promise<void>
  deleteUser(id: number): Promise<void>
}
```

**Validações Implementadas**:
- Campos obrigatórios não vazios
- Formato de email válido
- Senha com mínimo 8 caracteres
- Unicidade de email no sistema

### 3. Repository Layer

**Responsabilidade**: Gerenciar persistência de dados e queries ao banco.

**Interface**:

```typescript
interface UserRepository {
  create(user: UserEntity): Promise<UserEntity>
  findAll(): Promise<UserEntity[]>
  findById(id: number): Promise<UserEntity | null>
  findByEmail(email: string): Promise<UserEntity | null>
  update(id: number, data: Partial<UserEntity>): Promise<void>
  delete(id: number): Promise<boolean>
  exists(id: number): Promise<boolean>
}
```

### 4. Password Hasher

**Responsabilidade**: Gerar e verificar hashes criptográficos de senhas.

**Interface**:

```typescript
interface PasswordHasher {
  hash(plainPassword: string): Promise<string>
  verify(plainPassword: string, hashedPassword: string): Promise<boolean>
}
```

**Implementação**: Utilizar bcrypt com salt rounds >= 10 ou argon2.

### 5. Email Validator

**Responsabilidade**: Validar formato e unicidade de emails.

**Interface**:

```typescript
interface EmailValidator {
  isValidFormat(email: string): boolean
  isUnique(email: string, excludeUserId?: number): Promise<boolean>
}
```

## Data Models

### User Entity

**Tabela**: `users`

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

**Modelo de Domínio**:

```typescript
interface User {
  id: number
  name: string
  email: string
  created_at: Date
}

interface UserEntity extends User {
  password_hash: string
}
```

**DTOs**:

```typescript
interface CreateUserDTO {
  name: string
  email: string
  password: string
}

interface UpdateUserDTO {
  name?: string
  email?: string
  password?: string
}
```

**Regras de Validação**:
- `name`: não vazio, string
- `email`: formato válido, único no sistema
- `password`: mínimo 8 caracteres
- `password_hash`: gerado automaticamente, nunca exposto


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

Após análise dos critérios de aceitação, identifiquei as seguintes redundâncias que foram consolidadas:

- **Propriedades 1.2 e 1.3**: Ambas tratam de unicidade de email na criação. Consolidadas em uma única propriedade.
- **Propriedades 1.4 e 1.5**: Ambas tratam de validação de tamanho de senha. Consolidadas em uma única propriedade.
- **Propriedades 1.6 e 1.7**: Ambas tratam de hashing de senha. Consolidadas em uma única propriedade.
- **Propriedades 2.2 e 3.2**: Ambas verificam campos retornados. Consolidadas em uma propriedade geral sobre formato de resposta.
- **Propriedades 2.3 e 3.3**: Ambas verificam exclusão de password_hash. Consolidadas em uma propriedade geral.
- **Propriedades 3.4, 4.5 e 5.2**: Todas tratam de operações em usuários inexistentes. Consolidadas em uma única propriedade.
- **Propriedades 4.3 e 4.4**: Ambas tratam de unicidade de email na atualização. Consolidadas em uma única propriedade.
- **Propriedade 4.6**: Redundante com 1.4 (validação de senha). Já coberta pela propriedade de validação de senha.

### Property 1: User Creation with Valid Data

*For any* valid user data (non-empty name, unique email, password with at least 8 characters), creating a user should result in a new user record with a unique ID and creation timestamp.

**Validates: Requirements 1.1, 1.8**

### Property 2: Email Uniqueness on Creation

*For any* email that already exists in the system, attempting to create a new user with that email should fail with an email duplication error.

**Validates: Requirements 1.2, 1.3**

### Property 3: Password Length Validation

*For any* password with fewer than 8 characters, attempting to create or update a user with that password should fail with a validation error.

**Validates: Requirements 1.4, 1.5, 4.6**

### Property 4: Password Hashing

*For any* user created or updated with a password, the stored password_hash should be different from the plain text password and should be verifiable using the password hasher.

**Validates: Requirements 1.6, 1.7**

### Property 5: Required Fields Validation

*For any* user creation request where name, email, or password is empty or missing, the system should reject the request with a validation error.

**Validates: Requirements 1.9**

### Property 6: List All Users

*For any* set of users in the system, listing users should return all user records with their complete data.

**Validates: Requirements 2.1**

### Property 7: User Response Format

*For any* user returned by the system (via list, get, or create operations), the response should include id, name, email, and created_at fields, and should exclude the password_hash field.

**Validates: Requirements 2.2, 2.3, 3.2, 3.3**

### Property 8: Get User by ID

*For any* user that exists in the system, retrieving that user by its ID should return the correct user record.

**Validates: Requirements 3.1**

### Property 9: Operations on Non-Existent Users Fail

*For any* user ID that does not exist in the system, attempting to get, update, or delete that user should fail with a "user not found" error.

**Validates: Requirements 3.4, 4.5, 5.2**

### Property 10: User Update Persistence

*For any* existing user and valid update data (name, email, or password), updating the user should persist the changes such that subsequent retrieval returns the updated values.

**Validates: Requirements 4.1, 4.2**

### Property 11: Email Uniqueness on Update

*For any* two users in the system, attempting to update one user's email to match the other user's email should fail with an email duplication error.

**Validates: Requirements 4.3, 4.4**

### Property 12: Password Hash Update

*For any* existing user, when the password is updated, the password_hash should change to a new value that is verifiable with the new password.

**Validates: Requirements 4.7**

### Property 13: User Deletion Completeness

*For any* user in the system, after deleting that user, the user should not appear in list operations and get operations should return "user not found".

**Validates: Requirements 5.1, 5.4**

### Property 14: HTTP Success Status Codes

*For any* successful operation (create, list, get, update, delete), the API should return an appropriate HTTP 2xx status code.

**Validates: Requirements 6.6**

### Property 15: HTTP Error Status Codes

*For any* failed operation (validation error, not found, duplicate email), the API should return an appropriate HTTP 4xx status code with a descriptive error message.

**Validates: Requirements 6.7**

## Error Handling

O sistema deve implementar tratamento de erros consistente e informativo em todas as camadas.

### Categorias de Erros

**1. Validation Errors (400 Bad Request)**
- Campos obrigatórios vazios
- Senha com menos de 8 caracteres
- Formato de email inválido
- Dados de entrada malformados

Formato de resposta:
```json
{
  "error": "Validation error",
  "details": [
    {
      "field": "password",
      "message": "Password must be at least 8 characters long"
    }
  ]
}
```

**2. Not Found Errors (404 Not Found)**
- Usuário não encontrado por ID

Formato de resposta:
```json
{
  "error": "User not found",
  "message": "User with ID 123 does not exist"
}
```

**3. Conflict Errors (409 Conflict)**
- Email já cadastrado no sistema

Formato de resposta:
```json
{
  "error": "Email already exists",
  "message": "A user with email 'user@example.com' already exists"
}
```

**4. Server Errors (500 Internal Server Error)**
- Falhas de conexão com banco de dados
- Erros inesperados no sistema

Formato de resposta:
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

### Estratégia de Tratamento

1. **Validação em Camadas**: Validar dados na API layer e novamente na Service layer
2. **Exceções Tipadas**: Usar exceções customizadas para cada tipo de erro
3. **Logging**: Registrar todos os erros com contexto suficiente para debugging
4. **Mensagens Claras**: Retornar mensagens de erro descritivas para o cliente
5. **Segurança**: Não expor detalhes internos do sistema em mensagens de erro

### Fluxo de Tratamento de Erros

```
Request → API Layer → Service Layer → Repository Layer
                ↓           ↓              ↓
            Validation  Business      Database
             Errors      Errors        Errors
                ↓           ↓              ↓
            Error Handler (Middleware)
                        ↓
            Formatted Error Response
```

## Testing Strategy

O sistema será testado usando uma abordagem dual que combina testes unitários e testes baseados em propriedades (property-based testing).

### Abordagem de Testes

**Unit Tests**: Focados em casos específicos, edge cases e condições de erro
- Exemplos concretos de operações bem-sucedidas
- Casos de borda (lista vazia, usuário inexistente)
- Integração entre componentes
- Validação de formatos de resposta

**Property-Based Tests**: Verificam propriedades universais através de múltiplas entradas geradas
- Validações que devem funcionar para qualquer entrada válida
- Comportamentos que devem ser consistentes independente dos dados
- Cobertura ampla de cenários através de randomização

### Biblioteca de Property-Based Testing

Para implementação dos testes de propriedades, recomenda-se:
- **JavaScript/TypeScript**: fast-check
- **Python**: Hypothesis
- **Java**: jqwik ou QuickCheck

### Configuração de Property Tests

- **Mínimo de 100 iterações** por teste de propriedade (devido à randomização)
- Cada teste deve referenciar a propriedade do documento de design
- Formato de tag: **Feature: user-management-system, Property {número}: {texto da propriedade}**

### Cobertura de Testes

**Service Layer** (prioridade alta):
- Todas as 15 propriedades de corretude
- Validações de entrada
- Lógica de negócio
- Tratamento de erros

**Repository Layer** (prioridade média):
- Operações CRUD básicas
- Queries específicas (findByEmail)
- Tratamento de constraints do banco

**API Layer** (prioridade média):
- Códigos de status HTTP corretos
- Formato de requisições e respostas
- Tratamento de erros na camada HTTP

**Password Hasher** (prioridade alta):
- Geração de hashes
- Verificação de senhas
- Segurança (hashes diferentes para mesma senha)

**Email Validator** (prioridade média):
- Validação de formato
- Verificação de unicidade

### Exemplos de Testes

**Unit Test Example**:
```typescript
test('should return empty list when no users exist', async () => {
  const users = await userService.listUsers();
  expect(users).toEqual([]);
});
```

**Property Test Example**:
```typescript
// Feature: user-management-system, Property 1: User Creation with Valid Data
test('creating user with valid data should succeed', async () => {
  await fc.assert(
    fc.asyncProperty(
      validUserDataGenerator(),
      async (userData) => {
        const user = await userService.createUser(userData);
        expect(user.id).toBeDefined();
        expect(user.name).toBe(userData.name);
        expect(user.email).toBe(userData.email);
        expect(user.created_at).toBeDefined();
      }
    ),
    { numRuns: 100 }
  );
});
```

### Generators para Property Tests

Os testes baseados em propriedades requerem geradores de dados:

```typescript
// Gerador de dados válidos de usuário
const validUserDataGenerator = () => fc.record({
  name: fc.string({ minLength: 1, maxLength: 255 }),
  email: fc.emailAddress(),
  password: fc.string({ minLength: 8, maxLength: 100 })
});

// Gerador de senhas inválidas (< 8 caracteres)
const invalidPasswordGenerator = () => 
  fc.string({ maxLength: 7 });

// Gerador de IDs de usuários
const userIdGenerator = () => 
  fc.integer({ min: 1, max: 1000000 });
```

### Estratégia de Integração

1. **Testes Unitários**: Executar em cada commit
2. **Property Tests**: Executar em cada commit (com 100 iterações)
3. **Testes de Integração**: Executar antes de merge para branch principal
4. **Testes E2E**: Executar em pipeline de CI/CD antes de deploy

### Métricas de Qualidade

- **Cobertura de código**: Mínimo 80% para Service e Repository layers
- **Cobertura de propriedades**: 100% das 15 propriedades implementadas
- **Tempo de execução**: Testes unitários < 5s, Property tests < 30s
