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
