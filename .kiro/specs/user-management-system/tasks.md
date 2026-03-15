# Implementation Plan: User Management System

## Overview

Implementação incremental de uma API REST para gerenciamento de usuários com arquitetura em camadas (API → Service → Repository), validação robusta, hashing de senhas e testes baseados em propriedades.

## Tasks

- [x] 1. Configurar estrutura do projeto e interfaces core
  - Criar estrutura de diretórios: `src/types`, `src/repositories`, `src/services`, `src/routes`, `src/middleware`
  - Definir interfaces TypeScript: `User`, `UserEntity`, `CreateUserDTO`, `UpdateUserDTO`
  - Definir interfaces de contrato: `UserRepository`, `UserService`, `PasswordHasher`, `EmailValidator`
  - Configurar framework (Express), dependências (bcrypt, validação) e banco de dados (PostgreSQL/MySQL)
  - Criar script de migração SQL para tabela `users` com constraints e índice em `email`
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 2. Implementar PasswordHasher e EmailValidator
  - [x] 2.1 Implementar `PasswordHasher` com bcrypt (salt rounds >= 10)
    - Métodos `hash(plainPassword)` e `verify(plainPassword, hashedPassword)`
    - _Requirements: 1.6, 1.7, 4.7_

  - [ ]* 2.2 Escrever property test para PasswordHasher
    - **Property 4: Password Hashing**
    - **Validates: Requirements 1.6, 1.7, 4.7**

  - [x] 2.3 Implementar `EmailValidator` com validação de formato (regex/biblioteca)
    - Método `isValidFormat(email)` e `isUnique(email, excludeUserId?)`
    - _Requirements: 1.2, 4.3_

  - [ ]* 2.4 Escrever unit tests para EmailValidator
    - Testar formatos válidos e inválidos
    - Testar unicidade com e sem exclusão de ID
    - _Requirements: 1.2, 1.3, 4.3, 4.4_

- [x] 3. Implementar Repository Layer
  - [x] 3.1 Implementar `UserRepository` com operações CRUD
    - Métodos: `create`, `findAll`, `findById`, `findByEmail`, `update`, `delete`, `exists`
    - Garantir que `password_hash` nunca seja exposto fora do repositório
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 3.2 Escrever unit tests para UserRepository
    - Testar cada operação CRUD
    - Testar constraint de unicidade de email no banco
    - Testar retorno `null` para registros inexistentes
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 4. Implementar Service Layer
  - [x] 4.1 Implementar `createUser` no UserService
    - Validar campos obrigatórios (name, email, password)
    - Validar formato de email e unicidade
    - Validar tamanho mínimo de senha (>= 8 caracteres)
    - Fazer hash da senha e persistir via repositório
    - Retornar User sem password_hash
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_

  - [ ]* 4.2 Escrever property test para createUser
    - **Property 1: User Creation with Valid Data**
    - **Validates: Requirements 1.1, 1.8**

  - [ ]* 4.3 Escrever property test para unicidade de email na criação
    - **Property 2: Email Uniqueness on Creation**
    - **Validates: Requirements 1.2, 1.3**

  - [ ]* 4.4 Escrever property test para validação de tamanho de senha
    - **Property 3: Password Length Validation**
    - **Validates: Requirements 1.4, 1.5, 4.6**

  - [ ]* 4.5 Escrever property test para campos obrigatórios
    - **Property 5: Required Fields Validation**
    - **Validates: Requirements 1.9**

  - [x] 4.6 Implementar `listUsers` no UserService
    - Retornar todos os usuários sem password_hash
    - Retornar lista vazia quando não há usuários
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ]* 4.7 Escrever property test para listagem de usuários
    - **Property 6: List All Users**
    - **Validates: Requirements 2.1**

  - [ ]* 4.8 Escrever property test para formato de resposta de usuário
    - **Property 7: User Response Format**
    - **Validates: Requirements 2.2, 2.3, 3.2, 3.3**

  - [x] 4.9 Implementar `getUserById` no UserService
    - Retornar usuário pelo ID sem password_hash
    - Lançar erro "user not found" se ID não existir
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 4.10 Escrever property test para busca por ID
    - **Property 8: Get User by ID**
    - **Validates: Requirements 3.1**

  - [ ]* 4.11 Escrever property test para operações em usuários inexistentes
    - **Property 9: Operations on Non-Existent Users Fail**
    - **Validates: Requirements 3.4, 4.5, 5.2**

  - [x] 4.12 Implementar `updateUser` no UserService
    - Validar existência do usuário
    - Validar unicidade do novo email (excluindo o próprio usuário)
    - Validar tamanho de senha se fornecida
    - Fazer hash da nova senha se fornecida
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9_

  - [ ]* 4.13 Escrever property test para persistência de atualização
    - **Property 10: User Update Persistence**
    - **Validates: Requirements 4.1, 4.2**

  - [ ]* 4.14 Escrever property test para unicidade de email na atualização
    - **Property 11: Email Uniqueness on Update**
    - **Validates: Requirements 4.3, 4.4**

  - [ ]* 4.15 Escrever property test para atualização de hash de senha
    - **Property 12: Password Hash Update**
    - **Validates: Requirements 4.7**

  - [x] 4.16 Implementar `deleteUser` no UserService
    - Validar existência do usuário
    - Remover registro via repositório
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 4.17 Escrever property test para deleção de usuário
    - **Property 13: User Deletion Completeness**
    - **Validates: Requirements 5.1, 5.4**

- [x] 5. Checkpoint - Verificar cobertura da Service Layer
  - Garantir que todos os testes passam, tirar dúvidas com o usuário se necessário.

- [x] 6. Implementar API Layer (Routes e Middleware)
  - [x] 6.1 Criar middleware de tratamento de erros centralizado
    - Mapear exceções customizadas para status HTTP (400, 404, 409, 500)
    - Formatar respostas de erro conforme especificado no design
    - _Requirements: 6.6, 6.7_

  - [x] 6.2 Implementar rota `POST /users`
    - Receber e validar body da requisição
    - Chamar `userService.createUser` e retornar 201 com dados do usuário
    - _Requirements: 6.1, 6.6, 6.7_

  - [x] 6.3 Implementar rota `GET /users`
    - Chamar `userService.listUsers` e retornar 200 com lista de usuários
    - _Requirements: 6.2, 6.6_

  - [x] 6.4 Implementar rota `GET /users/:id`
    - Chamar `userService.getUserById` e retornar 200 com dados do usuário
    - _Requirements: 6.3, 6.6, 6.7_

  - [x] 6.5 Implementar rota `PUT /users/:id`
    - Receber e validar body da requisição
    - Chamar `userService.updateUser` e retornar 200 com mensagem de confirmação
    - _Requirements: 6.4, 6.6, 6.7_

  - [x] 6.6 Implementar rota `DELETE /users/:id`
    - Chamar `userService.deleteUser` e retornar 200 com mensagem de confirmação
    - _Requirements: 6.5, 6.6, 6.7_

  - [ ]* 6.7 Escrever property test para status HTTP de sucesso
    - **Property 14: HTTP Success Status Codes**
    - **Validates: Requirements 6.6**

  - [ ]* 6.8 Escrever property test para status HTTP de erro
    - **Property 15: HTTP Error Status Codes**
    - **Validates: Requirements 6.7**

- [x] 7. Integração e wiring final
  - [x] 7.1 Conectar todas as camadas no entry point da aplicação
    - Instanciar dependências (DB connection, PasswordHasher, EmailValidator)
    - Injetar dependências no Repository, Service e Routes
    - Registrar middleware de erro e rotas no Express app
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 7.2 Escrever testes de integração end-to-end
    - Testar fluxo completo de criação, listagem, busca, atualização e deleção
    - Usar banco de dados de teste isolado
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

- [x] 8. Checkpoint final - Garantir que todos os testes passam
  - Garantir que todos os testes passam, tirar dúvidas com o usuário se necessário.

## Notes

- Tasks marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada task referencia requisitos específicos para rastreabilidade
- Property tests usam `fast-check` com mínimo de 100 iterações por teste
- Cada property test deve incluir a tag: **Feature: user-management-system, Property {N}: {texto}**
- Checkpoints garantem validação incremental antes de avançar para a próxima fase
