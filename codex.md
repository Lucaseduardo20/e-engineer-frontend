# Codex - Frontend E-Engineer

Este arquivo registra auditoria, decisoes e contexto de continuidade do frontend do E-Engineer.

O guia estavel do produto esta em `../master.md`.
As instrucoes operacionais especificas do frontend estao em `frontend-agent.md`.

## 2026-05-25 - Inicializacao do registro de auditoria frontend

### Contexto

- O frontend e uma SPA administrativa para um SaaS B2B vertical de engenharia civil.
- O produto deve usar linguagem de dominio: projeto tecnico, entregavel, documento, versao, revisao, template, responsavel tecnico, historico e projeto de referencia.
- O app ainda esta no estado inicial de template Vue/Vite.
- A estrutura modular sugerida em `frontend-agent.md` ainda nao foi criada.

### Estado tecnico observado

- Stack instalada: Vue 3, Vite, TypeScript, Pinia, Vue Router, Vitest e Prettier.
- `src/App.vue` ainda exibe o conteudo padrao do template.
- `src/router/index.ts` existe, mas ainda nao possui rotas.
- `src/stores/counter.ts` ainda e store exemplo do template.
- Nao ha `codex.md` anterior no frontend.
- Nao ha Vuetify 3, Axios ou biblioteca de validacao instalados neste momento.

### Decisoes registradas

- Manter um `codex.md` proprio no frontend, espelhando a pratica ja usada no backend.
- Usar `frontend-agent.md` como guia vivo de instrucoes e aprendizados permanentes do agente frontend.
- Registrar neste arquivo decisoes datadas, contexto de cortes implementados e justificativas relevantes.
- Enquanto a API nao estiver pronta, usar mocks organizados por modulo, sem espalhar dados mockados dentro de componentes.

### Proximos cortes recomendados

- Criar a base de arquitetura modular em `src/app`, `src/modules` e `src/shared`.
- Substituir a tela padrao por um layout autenticado inicial com sidebar, topo e area principal.
- Criar uma primeira tela de Dashboard com dados mockados realistas do dominio.
- Atualizar ou remover artefatos do template, como `src/stores/counter.ts`, quando houver substituicao por estrutura real.

## 2026-05-25 - Primeiro corte de arquitetura e Dashboard

### Contexto

- O frontend estava com a tela padrao do template Vue/Vite.
- Ainda nao havia estrutura modular real nem rota inicial navegavel.
- Vuetify 3 nao esta instalado, entao este corte usou CSS proprio para nao introduzir dependencia sem aprovacao.

### Implementado

- Criado layout autenticado inicial em `src/app/layouts/AuthenticatedLayout.vue`.
- Criada folha global em `src/app/styles/global.css`.
- Criada rota `/dashboard` e redirecionamento de `/` para `/dashboard`.
- Criado Dashboard inicial em `src/modules/dashboard/pages/DashboardPage.vue`.
- Criados componentes de Dashboard para metricas, projetos recentes, revisoes pendentes e ultimos eventos.
- Criados componentes compartilhados `BasePageHeader` e `BaseStatusChip`.
- Criados mocks realistas do dominio em `src/modules/dashboard/mocks/dashboard.mock.ts`.
- Criados tipos explicitos do Dashboard em `src/modules/dashboard/types/dashboard.types.ts`.
- Removido `src/stores/counter.ts`, que era artefato do template.
- Atualizado teste de `App.vue` para validar o outlet do router.

### Validacoes

- `npm run type-check`: passou com Node 18.20.4.
- `npm run build`: passou usando NVM com Node 22.13.1.
- `npm run test:unit`: passou usando NVM com Node 22.13.1.

### Observacoes operacionais

- O Node padrao do shell nesta sessao era 18.20.4, incompatível com Vite 8/Vitest 4 do projeto.
- Para rodar build, testes e dev server nesta maquina, carregar NVM e usar Node 22:

```sh
source ~/.nvm/nvm.sh
nvm use 22
```

- O dev server subiu em `http://localhost:5174/` porque a porta 5173 ja estava em uso.

## 2026-05-25 - Autenticacao frontend

### Contexto

- O backend definiu `POST /auth/login` retornando `{ token, user }`.
- O frontend precisava de login, persistencia de sessao, interceptor de token e protecao de rotas para seguir o MVP.
- O projeto ainda nao usava Vuetify; este corte manteve CSS proprio.

### Implementado

- Instaladas dependencias `axios` e `zod`.
- Criado HTTP client centralizado em `src/shared/http/http-client.ts`.
- Criado interceptor de auth em `src/shared/http/interceptors/auth.interceptor.ts`.
- Criado modulo `src/modules/auth` com tipos, constantes de storage, service, Pinia store, composable e entry point.
- Criado `LoginForm.vue` com validacao Zod, loading state e erro de servidor.
- Criadas paginas `LoginPage.vue` e `LogoutPage.vue`.
- Criado `UnauthenticatedLayout.vue` para rotas publicas.
- Criado guard `src/router/guards/auth.guard.ts`.
- Atualizado router com `/login`, `/logout`, redirect `/` e `/dashboard` protegido por `meta.requiresAuth`.
- Atualizado `App.vue` para escolher layout pelo meta da rota.
- Atualizado `AuthenticatedLayout.vue` para exibir dados da sessao e link de logout.
- Criados `.env` e `.env.example` com `VITE_API_URL=http://localhost:3000`.
- Atualizados testes do `App.vue` e criado teste unitario de `LoginForm.vue`.
- Criado teste unitario do guard de autenticacao.

### Decisoes registradas

- Token JWT e usuario autenticado ficam em `localStorage` com as chaves `auth:token` e `auth:user`.
- Store Pinia `useAuthStore` e a fonte de verdade do estado de autenticacao.
- Componentes consomem `useAuth`, store ou services; nao devem chamar Axios diretamente.
- Interceptor adiciona `Authorization: Bearer {token}` em toda request quando houver token salvo.
- Respostas `401` limpam a sessao e redirecionam para `/login` preservando `redirect` na query.
- Rotas protegidas devem declarar `meta.requiresAuth = true`.

### Validacoes

- `npm run type-check`: passou com Node 22.13.1.
- `npm run build`: passou com Node 22.13.1.
- `npm run test:unit`: passou com 3 arquivos e 6 testes.
- `npm run lint`: nao executado porque o projeto ainda nao possui script `lint` configurado.

### Observacoes operacionais

- Para testar login real, o backend precisa estar rodando em `VITE_API_URL` e oferecer `POST /auth/login`.
- Sem token, `/dashboard` redireciona para `/login?redirect=/dashboard`.
- A tela de login chama `/auth/login` e, em sucesso, redireciona para `/dashboard`.

## 2026-05-26 - Dashboard Vuetify integrado

### Implementado

- Vuetify passou a ser usado no AppShell autenticado com navigation drawer, topbar, seletor de organizacao e menu do usuario.
- Criado client tipado `src/shared/http/api-client.ts` consumindo envelopes `{ data }`.
- Contratos do dashboard foram definidos em `src/shared/types/api-contracts.ts`.
- Criadas stores Pinia `useProjectsStore` e `useUiStore`.
- Criados componentes ProjectsList, ProjectDetail, DeliverablesBoard, OrgSwitcher, KBSearch, ReviewsPanel, NotificationsFeed e AdminUsers.
- Dashboard passou a consumir projetos, auditoria, revisoes, busca de conhecimento e usuarios via API.
- Rotas `/projects` e `/projects/:id` foram adicionadas.

### Validacoes

- `npm run type-check`: passou.
- `npm run build`: passou com Node 22.13.1.
- `npm run test:unit -- ProjectsList`: passou com Node 22.13.1.

## 2026-05-26 - Refinamento visual do Dashboard

### Implementado

- Dashboard recebeu header com mais contraste, cards de metrica com mini graficos e hierarquia visual mais clara.
- Criado `BasePagination.vue` como componente reutilizavel de paginacao.
- Criado `BaseStatusBadge.vue` e contrato central `shared/ui/status-badges.ts` para padronizar status, cores e icones.
- `ProjectsList.vue` passou a usar paginacao externa, badges contratados, icones e linhas com melhor legibilidade.
- AppShell recebeu icones no menu e botao de recolher/expandir com tooltip.
- Paineis laterais de eventos, revisoes, equipe e base de conhecimento ganharam cabecalhos com icones, borda e sombra mais consistente.
- Vuetify foi configurado com `mdi-svg`, evitando dependencia de fonte externa para icones.

### Validacoes

- `npm run type-check`: passou com Node 22.13.1.
- `npm run build`: passou com Node 22.13.1.
- `npm run test:unit -- ProjectsList`: passou com Node 22.13.1.

## 2026-05-26 - Sprint 0 integracao MVP

### Implementado

- Criada camada `src/shared/http/api` com services para auth e projects sobre o `http-client`.
- Stores de auth/projects passaram a usar a camada compartilhada de API.
- `ProjectsStore` ganhou criacao persistente de projeto via `POST /projects`.
- Tela `/projects` ganhou dialog de criacao de projeto tecnico.
- Interceptor de auth passou a renovar JWT via `POST /auth/refresh` e repetir uma request 401 uma vez.
- Criado teste E2E em `tests/e2e/sprint0.spec.ts` cobrindo app servido, login, listagem, criacao de projeto e refresh.

### Validacoes

- `npm run type-check`: passou com Node 22.13.1.
- `npm run build`: passou com Node 22.13.1.
- `npm run test:unit -- tests/e2e/sprint0.spec.ts`: passou com acesso liberado a `localhost`.

## 2026-05-27 - Sprint 2 Deliverables

### Implementado

- Criado modulo `src/modules/deliverables` com pagina, lista, formulario e store Pinia.
- API client ganhou `deliverables.list`, `deliverables.get`, `deliverables.create` e `deliverables.update`, consumindo envelopes `{ data }`.
- Rotas por projeto adicionadas: `/projects/:projectId/deliverables`, `/projects/:projectId/deliverables/new` e `/projects/:projectId/deliverables/:deliverableId/edit`.
- Detalhe de projeto ganhou acao para gerenciar entregaveis.
- Contrato frontend de `Deliverable` passou a incluir `type` com tipos do dominio de engenharia civil.
- Testes unitarios cobrem store, lista, formulario e compatibilidade do store de projetos.
- Teste E2E de integracao foi ampliado para cobrir criacao, listagem e edicao de entregavel via API.

### Validacoes

- `npm run type-check`: passou com Node 22.
- `npm run test:unit`: passou com Node 22.
- `npm run test:e2e`: passou com backend local em `http://127.0.0.1:3000` e frontend em `http://127.0.0.1:5174`.
- `npm run build`: passou com Node 22.

## 2026-05-27 - Sprint 2 Documents

### Implementado

- Criado modulo `src/modules/documents` com pagina, lista, card, formulario de documento/upload e store Pinia.
- API client ganhou `documents.list`, `documents.get`, `documents.create`, `documents.update`, `documents.delete` e `documents.uploadVersion`, consumindo envelopes `{ data }`.
- Rota protegida `/documents` adicionada ao router, aproveitando o item ja presente no AppShell.
- UI de documentos recebeu filtros por projeto/status/tipo, indicadores de acervo/oficiais, cadastro de documento tecnico, upload de versao, edicao e exclusao.
- Contratos frontend passaram a modelar `DocumentStatus`, `DocumentType`, `DocumentVersion`, `DocumentSummary` e `DocumentDetail`.
- Teste E2E de documentos foi adicionado em `tests/e2e/documents.spec.ts` para cobrir listagem, criacao, upload e exclusao quando backend/frontend estiverem rodando.

### Validacoes

- `npm run type-check`: passou com Node 22.
- `npm run test:unit -- --maxWorkers=1 src/modules/documents`: passou com Node 22.
- `npm run build`: passou com Node 22.

## 2026-05-27 - Sprint 2 Reviews

### Implementado

- Criado modulo `src/modules/reviews` com pagina, lista, card, formulario e store Pinia.
- API client ganhou `reviews.list`, `reviews.get`, `reviews.create`, `reviews.approve` e `reviews.reject`, consumindo envelopes `{ data }`.
- Rota protegida `/reviews` adicionada ao router.
- `ReviewsPanel` passou a usar a store real de revisoes e pode receber `projectId`; o detalhe de projeto agora exibe o painel filtrado pelo projeto.
- UI de revisoes recebeu filtros por projeto/entregavel/documento/status, criacao de solicitacao e acoes de aprovar/rejeitar com confirmacao.
- Contratos frontend passaram a modelar `ReviewStatus`, `ReviewReviewer`, `ReviewSummary` e `ReviewDetail`.
- Teste E2E de revisoes foi adicionado em `tests/e2e/reviews.spec.ts` para cobrir criacao, listagem, aprovacao e rejeicao quando backend/frontend estiverem rodando.

### Validacoes

- `npm run type-check`: passou com Node 22.
- `npm run test:unit -- --maxWorkers=1 src/modules/reviews`: passou com Node 22.
- `npm run build`: passou com Node 22.

## 2026-05-28 - Revisoes interativas e links rastreaveis

### Implementado

- Tarefa: tornar revisoes mais completas, com modal detalhada, discussao persistente, links compartilhaveis e botao de voltar menos confundivel.
- Mudancas: `src/shared/types/api-contracts.ts`, `src/shared/http/api-client.ts`, `src/shared/components/TraceableLinkButton.vue`, `src/app/layouts/AuthenticatedLayout.vue`, `src/router/index.ts`, `src/modules/reviews/stores/reviews.store.ts`, `src/modules/reviews/components/ReviewCard.vue`, `src/modules/reviews/components/ReviewsList.vue`, `src/modules/reviews/components/ReviewDetailDialog.vue`, `src/modules/reviews/pages/ReviewsPage.vue`, `src/modules/reviews/components/ReviewsList.spec.ts`, `src/modules/reviews/stores/reviews.store.spec.ts`, `src/modules/documents/components/DocumentCard.vue`, `src/modules/documents/pages/DocumentsPage.vue`, `src/modules/projects/components/ProjectDetail.vue`.
- Decisao tomada: a rota `/reviews/:reviewId` abre a mesma tela de revisoes com uma modal de detalhe, mantendo a lista como contexto e permitindo compartilhar link direto da revisao.
- Decisao tomada: comentarios de revisao usam `apiClient.reviews.comment()` e recarregam o detalhe persistido; o campo de prazo da criacao envia ISO string para alinhar com a API.
- Decisao tomada: `TraceableLinkButton` foi criado como componente compartilhado para copiar links de revisao, projeto e documento; documentos tambem aceitam `?documentId=` para abrir o historico direto.
- Decisao tomada: o botao Voltar saiu da app bar e virou uma acao textual no topo do conteudo, separada visualmente do toggle do menu.
- Alternativas consideradas: abrir uma pagina separada de revisao foi evitado para preservar navegacao e filtros atuais; usar apenas query string para revisao foi evitado porque `/reviews/:reviewId` e mais legivel para compartilhamento.

### Validacoes

- `npm run type-check`: passou com Node 22.13.1.
- `npm run test:unit -- --run src/modules/reviews src/modules/documents src/modules/projects`: passou com 8 arquivos e 13 testes.
- `npm run build`: passou com Node 22.13.1.
- `npm run test:e2e`: falhou no sandbox por `EPERM` ao acessar `localhost`; reexecutado fora do sandbox e passou com 3 arquivos e 3 testes.

## 2026-05-28 - Links sutis em cards e revisoes

### Implementado

- Tarefa: tornar o link do projeto clicavel dentro das revisoes e deixar os botoes de copiar link menos chamativos.
- Mudancas: `src/shared/components/TraceableLinkButton.vue`, `src/modules/reviews/components/ReviewCard.vue`, `src/modules/reviews/components/ReviewDetailDialog.vue`.
- Decisao tomada: `TraceableLinkButton` virou um botao de icone com tooltip e feedback visual de copiado, mantendo o mesmo contrato de props para os usos existentes em documentos/projetos.
- Decisao tomada: cards de revisao agora mostram o projeto como acao navegavel para `/projects/:projectId` e tambem expõem links discretos para copiar a URL da revisao e do projeto.
- Alternativas consideradas: manter botoes textuais foi evitado porque competia visualmente com acoes primarias como abrir/aprovar/rejeitar.

## 2026-06-08 - Tela administrativa de Tags

### Implementado

- Tarefa: finalizar a tela de taxonomia tecnica como gestao de Tags na organizacao.
- Mudancas: `src/modules/technical-tags/pages/TechnicalTagsPage.vue`, `src/modules/technical-tags/stores/technical-tags.store.ts`, `src/shared/http/api-client.ts`, `src/shared/types/api-contracts.ts`, `src/router/index.ts`, `src/app/layouts/AuthenticatedLayout.vue`.
- Decisao tomada: a rota existente `/technical-tags` foi preservada, mas a navegacao e a pagina passaram a usar o nome de produto "Tags".
- Decisao tomada: `manager` representa o papel de coordenador no RBAC atual; usuarios sem `knowledge.update/archive/deprecate` veem a tela em modo somente leitura, sem acoes de gerenciamento.
- Decisao tomada: arquivar e depreciar exigem confirmacao e continuam sem exclusao destrutiva.

### Validacoes

- `npm run type-check`: passou.
- `source ~/.nvm/nvm.sh && nvm use 22 && npm run build`: passou.

## 2026-06-08 - Cockpit tecnico do projeto

### Implementado

- Tarefa: redesenhar o detalhe do projeto como cockpit tecnico operacional.
- Mudancas: `src/modules/projects/components/ProjectDetail.vue`, `src/modules/projects/pages/ProjectDetailPage.vue`, `src/modules/projects/stores/projects.store.ts`, `src/shared/types/api-contracts.ts`.
- Decisao tomada: o cockpit usa composicao frontend sobre endpoints existentes, sem depender de `GET /projects/:projectId/technical-summary` neste MVP.
- Decisao tomada: a pagina passa a carregar documentos, revisoes, conhecimento aplicado e historico junto do detalhe do projeto para calcular indicadores, recomendacoes, riscos e aprendizados.
- Decisao tomada: as secoes pedidas foram organizadas como header executivo, indicadores rapidos, resumo operacional, entregaveis, documentos, revisoes, conhecimento aplicado, recomendacoes, riscos/aprendizados e historico.

### Validacoes

- `source ~/.nvm/nvm.sh && nvm use 22 && npm run type-check`: passou.
- `source ~/.nvm/nvm.sh && nvm use 22 && npm run test:unit -- --run src/modules/projects`: passou com 2 arquivos e 4 testes.
- `source ~/.nvm/nvm.sh && nvm use 22 && npm run build`: passou.

## 2026-06-08 - Experiencia de Knowledge do Projeto

### Implementado

- Tarefa: transformar conhecimento aplicado no projeto em uma experiencia visivel, orientada por valor e com gestao em modal.
- Mudancas: `src/modules/projects/components/ProjectKnowledgeSection.vue`.
- Decisao tomada: manter os endpoints atuais de conhecimento do projeto; a melhoria fica no fluxo frontend, usando vinculo, remocao e promocao ja existentes.
- Decisao tomada: a tela principal mostra um resumo estrategico com valor percebido e um botao forte de gestao; a modal concentra panorama, aplicacao, criacao de referencia e gerenciamento de vinculos.

### Validacoes

- `source ~/.nvm/nvm.sh && nvm use 22 && npm run test:unit -- --run src/modules/projects`: passou com 2 arquivos e 4 testes.
- `source ~/.nvm/nvm.sh && nvm use 22 && npm run type-check`: passou.
- `source ~/.nvm/nvm.sh && nvm use 22 && npm run build`: passou.

## 2026-06-08 - Refinamento visual e rolagem da modal de Knowledge

### Implementado

- Tarefa: melhorar a estilização da modal de Knowledge do projeto e corrigir a falta de rolagem quando o conteúdo ultrapassa o viewport.
- Mudancas: `src/modules/projects/components/ProjectKnowledgeSection.vue`.
- Decisao tomada: a modal passa a ter altura maxima controlada, cabecalho e abas fixos, corpo com scroll interno e barras de rolagem estilizadas.
- Decisao tomada: a interface reforca a identidade visual da plataforma com verde escuro, teal, superficies claras e blocos de valor antes das acoes.

### Validacoes

- `source ~/.nvm/nvm.sh && nvm use 22 && npm run test:unit -- --run src/modules/projects`: passou com 2 arquivos e 4 testes.
- `source ~/.nvm/nvm.sh && nvm use 22 && npm run type-check`: passou.
- `source ~/.nvm/nvm.sh && nvm use 22 && npm run build`: passou.

## 2026-06-08 - TechnicalTagSelector autossustentavel

### Implementado

- Tarefa: corrigir a UX ruim de tags dentro da modal de Knowledge e evitar dependencias de scroll externo.
- Mudancas: `src/modules/technical-taxonomy/components/TechnicalTagSelector.vue`, `src/modules/projects/components/ProjectKnowledgeSection.vue`.
- Decisao tomada: o seletor de tags passa a ter viewport propria com scroll interno, paginação por "Carregar mais tags", busca server-side e preservacao de selecoes durante buscas.
- Decisao tomada: a aba de criar referencia limita a lista de tags internamente, evitando que o formulario estoure a modal.

### Validacoes

- `source ~/.nvm/nvm.sh && nvm use 22 && npm run test:unit -- --run src/modules/projects`: passou com 2 arquivos e 4 testes.
- `source ~/.nvm/nvm.sh && nvm use 22 && npm run type-check`: passou.
- `source ~/.nvm/nvm.sh && nvm use 22 && npm run build`: passou.

## 2026-06-08 - Wizard de criacao de referencia Knowledge

### Implementado

- Tarefa: corrigir a experiencia espremida da aba "Criar referencia" na modal de Knowledge do projeto.
- Mudancas: `src/modules/projects/components/ProjectKnowledgeSection.vue`.
- Decisao tomada: a criacao de referencia passa a ser um fluxo em 3 passos: Base, Tags e Uso. A etapa de Tags ocupa largura total e tem viewport propria maior, evitando que a selecao fique impraticavel.
- Decisao tomada: o usuario so avanca para Tags apos informar titulo e motivo, reduzindo ruido e deixando a organizacao por tags como um momento dedicado do fluxo.

### Validacoes

- `source ~/.nvm/nvm.sh && nvm use 22 && npm run test:unit -- --run src/modules/projects`: passou com 2 arquivos e 4 testes.
- `source ~/.nvm/nvm.sh && nvm use 22 && npm run type-check`: passou.
- `source ~/.nvm/nvm.sh && nvm use 22 && npm run build`: passou.

## 2026-06-08 - Correcao de scroll da modal de Knowledge

### Implementado

- Tarefa: corrigir bug onde a modal de Knowledge cortava o conteudo da etapa "Criar referencia" sem permitir rolagem.
- Mudancas: `src/modules/projects/components/ProjectKnowledgeSection.vue`.
- Decisao tomada: o `content-class` global da dialog agora define altura baseada no viewport; o card ocupa 100% dessa altura em coluna e o `v-card-text` recebe `flex: 1` com `overflow-y: auto`.
- Decisao tomada: o `v-window` tambem recebe `min-height: 0` para nao bloquear o scroll do corpo da modal.

### Validacoes

- `source ~/.nvm/nvm.sh && nvm use 22 && npm run test:unit -- --run src/modules/projects`: passou com 2 arquivos e 4 testes.
- `source ~/.nvm/nvm.sh && nvm use 22 && npm run type-check`: passou.
- `source ~/.nvm/nvm.sh && nvm use 22 && npm run build`: passou.

## 2026-06-08 - Scroll interno forcado no card da modal de Knowledge

### Implementado

- Tarefa: corrigir definitivamente o corte de conteudo na modal de Knowledge quando a etapa "Criar referencia" ultrapassa a altura visivel.
- Mudancas: `src/modules/projects/components/ProjectKnowledgeSection.vue`.
- Decisao tomada: a altura da modal passa a ser definida diretamente no `v-card`, e o `v-card-text` vira o container rolavel com `flex: 1 1 0` e `overflow-y: scroll`, garantindo scroll interno da modal.
- Decisao tomada: o `v-window` deixa de ser grid para nao interferir no calculo de overflow.

### Validacoes

- `source ~/.nvm/nvm.sh && nvm use 22 && npm run test:unit -- --run src/modules/projects`: passou com 2 arquivos e 4 testes.
- `source ~/.nvm/nvm.sh && nvm use 22 && npm run type-check`: passou.
- `source ~/.nvm/nvm.sh && nvm use 22 && npm run build`: passou.

### Validacoes

- `npm run type-check`: passou com Node 22.13.1.
- `npm run test:unit -- --run src/modules/reviews src/modules/documents src/modules/projects`: passou com 8 arquivos e 13 testes.

## 2026-05-28 - ORG-003/004 Organizations management page

### Implementado

- Tarefa: criar pagina de Organizations e testes para gestao inicial da organizacao autenticada.
- Mudancas: `src/modules/organizations/stores/organizations.store.ts`, `src/modules/organizations/stores/organizations.store.spec.ts`, `src/modules/organizations/pages/OrganizationsPage.vue`, `src/modules/organizations/pages/OrganizationsPage.spec.ts`, `src/modules/organizations/components/OrgSwitcher.vue`, `src/app/layouts/AuthenticatedLayout.vue`, `src/router/index.ts`, `tests/e2e/organizations.spec.ts`.
- Decisao tomada: a pagina `/organizations` e read-only neste corte, consumindo `GET /organizations/current` e `GET /organizations/current/users`, para evitar introduzir mutacoes de tenant, convite ou roles sem contrato e autorizacao aprovados.
- Decisao tomada: `OrgSwitcher` passou a usar a store Pinia de organizations, evitando carregamento duplicado e centralizando erro/loading.
- Alternativas consideradas: criar fluxo de edicao/convite foi adiado porque impacta seguranca, tenancy e contrato publico.

### Validacoes

- `npm run type-check`: passou com Node 22.13.1.
- `npm run test:unit -- --run src/modules/organizations`: passou com 2 arquivos e 3 testes.
- `npm run test:unit -- --run --maxWorkers=1`: passou com 19 arquivos e 35 testes.
- `npm run build`: passou com Node 22.13.1.
- `npm run test:e2e`: passou fora do sandbox com 4 arquivos e 4 testes.

## 2026-05-28 - RBAC de sessao no frontend

### Implementado

- Tarefa: preparar o frontend para consumir RBAC centralizado, super-admin, troca de tenant e incorporacao.
- Mudancas: `src/shared/types/api-contracts.ts`, `src/shared/http/api-client.ts`, `src/modules/auth/stores/auth.store.ts`, `src/modules/auth/stores/auth.store.spec.ts`, `src/app/layouts/AuthenticatedLayout.vue`.
- Decisao tomada: `User` passa a aceitar `isPlatformAdmin` e `impersonatedBy`; a store expõe `isPlatformAdmin`, `isImpersonating` e `replaceSession()` para troca de tenant/incorporacao.
- Decisao tomada: o app shell mostra um chip discreto quando a sessao e super-admin ou incorporada, sem ainda criar a UI operacional completa de plataforma.
- Alternativas consideradas: criar telas completas de colaborador/super-admin neste corte foi evitado para manter primeiro a fundacao segura no backend.

### Validacoes

- `npm run type-check`: passou com Node 22.13.1.
- `npm run test:unit -- --run src/modules/auth src/modules/organizations`: passou com 4 arquivos e 9 testes.
- `npm run test:unit -- --run --maxWorkers=1`: passou com 19 arquivos e 36 testes.
- `npm run build`: passou com Node 22.13.1.

## 2026-05-28 - Gestao fluida de organizacao e colaboradores

### Implementado

- Tarefa: transformar `/organizations` em tela operacional para identidade do tenant, colaboradores, prioridade e sessoes super-admin.
- Mudancas: `src/modules/organizations/pages/OrganizationsPage.vue`, `src/modules/organizations/pages/OrganizationsPage.spec.ts`, `src/modules/organizations/stores/organizations.store.ts`, `src/shared/http/api-client.ts`, `src/shared/types/api-contracts.ts`.
- Decisao tomada: a tela usa abas para reduzir carga cognitiva: Perfil, Colaboradores, Prioridades e Super-admin. Dialogs curtos cuidam de criar/editar/clonar colaborador.
- Decisao tomada: uploads de logo/avatar usam `FormData` e atualizam a store local apos resposta da API, evitando reload geral desnecessario.
- Decisao tomada: a area Super-admin fica visivel somente para `isPlatformAdmin`; troca de tenant e incorporacao substituem a sessao via `authStore.replaceSession()`.
- Alternativas consideradas: criar paginas separadas foi evitado para manter a gestao concentrada e fluida dentro do contexto do tenant.

### Validacoes

- `PATH=/home/lkt/.nvm/versions/node/v24.16.0/bin:$PATH npm run type-check`: passou.
- `PATH=/home/lkt/.nvm/versions/node/v24.16.0/bin:$PATH npm run test:unit -- src/modules/organizations --maxWorkers=1`: passou com 2 arquivos e 3 testes.
- `PATH=/home/lkt/.nvm/versions/node/v24.16.0/bin:$PATH npm run build`: passou.
- Observacao: com Node `v18.20.4`, Vitest/Vite falham por engine/API (`styleText`/`CustomEvent`); as validacoes finais foram executadas com Node 24 instalado localmente.

## 2026-05-28 - Ajustes UX/RBAC em revisoes e organizacoes

### Implementado

- Tarefa: clarificar links de projetos/documentos em revisoes, remover aba super-admin, adicionar incorporacao por usuario, proteger rotas por RBAC e reposicionar prioridade por colaborador.
- Mudancas: `src/shared/auth/rbac.ts`, `src/router/index.ts`, `src/router/guards/auth.guard.ts`, `src/router/route-meta.d.ts`, `src/app/layouts/AuthenticatedLayout.vue`, `src/modules/auth/stores/auth.store.ts`, `src/modules/auth/stores/auth.store.spec.ts`, `src/modules/organizations/components/OrgSwitcher.vue`, `src/modules/organizations/pages/OrganizationsPage.vue`, `src/modules/organizations/pages/OrganizationsPage.spec.ts`, `src/modules/reviews/components/ReviewCard.vue`, `src/modules/reviews/components/ReviewDetailDialog.vue`, `src/shared/http/api-client.ts`, `src/shared/types/api-contracts.ts`.
- Decisao tomada: permissao de rota e menu fica centralizada em `src/shared/auth/rbac.ts`; o guard redireciona para `/dashboard` quando o usuario impersonado tenta abrir URL sem permissao.
- Decisao tomada: super-admin troca tenant no seletor global e incorpora usuario direto na linha do colaborador, sem exigir colar ID manualmente.
- Decisao tomada: prioridades sairam de aba propria e viraram acao contextual do colaborador, vinculando usuario + projeto/entregavel/documento/revisao.
- Decisao tomada: links em revisoes usam botoes tonais com texto "Ir para..." e cores distintas para projeto/documento, mantendo tooltips nos links e nas acoes da tabela.
- Alternativas consideradas: manter aba de prioridades e super-admin foi evitado porque duplicava contexto e obrigava o usuario a operar por IDs.

### Validacoes

- `PATH=/home/lkt/.nvm/versions/node/v24.16.0/bin:$PATH npm run type-check`: passou.
- `PATH=/home/lkt/.nvm/versions/node/v24.16.0/bin:$PATH npm run test:unit -- src/modules/organizations src/modules/reviews src/modules/auth --maxWorkers=1`: passou com 7 arquivos e 15 testes.
- `PATH=/home/lkt/.nvm/versions/node/v24.16.0/bin:$PATH npm run build`: passou.

## 2026-06-09 - Task 7 entregaveis como eixo operacional

### Implementado

- Tarefa: criar visao rica de entregaveis tecnicos dentro do cockpit do projeto.
- Mudancas: `src/modules/projects/components/ProjectDeliverableTechnicalCard.vue`, `src/modules/projects/components/ProjectDeliverableTechnicalCard.spec.ts`, `src/modules/projects/components/ProjectDetail.vue`.
- Decisao tomada: o primeiro corte usa dados ja carregados pelo detalhe do projeto (`deliverables`, `documents`, `reviews` e knowledge aplicado), evitando endpoint agregado novo enquanto `deliverableId` em documentos/revisoes atende a rastreabilidade principal.
- Decisao tomada: knowledge aplicado ao projeto aparece no card como contexto tecnico e tenta destacar afinidade por titulo/tipo/tags do entregavel; relacoes especificas por entregavel ficam como evolucao futura de contrato.
- Decisao tomada: o board de entregaveis foi mantido como visao de fluxo, e os novos cards entram antes dele como leitura operacional rica e orientada a acao.

### Validacoes

- `source ~/.nvm/nvm.sh && nvm use 22 && npm run test:unit -- --run src/modules/projects/components/ProjectDeliverableTechnicalCard.spec.ts`: passou com 1 arquivo e 1 teste.
- `source ~/.nvm/nvm.sh && nvm use 22 && npm run type-check`: passou.
- `source ~/.nvm/nvm.sh && nvm use 22 && npm run build`: passou.

## 2026-06-09 - Reforco visual do cockpit do projeto

### Implementado

- Tarefa: dar mais enfase visual para Base de Conhecimento e entregaveis dentro do detalhe do projeto.
- Mudancas: `src/modules/projects/components/ProjectDetail.vue`, `src/modules/projects/components/ProjectKnowledgeSection.vue`.
- Decisao tomada: a Base de Conhecimento foi elevada na hierarquia da pagina, com chamada de valor propria logo apos as metricas e antes dos entregaveis, para deixar claro que knowledge reduz retrabalho e orienta decisoes.
- Decisao tomada: cards de metricas passaram a usar cores/acento por tipo de sinal, destacando gargalos, knowledge aplicado e entregaveis de forma mais imediata.
- Decisao tomada: os entregaveis seguem como eixo operacional, mas agora aparecem em uma area visualmente mais marcada e conectada ao valor do knowledge.

### Validacoes

- `source ~/.nvm/nvm.sh && nvm use 22 && npm run test:unit -- --run src/modules/projects/components/ProjectDeliverableTechnicalCard.spec.ts`: passou com 1 arquivo e 1 teste.
- `source ~/.nvm/nvm.sh && nvm use 22 && npm run type-check`: passou.
- `source ~/.nvm/nvm.sh && nvm use 22 && npm run build`: passou.
