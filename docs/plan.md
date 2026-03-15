1. Visão Geral do Sistema
Nome do sistema

Sistema de Gerenciamento de Usuários

Descrição

O sistema deve permitir o cadastro e gerenciamento de usuários por meio de uma API ou aplicação backend. O sistema deve fornecer operações de criação, consulta, atualização e remoção de usuários, garantindo integridade dos dados e validação das informações fornecidas.

Objetivo

Permitir o gerenciamento simples e seguro de registros de usuários em um sistema de informação.

2. Atores

Administrador do sistema

Responsável por:

cadastrar usuários

atualizar dados de usuários

remover usuários

consultar registros

3. Requisitos Funcionais
RF01 — Cadastro de Usuário

O sistema deve permitir o cadastro de novos usuários contendo os seguintes campos:

nome

email

senha

Condições:

email deve ser único no sistema

senha deve possuir no mínimo 8 caracteres

RF02 — Listagem de Usuários

O sistema deve permitir a listagem de todos os usuários cadastrados.

A listagem deve retornar:

id

nome

email

data de criação

A senha não deve ser retornada.

RF03 — Consulta de Usuário

O sistema deve permitir consultar um usuário específico pelo seu ID.

Caso o usuário não exista, o sistema deve retornar erro informando que o registro não foi encontrado.

RF04 — Atualização de Usuário

O sistema deve permitir atualizar os dados de um usuário existente.

Campos atualizáveis:

nome

email

senha

Validações:

o email atualizado não pode já existir para outro usuário.

RF05 — Remoção de Usuário

O sistema deve permitir remover um usuário existente a partir do seu ID.

Após a remoção, o usuário não deve mais aparecer nas consultas ou listagens.

4. Requisitos Não Funcionais
RNF01 — API REST

O sistema deve expor suas funcionalidades através de uma API seguindo princípios REST.

Endpoints esperados:

POST /users

GET /users

GET /users/{id}

PUT /users/{id}

DELETE /users/{id}

RNF02 — Persistência de Dados

Os dados dos usuários devem ser armazenados em um banco de dados relacional.

RNF03 — Segurança de Senhas

As senhas devem ser armazenadas utilizando hash criptográfico e nunca em texto puro.

RNF04 — Validação de Dados

O sistema deve validar todos os dados recebidos antes de persistir no banco de dados.

5. Modelo de Dados

Entidade: User

Campos:

Campo	Tipo	Descrição
id	inteiro	identificador único
name	string	nome do usuário
email	string	email único
password	string	senha criptografada
created_at	datetime	data de criação
6. Casos de Borda (Edge Cases)

O sistema deve tratar os seguintes cenários:

tentativa de cadastro com email já existente

tentativa de atualização para email já utilizado

consulta de usuário inexistente

remoção de usuário inexistente

envio de dados obrigatórios vazios

7. Critérios de Aceitação

O sistema será considerado correto quando:

todos os endpoints funcionarem conforme especificado

dados forem persistidos corretamente

validações forem aplicadas

senhas forem armazenadas com hash

erros forem retornados quando operações inválidas forem executadas

flowchart TD

A[Início] --> B[Receber requisição HTTP]

B --> C{Tipo de operação}

%% CREATE
C -->|POST /users| D[Receber dados do usuário]

D --> E[Validar campos obrigatórios]

E --> F{Campos válidos?}

F -->|Não| G[Retornar erro de validação]
G --> Z[Fim]

F -->|Sim| H[Verificar se email já existe]

H --> I{Email já cadastrado?}

I -->|Sim| J[Retornar erro email duplicado]
J --> Z

I -->|Não| K[Gerar hash da senha]

K --> L[Persistir usuário no banco]

L --> M[Retornar sucesso com ID do usuário]

M --> Z

%% READ ALL
C -->|GET /users| N[Consultar usuários no banco]

N --> O{Existem usuários?}

O -->|Não| P[Retornar lista vazia]
P --> Z

O -->|Sim| Q[Formatar resposta sem senha]

Q --> R[Retornar lista de usuários]

R --> Z

%% READ BY ID
C -->|GET /users/id| S[Receber ID do usuário]

S --> T[Consultar usuário no banco]

T --> U{Usuário encontrado?}

U -->|Não| V[Retornar erro usuário não encontrado]
V --> Z

U -->|Sim| W[Remover campo senha da resposta]

W --> X[Retornar dados do usuário]

X --> Z

%% UPDATE
C -->|PUT /users/id| AA[Receber ID e novos dados]

AA --> AB[Validar dados enviados]

AB --> AC{Dados válidos?}

AC -->|Não| AD[Retornar erro de validação]
AD --> Z

AC -->|Sim| AE[Verificar se usuário existe]

AE --> AF{Usuário encontrado?}

AF -->|Não| AG[Retornar erro usuário inexistente]
AG --> Z

AF -->|Sim| AH[Verificar conflito de email]

AH --> AI{Email já usado por outro usuário?}

AI -->|Sim| AJ[Retornar erro email duplicado]
AJ --> Z

AI -->|Não| AK{Senha foi alterada?}

AK -->|Sim| AL[Gerar novo hash da senha]

AK -->|Não| AM[Manter hash atual]

AL --> AN[Atualizar dados no banco]
AM --> AN

AN --> AO[Retornar confirmação de atualização]

AO --> Z

%% DELETE
C -->|DELETE /users/id| AP[Receber ID do usuário]

AP --> AQ[Verificar existência no banco]

AQ --> AR{Usuário encontrado?}

AR -->|Não| AS[Retornar erro usuário inexistente]
AS --> Z

AR -->|Sim| AT[Remover usuário do banco]

AT --> AU[Confirmar remoção]

AU --> Z

Z[Fim]


