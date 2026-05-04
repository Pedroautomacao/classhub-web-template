# ClassHub Web

Frontend do sistema de gestão **ClassHub** para escolas de idiomas. Interface administrativa completa e páginas públicas para candidatos e alunos.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | React 19 + TypeScript 5.9 |
| Build | Vite 8 |
| UI | Material UI (MUI) v7 + Emotion |
| Formulários | React Hook Form + Zod |
| Data fetching | TanStack React Query v5 |
| HTTP Client | Axios |
| Estado global | Zustand |
| Roteamento | React Router v7 |
| Datas | Day.js |

## Estrutura do Projeto

```
src/
├── api/                        # Camada de chamadas HTTP
│   ├── axios.ts                # Instância Axios (interceptors JWT)
│   ├── auth.api.ts
│   ├── classes.api.ts
│   ├── contracts.api.ts
│   ├── dashboard.api.ts
│   ├── enrollment.api.ts
│   ├── files.api.ts
│   ├── hour-closings.api.ts
│   ├── leveling.api.ts
│   ├── plans.api.ts
│   ├── settings.api.ts
│   ├── students.api.ts
│   └── teachers.api.ts
├── components/
│   ├── common/
│   │   ├── AvailabilityEditor.tsx   # Editor de disponibilidade (dias + slots)
│   │   ├── ConfirmDialog.tsx        # Modal de confirmação genérico
│   │   ├── DataTable.tsx            # Tabela com colunas e linhas genéricas
│   │   ├── LoginModal.tsx
│   │   └── PageHeader.tsx
│   └── layout/
│       ├── AdminBreadcrumbs.tsx
│       ├── Sidebar.tsx              # Navegação lateral admin
│       └── Topbar.tsx               # Cabeçalho com usuário + tema
├── hooks/
│   ├── useAuth.ts                   # Contexto de autenticação
│   └── usePermission.ts             # Verificação de permissões por módulo
├── layouts/
│   ├── AdminLayout.tsx              # Layout sidebar + conteúdo (/admin/*)
│   └── PublicLayout.tsx             # Layout para páginas públicas
├── pages/
│   ├── landing/
│   │   ├── LandingPage.tsx
│   │   ├── EnrollmentFormPage.tsx   # Formulário público de matrícula
│   │   ├── LevelingFormPage.tsx     # Formulário público de nivelamento
│   │   └── ReEnrollmentFormPage.tsx
│   └── admin/
│       ├── dashboard/
│       │   └── DashboardPage.tsx
│       ├── students/
│       │   ├── StudentsListPage.tsx
│       │   └── components/
│       │       ├── StudentFormModal.tsx    # Edição com AvailabilityEditor
│       │       └── StudentStatusChip.tsx
│       ├── teachers/
│       │   ├── TeachersListPage.tsx        # Abas: Professores | Fechamentos
│       │   └── components/
│       │       ├── TeacherFormModal.tsx    # hourly_rate + disponibilidade
│       │       └── HourClosingsAdminTab.tsx
│       ├── teacher-portal/
│       │   ├── TeacherPortalPage.tsx       # Portal do professor
│       │   └── components/
│       │       ├── TeacherClassesTab.tsx   # Turmas + edição de link
│       │       └── HourClosingsTab.tsx     # Submissão e histórico
│       ├── classes/
│       │   ├── ClassesListPage.tsx         # Lista com filtros
│       │   └── components/
│       │       ├── ClassFormModal.tsx      # Alertas de disponibilidade
│       │       └── LiveClassesTab.tsx
│       ├── plans/
│       │   ├── PlansListPage.tsx
│       │   └── components/PlanFormModal.tsx
│       ├── contracts/
│       │   └── ContractsListPage.tsx
│       ├── enrollment/
│       │   ├── EnrollmentPage.tsx          # Nova matrícula interna
│       │   └── ReEnrollmentPage.tsx
│       ├── leveling/
│       │   └── LevelingListPage.tsx        # Filtros: status + nome + telefone
│       ├── links/
│       │   └── ShareableLinksPage.tsx
│       ├── settings/
│       │   └── SettingsPage.tsx
│       └── users/
│           ├── UsersListPage.tsx
│           └── components/UserFormModal.tsx
├── router/
│   ├── index.tsx                    # Definição de rotas
│   └── PrivateRoute.tsx             # Guarda de autenticação
├── store/
│   ├── auth.store.ts                # Estado de login + permissões
│   ├── snackbar.store.ts            # Notificações toast
│   └── theme.store.ts               # Modo claro/escuro (persistido)
├── theme/
│   └── index.ts                     # Tema MUI (cores, AppBar, dark mode)
├── types/                           # Interfaces TypeScript (espelham backend)
│   ├── auth.types.ts
│   ├── classes.types.ts
│   ├── contracts.types.ts
│   ├── dashboard.types.ts
│   ├── enrollment.types.ts
│   ├── files.types.ts
│   ├── hour-closing.types.ts
│   ├── leveling.types.ts
│   ├── plans.types.ts
│   ├── settings.types.ts
│   ├── students.types.ts
│   ├── teachers.types.ts
│   └── index.ts
└── utils/
    ├── availability.ts              # studentMatchesClass / teacherMatchesClass
    ├── errors.ts                    # Extração de mensagens de erro da API
    └── permissions.ts              # Constantes de permissão
```

## Funcionalidades

### Área Pública
- **Formulário de Nivelamento** — candidatos preenchem dados e respondem perguntas de nivelamento
- **Formulário de Matrícula** — solicitação de matrícula sem login
- **Formulário de Rematrícula** — rematrícula pública via CPF ou e-mail

### Área Administrativa (`/admin/*`)

#### Dashboard
- Resumo: alunos ativos, professores, contratos ativos, formulários pendentes

#### Alunos
- Listagem, cadastro, edição e ativação/desativação
- Disponibilidade de horários com editor de dia + slots (JSONB)
- Download do contrato ativo

#### Professores
- Listagem com `hourly_rate` por aula
- Editor de disponibilidade semanal (múltiplos slots por dia)
- Aba de **Fechamentos de Horas** (aprovação/rejeição com valor final editável)
- Alerta no formulário de turma quando professor não tem disponibilidade compatível

#### Portal do Professor (`/admin/teacher-portal`)
- Aba **Minhas Turmas**: visualização das turmas com edição do link de reunião
- Aba **Fechamento de Horas**: submissão de novo fechamento, histórico com filtros, edição e cancelamento

#### Turmas
- Criação e edição com tipo (`Gramática`, `Conversação`, `Aula particular`) e frequência
- Vinculação de professor e alunos com alertas de disponibilidade
- Filtros: professor, nome, dia da semana, horário de início, tipo
- Aba **Ao Vivo Agora** para turmas em andamento no momento

#### Planos e Contratos
- CRUD de planos com duração em meses
- Listagem de contratos por status

#### Matrícula
- Fluxo de nova matrícula com upload de contrato PDF (base64)
- Rematrícula com seleção de aluno existente e pré-carregamento de disponibilidade

#### Nivelamento
- Listagem de formulários com filtros: status de contato, nome, telefone
- Atualização de status, resultado e recomendação
- Visualização detalhada das respostas

#### Configurações
- Nome da escola, textos de boas-vindas, imagem, links de WhatsApp/Instagram, datas do semestre

#### Usuários
- Criação e edição de usuários admin com permissões granulares por módulo

### Controle de Acesso
- Autenticação JWT armazenada em memória (Zustand)
- `usePermission()` para exibição condicional de botões e abas
- `PrivateRoute` protege todas as rotas `/admin/*`
- Sidebar filtra itens de menu conforme permissões do usuário

### Tema
- Modo claro e escuro alternável (persistido via Zustand)
- AppBar com gradiente teal via `backgroundImage` (compatível com dark mode do MUI)
- Tema personalizado no `theme/index.ts`

## Componentes Reutilizáveis

### `AvailabilityEditor`
Editor de disponibilidade semanal compartilhado entre formulários de professor, aluno, matrícula e rematrícula. Utiliza `useFieldArray` para gerenciar dias e slots de horário dinamicamente.

```tsx
<AvailabilityEditor control={control} register={register} watch={watch} errors={errors} />
```

### `DataTable<T>`
Tabela genérica com tipagem, colunas configuráveis e estado de carregamento.

### `ConfirmDialog`
Modal de confirmação padronizado para operações destrutivas.

### `PageHeader`
Cabeçalho de página com título, subtítulo e botão de ação opcional.

## Lógica de Disponibilidade

```typescript
// Verifica se o professor cobre o dia/horário de uma turma
teacherMatchesClass(availability: AvailabilityDay[], daysOfWeek: string[], startTime: string): boolean

// Verifica se o aluno tem disponibilidade compatível com a turma
studentMatchesClass(availability: AvailabilityDay[], daysOfWeek: string[], startTime: string): boolean
```

Ambas as funções verificam se `startTime` está dentro de algum slot cadastrado para algum dos dias da turma. Alertas aparecem no formulário de criação/edição de turma.

## Executando Localmente

```bash
npm install
npm run dev         # http://localhost:5173
npm run build
npm run preview
```

### Variável de ambiente

```env
VITE_API_URL=http://localhost:8000
```

O Axios usa `VITE_API_URL` como `baseURL`. Todos os requests incluem o token JWT no header `Authorization: Bearer <token>` via interceptor.
