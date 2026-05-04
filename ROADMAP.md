# ClassHub Web — TODO

> Stack: React 19 + Vite 8 + TypeScript 5.9 + Material UI v7 + TanStack Query v5 + React Hook Form + Zod v4 + React Router v7 + Axios + Zustand

---

## Fase 1 — Setup do Projeto ✅
- [x] Vite + React + TypeScript inicializado
- [x] Dependências instaladas (MUI, React Query, Axios, Zustand, RHF, Zod, React Router, Dayjs)
- [x] `vite.config.ts` com alias `@` para `src/`
- [x] `tsconfig.app.json` com `paths` configurado
- [x] `.env` com `VITE_API_BASE_URL`
- [x] `package.json` renomeado para `classhub-web`

---

## Fase 2 — Estrutura Base e Roteamento ✅
- [x] Estrutura de pastas criada (`api/`, `components/`, `hooks/`, `layouts/`, `pages/`, `router/`, `store/`, `theme/`, `types/`, `utils/`)
- [x] `src/theme/index.ts` — tema MUI (azul-marinho + dourado, Inter font)
- [x] `src/types/auth.types.ts` — `User`, `LoginRequest`, `LoginResponse`, `UserRole`
- [x] `src/utils/permissions.ts` — constantes de permissão espelhando o backend
- [x] `src/router/index.tsx` — `createBrowserRouter` com rotas públicas + privadas
- [x] `src/router/PrivateRoute.tsx` — redireciona para `/` se não autenticado
- [x] `src/main.tsx` — setup com `ThemeProvider`, `QueryClientProvider`, `CssBaseline`
- [x] Stubs de todas as páginas criados

---

## Fase 3 — Autenticação (Login Modal + JWT) ✅
- [x] `src/api/axios.ts` — instância Axios com interceptor de token e logout automático no 401
- [x] `src/api/auth.api.ts` — `login()` e `getMe()`
- [x] `src/store/auth.store.ts` — Zustand store com `persist` (token + user + isAuthenticated)
- [x] `src/hooks/useAuth.ts` — `login()` / `logout()` orquestrando store + API
- [x] `src/hooks/usePermission.ts` — `hasPermission()` com bypass automático para role `admin`
- [x] `src/components/common/LoginModal.tsx` — Dialog MUI com RHF + Zod + show/hide senha

---

## Fase 4 — Layout Administrativo ✅
- [x] `src/layouts/PublicLayout.tsx` — AppBar com botão "Entrar como Administrador" + `LoginModal`
- [x] `src/layouts/AdminLayout.tsx` — flex wrapper com Topbar + Sidebar + Outlet
- [x] `src/components/layout/Sidebar.tsx` — Drawer permanente (desktop) / temporário (mobile), itens filtrados por permissão
- [x] `src/components/layout/Topbar.tsx` — AppBar com avatar, nome do usuário e logout

---

## Fase 5 — Landing Page Pública ✅
- [x] Buscar dados de `GET /landing` (school_name, welcome_text, welcome_image)
- [x] Seção Hero com gradiente, ícone, nome da escola e texto de boas-vindas (skeleton enquanto carrega)
- [x] Seção de Planos — cards com hover, `GET /plans/public` (endpoint público criado no backend)
- [x] Rodapé com nome da escola e ano
- [x] `src/api/settings.api.ts` e `src/api/plans.api.ts` criados
- [x] Types: `Plan`, `LandingPageData`, `SchoolSettings`

---

## Fase 6 — Formulário de Nivelamento (Público) ✅
- [x] Formulário completo (nome, e-mail, telefone, instagram, nascimento, CPF)
- [x] Select de nível atual de inglês
- [x] Campo de motivação (textarea)
- [x] Validação com RHF + Zod
- [x] Tela de sucesso após envio
- [x] `src/api/leveling.api.ts` criado

---

## Fase 7 — Módulo de Planos ✅
- [x] `src/api/plans.api.ts`
- [x] Componentes base reutilizáveis: `PageHeader`, `ConfirmDialog`, `DataTable`, `AppSnackbar`
- [x] `snackbar.store.ts` — Zustand store global de notificações
- [x] Tabela de planos com skeleton loading e estado vazio
- [x] Modal de criar/editar plano (RHF + Zod v4, `valueAsNumber`)
- [x] Toggle ativar/desativar com Switch
- [x] Excluir plano com ConfirmDialog
- [x] Proteção por `plans:read` / `plans:write` / `plans:delete`

---

## Fase 8 — Módulo de Alunos ✅
- [x] `src/api/students.api.ts`
- [x] Listagem com filtros (status) e busca por nome
- [x] Formulário de edição com editor de disponibilidade JSONB (`AvailabilityEditor`)
- [x] Inativar/reativar (com confirmação)
- [x] Proteção por `students:read` / `students:write` / `students:delete`

---

## Fase 9 — Módulo de Matrícula & Rematrícula ✅
- [x] `src/api/enrollment.api.ts`
- [x] Formulário de nova matrícula (dados do aluno + plano + pagamento + aceite + disponibilidade JSONB)
- [x] Formulário de rematrícula (busca aluno + novo plano + datas + pré-carregamento de disponibilidade)
- [x] Proteção por `enrollment:write`

---

## Fase 10 — Módulo de Contratos ✅
- [x] `src/api/contracts.api.ts`
- [x] Listagem com filtros por status
- [x] Cancelar contrato (com confirmação)
- [x] Destaque visual para contratos próximos do vencimento (< 30 dias)
- [x] Proteção por `contracts:read` / `contracts:write`

---

## Fase 11 — Módulo de Professores ✅
- [x] `src/api/teachers.api.ts`
- [x] Listagem com indicação "em treinamento" e coluna `Valor/hora`
- [x] Criar, editar, excluir professor com `hourly_rate` e disponibilidade JSONB
- [x] Proteção por `teachers:read` / `teachers:write` / `teachers:delete`

---

## Fase 12 — Módulo de Turmas ✅
- [x] `src/api/classes.api.ts` com parâmetros de filtro (`teacher_id`, `name`, `day_of_week`, `start_time`, `class_type`)
- [x] Listagem com dia/horário e professor responsável
- [x] Filtros: professor (autocomplete), nome, dia da semana, horário, tipo
- [x] Criar, editar, excluir turma
- [x] Aba **Ao Vivo Agora** para turmas em andamento
- [x] Indicação de quantidade de alunos
- [x] Proteção por `classes:read` / `classes:write` / `classes:delete`

---

## Fase 13 — Módulo de Usuários Administrativos ✅
- [x] `src/api/users.api.ts`
- [x] Listagem de usuários
- [x] Criar usuário com seleção de permissões
- [x] Editar usuário
- [x] Tela de gerenciamento de permissões por usuário (checkboxes por módulo + chips)
- [x] Desativar usuário (com proteção para o próprio usuário logado)
- [x] Proteção por `users:read` / `users:write` / `users:delete`

---

## Fase 14 — Configurações da Escola ✅
- [x] `src/api/settings.api.ts`
- [x] Formulário único para school_name, semester_start, semester_end, welcome_text
- [x] Invalida cache da landing page ao salvar
- [x] Proteção por `settings:read` / `settings:write`

---

## Fase 15 — Dashboard com KPIs ✅
- [x] `src/api/dashboard.api.ts`
- [x] `src/types/dashboard.types.ts`
- [x] Cards de KPI: alunos ativos/inativos, com/sem turma
- [x] Cards de professores ativos/em treinamento
- [x] Card de contratos ativos e expirando (< 30 dias) com destaque visual
- [x] Card de formulários de nivelamento pendentes com destaque visual
- [x] Atualização automática a cada 60 segundos

---

## Fase 16 — Sistema de Permissões por Menu ✅
- [x] `src/utils/permissions.ts` — espelha as permissões do backend
- [x] `usePermission()` — `hasPermission()` com bypass automático para role `admin`
- [x] Sidebar filtra itens de menu por permissão
- [x] Botões de ação desabilitados sem permissão em todos os módulos
- [x] Tela de gerenciamento visual de permissões (Fase 13 concluída)

---

## Fase 17 — Responsividade Mobile ✅
- [x] Sidebar vira Drawer no mobile
- [x] Topbar com botão hamburguer no mobile
- [x] Modais ocupam tela inteira no mobile (`fullScreen` com `useMediaQuery`)
- [x] Formulários em coluna única no mobile (Grid MUI responsivo)
- [x] Landing page responsiva (sx props com breakpoints)

---

## Fase 18 — Polimento e Refinamentos ✅
- [x] Skeleton loading em tabelas e cards (DataTable + DashboardPage)
- [x] Snackbar de feedback em todas as ações (AppSnackbar + snackbar.store)
- [x] Confirmação (Dialog) antes de ações destrutivas (ConfirmDialog em todos os módulos)
- [x] Título da aba dinâmico via settings (`document.title` em `App.tsx`)
- [x] Code splitting com `React.lazy` + `Suspense`
- [x] Breadcrumbs nas páginas admin (`AdminBreadcrumbs` no `AdminLayout`)
- [x] Light/Dark mode (toggle na Topbar, persistido via `theme.store.ts`)
  - AppBar/Topbar com gradiente teal via `backgroundImage` (compatível com dark mode do MUI)

---

## Fase 19 — Atualização do Formulário de Professor ✅

- [x] `email` obrigatório no formulário (`TeacherFormModal`)
- [x] Campo `hourly_rate` (preço hora/aula) — obrigatório, numérico
- [x] Seção de disponibilidade de horários: selecionar dia + múltiplos slots início/fim por dia
- [x] Validação Zod com os novos campos
- [x] `teachers.api.ts` e `teachers.types.ts` atualizados (`AvailabilitySlot`, `AvailabilityDay`)
- [x] Coluna `Valor/hora` adicionada na tabela de professores

---

## Fase 19.1 — Alerta de Disponibilidade do Professor no Formulário de Turma ✅

- [x] `teacherMatchesClass()` em `src/utils/availability.ts` — verifica se `startTime` cai dentro de algum slot do dia correspondente
- [x] Alerta `severity="warning"` no `ClassFormModal` abaixo do seletor de professor

---

## Fase 19.2 — Tipo "Aula particular" nas Turmas ✅

- [x] `ClassType` atualizado: `'grammar' | 'conversation' | 'private_lesson'`
- [x] `ClassFormModal`: nova opção "Aula particular" no select de tipo
- [x] `ClassesListPage`: chip "Aula particular" com `color="default"`
- [x] `LiveClassesTab`: label e cor atualizados para o novo tipo

---

## Fase 20 — Portal do Professor ✅

> Tela dedicada para professores visualizarem suas turmas e gerenciarem fechamentos de horas.

**Rota:** `/admin/teacher-portal`
**Sidebar:** item "Portal do Professor" com permissão `hour_closings:read`

### Aba 1 — Minhas Turmas ✅
- [x] Listar turmas do professor autenticado (`GET /teachers/me/classes`)
- [x] Cards por turma com: nome, dia/horário, tipo, lista de alunos (nome + contato)
- [x] Campo de link da aula editável inline — `PATCH /classes/{id}/meeting-link`

### Aba 2 — Fechamento de Horas ✅
- [x] Formulário de nova requisição: range de datas (`date_from` → `date_to`), `final_value` pré-preenchido com `suggested_value`, campo `notes`
- [x] Tabela de histórico com filtros por status (pendentes primeiro)
- [x] Editar (modal) e cancelar fechamentos `pending`
- [x] `src/api/hour-closings.api.ts` criado
- [x] `src/types/hour-closing.types.ts` criado

---

## Fase 21 — Aprovação de Fechamentos (Admin) ✅

> Aba na tela de professores administrativos para aprovar/reprovar fechamentos.

**Localização:** aba na tela `/admin/teachers`
**Permissão:** `hour_closings:approve`

- [x] Tabela de fechamentos (exclui `cancelled`) com colunas: professor, período, horas, valor sugerido, valor final, status
- [x] Pendentes listados primeiro
- [x] Modal de revisão com campo `final_value` editável
- [x] Botões: Aprovar / Reprovar
- [x] Chip colorido por status (amarelo=pendente, verde=aprovado, vermelho=reprovado)

---

## Fase 22 — Formulário de Nivelamento Dinâmico ✅

> Formulário configurável pelo admin. Histórico preservado por instância de template.

### Builder de Formulário (Admin)
- [x] Nova tela `/admin/leveling-templates` — gerenciar templates
- [x] Cards com indicação de qual está ativo (borda verde)
- [x] Criar/editar template: editor de perguntas com tipos `single_choice`, `multiple_choice`, `text`
- [x] Botão "Ativar template" (ativa este, desativa os demais)
- [x] Excluir template (bloqueado se estiver ativo)
- [x] Item no Sidebar com ícone `LibraryBooks`, permissão `leveling:read`
- [x] `src/api/leveling-templates.api.ts` — CRUD + activate + getActive
- [x] `src/types/leveling-template.types.ts` — `LevelingTemplate`, `TemplateQuestion`, `QuestionType`

### Formulário Público Dinâmico
- [x] `GET /leveling-templates/active` — buscar template ao carregar a página (skeleton enquanto carrega)
- [x] Renderização dinâmica por tipo: `text` → TextField, `single_choice` → RadioGroup, `multiple_choice` → CheckboxGroup
- [x] Respostas enviadas como JSON com `template_id`

### Histórico de Respostas (Admin)
- [x] `LevelingListPage`: dialog de detalhes usa `form_snapshot` para exibir labels corretas das perguntas
- [x] `LevelingFormResponse` atualizado com `template_id` e `form_snapshot`

---

## Fase 23 — Ajustes Gerais ✅

- [x] **Tema escuro:** corrigir `AppBar`/`Topbar` que ficam com fundo branco no dark mode — `backgroundImage` com gradiente teal
- [x] **Turmas:** tipo `private_lesson` (`Aula particular`) adicionado em `ClassType`
- [x] **Turmas:** filtros na listagem — Professor (autocomplete), Nome, Dia da semana, Horário, Tipo
- [x] **Nivelamento:** busca por nome e telefone na listagem administrativa (`LevelingListPage`)
- [x] **Matrícula e Rematrícula:** campo de disponibilidade substituído por `AvailabilityEditor` (múltiplas janelas por dia — JSONB)
- [x] **Alunos:** `StudentFormModal` atualizado com `AvailabilityEditor` (disponibilidade JSONB)
- [x] **Componente compartilhado:** `AvailabilityEditor` em `src/components/common/AvailabilityEditor.tsx` — reusado em professor, aluno, matrícula e rematrícula
- [x] **`availability.ts`:** `studentMatchesClass` atualizada para `AvailabilityDay[]`; constante `DAYS` exportada; utilitários string removidos
- [x] **Dashboard:** card "Aguardando Aprovação" na seção Fechamentos de Horas (visível apenas com `hour_closings:approve`)

---

## Fase 24 — Formulário NPS (Futuro) ⬜

> Formulário público para coleta de NPS. Detalhes a definir.

- [ ] A ser especificado

---

## Decisões Técnicas

| Decisão | Escolha |
|---------|---------|
| Build | Vite 8 |
| UI | Material UI v7 |
| State server | TanStack Query v5 |
| State cliente | Zustand v5 |
| Forms | React Hook Form v7 + Zod v4 |
| HTTP | Axios v1 |
| Roteamento | React Router v7 |
| Datas | Day.js |
| Permissões | Lista granular `permissions: string[]` (Opção B) |
| Linguagem | TypeScript 5.9 |
| Disponibilidade | JSONB com `AvailabilityDay[]` — compartilhado entre professor, aluno, matrícula |
