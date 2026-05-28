<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import BasePageHeader from '@/shared/components/BasePageHeader.vue'
import { apiClient } from '@/shared/http/api-client'
import { getApiErrorMessage } from '@/shared/http/api-error'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useOrganizationsStore } from '@/modules/organizations/stores/organizations.store'
import { permissions } from '@/shared/auth/rbac'
import type { PriorityLevel, PriorityTargetType, User } from '@/shared/types/api-contracts'

const organizationsStore = useOrganizationsStore()
const authStore = useAuthStore()

const activeTab = ref('profile')
const selectedMember = ref<User | null>(null)
const memberDialog = ref(false)
const cloneDialog = ref(false)
const priorityDialog = ref(false)
const selectedPriorityUser = ref<User | null>(null)
const sessionError = ref<string | null>(null)
const isSessionChanging = ref(false)

const roleOptions = [
  { title: 'Owner', value: 'owner' },
  { title: 'Admin', value: 'admin' },
  { title: 'Gestor', value: 'manager' },
  { title: 'Gerente de projeto', value: 'project_manager' },
  { title: 'Orcamentista', value: 'estimator' },
  { title: 'Financeiro', value: 'finance' },
  { title: 'Membro', value: 'member' },
]

const targetTypeOptions: Array<{ title: string; value: PriorityTargetType }> = [
  { title: 'Projeto', value: 'project' },
  { title: 'Entregavel', value: 'deliverable' },
  { title: 'Revisao', value: 'review' },
  { title: 'Documento', value: 'document' },
]

const priorityOptions: Array<{ title: string; value: PriorityLevel }> = [
  { title: 'Normal', value: 'normal' },
  { title: 'Alta', value: 'high' },
  { title: 'Urgente', value: 'urgent' },
]

const profileForm = reactive({
  name: '',
  legalName: '',
})

const memberForm = reactive({
  fullName: '',
  email: '',
  password: '',
  role: 'member',
})

const cloneForm = reactive({
  fullName: '',
  email: '',
  password: '',
})

const priorityForm = reactive({
  targetType: 'project' as PriorityTargetType,
  targetId: '',
  priority: 'high' as PriorityLevel,
  reason: '',
})

const organizationInitials = computed(() => {
  const name = organizationsStore.currentOrganization?.name ?? 'E Engineer'
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')
})

const roleSummary = computed(() =>
  organizationsStore.users.reduce<Record<string, number>>((summary, user) => {
    const role = user.roles[0] ?? 'member'
    summary[role] = (summary[role] ?? 0) + 1
    return summary
  }, {}),
)

const requestedPriorityCount = computed(
  () =>
    organizationsStore.priorityRequests.filter((request) => request.status === 'requested').length,
)

onMounted(async () => {
  await organizationsStore.refreshManagement()
  syncProfileForm()
})

function syncProfileForm() {
  profileForm.name = organizationsStore.currentOrganization?.name ?? ''
  profileForm.legalName = ''
}

function roleLabel(role: string) {
  return roleOptions.find((option) => option.value === role)?.title ?? role
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    requested: 'Solicitada',
    applied: 'Aplicada',
    rejected: 'Negada',
  }

  return labels[status] ?? status
}

function targetLabel(targetType: string) {
  return targetTypeOptions.find((option) => option.value === targetType)?.title ?? targetType
}

function openCreateMember() {
  selectedMember.value = null
  Object.assign(memberForm, {
    fullName: '',
    email: '',
    password: '',
    role: 'member',
  })
  memberDialog.value = true
}

function openEditMember(user: User) {
  selectedMember.value = user
  Object.assign(memberForm, {
    fullName: user.fullName,
    email: user.email,
    password: '',
    role: user.roles[0] ?? 'member',
  })
  memberDialog.value = true
}

function openCloneMember(user: User) {
  selectedMember.value = user
  Object.assign(cloneForm, {
    fullName: `${user.fullName} copia`,
    email: '',
    password: '',
  })
  cloneDialog.value = true
}

function openPriorityDialog(user: User) {
  selectedPriorityUser.value = user
  Object.assign(priorityForm, {
    targetType: 'project',
    targetId: '',
    priority: 'high',
    reason: '',
  })
  priorityDialog.value = true
}

async function saveProfile() {
  await organizationsStore.updateOrganization({
    name: profileForm.name,
    legalName: profileForm.legalName || null,
  })
}

async function onLogoFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]

  if (file) {
    await organizationsStore.uploadLogo(file)
  }
}

async function saveMember() {
  const payload = {
    fullName: memberForm.fullName,
    email: memberForm.email,
    password: memberForm.password || undefined,
    role: memberForm.role,
  }

  if (selectedMember.value) {
    await organizationsStore.updateUser(selectedMember.value.id, payload)
  } else {
    if (!payload.password) {
      organizationsStore.error = 'Informe uma senha temporaria para o novo colaborador.'
      return
    }

    await organizationsStore.createUser({
      ...payload,
      password: payload.password,
    })
  }

  if (!organizationsStore.error) {
    memberDialog.value = false
  }
}

async function onAvatarFileChange(user: User, event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]

  if (file) {
    await organizationsStore.uploadUserAvatar(user.id, file)
  }
}

async function cloneMember() {
  if (!selectedMember.value) {
    return
  }

  await organizationsStore.cloneUser(selectedMember.value.id, cloneForm)

  if (!organizationsStore.error) {
    cloneDialog.value = false
  }
}

async function createPriorityRequest() {
  await organizationsStore.createPriorityRequest({
    targetType: priorityForm.targetType,
    targetId: priorityForm.targetId,
    requestedForUserId: selectedPriorityUser.value?.id ?? null,
    priority: priorityForm.priority,
    reason: priorityForm.reason || null,
  })

  if (!organizationsStore.error) {
    priorityDialog.value = false
  }
}

async function impersonateUser(user: User) {
  sessionError.value = null
  isSessionChanging.value = true

  try {
    const session = await apiClient.auth.impersonate({
      organizationId: organizationsStore.currentOrganization?.id ?? user.organizationId ?? '',
      userId: user.id,
    })
    authStore.replaceSession(session.token, session.user)
    await organizationsStore.refreshManagement()
  } catch (error) {
    sessionError.value = getApiErrorMessage(error, 'Nao foi possivel incorporar usuario.')
  } finally {
    isSessionChanging.value = false
  }
}
</script>

<template>
  <v-container fluid class="organizations-page pa-0">
    <BasePageHeader
      eyebrow="Administracao"
      title="Organizacao"
      description="Gerencie identidade, colaboradores, prioridade operacional e sessoes de suporte."
      :breadcrumbs="['Dashboard', 'Organizacao']"
    />

    <v-alert v-if="organizationsStore.error" type="error" variant="tonal">
      {{ organizationsStore.error }}
    </v-alert>
    <v-alert v-if="sessionError" type="error" variant="tonal">
      {{ sessionError }}
    </v-alert>

    <v-progress-linear
      v-if="organizationsStore.isLoading"
      indeterminate
      color="teal"
      rounded
      class="organizations-page__loading"
    />

    <section class="organizations-page__overview">
      <v-sheet class="organizations-page__identity" border rounded="lg">
        <v-avatar color="teal" variant="tonal" size="60">
          <v-img
            v-if="organizationsStore.currentOrganization?.logoUrl"
            :src="organizationsStore.currentOrganization.logoUrl"
            :alt="organizationsStore.currentOrganization.name"
          />
          <span v-else>{{ organizationInitials }}</span>
        </v-avatar>
        <div>
          <p class="organizations-page__eyebrow">Tenant ativo</p>
          <h2>{{ organizationsStore.currentOrganization?.name ?? 'Organizacao' }}</h2>
          <p>{{ organizationsStore.currentOrganization?.slug ?? 'sem-slug' }}</p>
        </div>
      </v-sheet>

      <v-sheet class="organizations-page__metric" border rounded="lg">
        <span>Colaboradores</span>
        <strong>{{ organizationsStore.users.length }}</strong>
      </v-sheet>

      <v-sheet class="organizations-page__metric" border rounded="lg">
        <span>Administracao</span>
        <strong>{{ organizationsStore.ownerUsers.length }}</strong>
      </v-sheet>

      <v-sheet
        class="organizations-page__metric organizations-page__metric--warm"
        border
        rounded="lg"
      >
        <span>Prioridades abertas</span>
        <strong>{{ requestedPriorityCount }}</strong>
      </v-sheet>
    </section>

    <v-sheet class="organizations-page__workspace" border rounded="lg">
      <v-tabs v-model="activeTab" color="teal" density="comfortable">
        <v-tab value="profile"><v-icon icon="$edit" start size="16" />Perfil</v-tab>
        <v-tab value="members"><v-icon icon="$info" start size="16" />Colaboradores</v-tab>
      </v-tabs>

      <v-window v-model="activeTab">
        <v-window-item value="profile">
          <div class="organizations-page__tab-grid organizations-page__tab-grid--profile">
            <form class="organizations-page__form" @submit.prevent="saveProfile">
              <v-text-field
                v-model="profileForm.name"
                label="Nome da organizacao"
                variant="outlined"
                :disabled="!authStore.can(permissions.organization.updateProfile)"
              />
              <v-text-field
                v-model="profileForm.legalName"
                label="Razao social"
                variant="outlined"
                :disabled="!authStore.can(permissions.organization.updateProfile)"
              />
              <div class="organizations-page__actions">
                <v-btn
                  v-if="authStore.can(permissions.organization.updateProfile)"
                  color="teal"
                  type="submit"
                  :loading="organizationsStore.isSaving"
                >
                  <v-icon icon="$success" start size="16" />Salvar perfil
                </v-btn>
              </div>
            </form>

            <div class="organizations-page__upload">
              <v-avatar color="teal" variant="tonal" size="96">
                <v-img
                  v-if="organizationsStore.currentOrganization?.logoUrl"
                  :src="organizationsStore.currentOrganization.logoUrl"
                  :alt="organizationsStore.currentOrganization.name"
                />
                <span v-else>{{ organizationInitials }}</span>
              </v-avatar>
              <v-file-input
                v-if="authStore.can(permissions.organization.updateLogo)"
                accept="image/*"
                label="Logo da organizacao"
                prepend-icon=""
                variant="outlined"
                show-size
                @change="onLogoFileChange"
              />
            </div>
          </div>
        </v-window-item>

        <v-window-item value="members">
          <div class="organizations-page__panel-header">
            <div>
              <p class="organizations-page__eyebrow">Equipe</p>
              <h2>Colaboradores</h2>
            </div>
            <v-btn
              v-if="authStore.can(permissions.organization.membersManage)"
              color="teal"
              @click="openCreateMember"
            >
              <v-icon icon="$success" start size="16" />Novo colaborador
            </v-btn>
          </div>

          <div class="organizations-page__table-wrap">
            <table class="organizations-page__table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Papel</th>
                  <th>Status</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in organizationsStore.users" :key="user.id">
                  <td>
                    <div class="organizations-page__user">
                      <v-avatar color="indigo" variant="tonal" size="34">
                        <v-img v-if="user.avatarUrl" :src="user.avatarUrl" :alt="user.fullName" />
                        <span v-else>{{ user.fullName.slice(0, 1).toUpperCase() }}</span>
                      </v-avatar>
                      <span>{{ user.fullName }}</span>
                    </div>
                  </td>
                  <td>{{ user.email }}</td>
                  <td>
                    <v-chip
                      :color="user.roles[0] === 'owner' ? 'amber' : 'teal'"
                      variant="tonal"
                      size="small"
                    >
                      {{ roleLabel(user.roles[0] ?? 'member') }}
                    </v-chip>
                  </td>
                  <td>
                    <div class="organizations-page__status-stack">
                      <v-chip
                        v-if="user.isPlatformAdmin"
                        color="warning"
                        variant="tonal"
                        size="x-small"
                      >
                        Super-admin
                      </v-chip>
                      <v-chip color="green" variant="tonal" size="x-small">Ativo</v-chip>
                    </div>
                  </td>
                  <td>
                    <div class="organizations-page__row-actions">
                      <v-tooltip text="Editar dados, email, senha e papel">
                        <template #activator="{ props: tooltipProps }">
                          <v-btn
                            v-if="authStore.can(permissions.organization.membersManage)"
                            v-bind="tooltipProps"
                            icon="$edit"
                            size="small"
                            color="teal"
                            variant="tonal"
                            @click="openEditMember(user)"
                          />
                        </template>
                      </v-tooltip>
                      <v-tooltip text="Clonar colaborador com novo nome e email">
                        <template #activator="{ props: tooltipProps }">
                          <v-btn
                            v-if="authStore.can(permissions.organization.membersClone)"
                            v-bind="tooltipProps"
                            size="small"
                            color="indigo"
                            variant="tonal"
                            @click="openCloneMember(user)"
                          >
                            Clonar
                          </v-btn>
                        </template>
                      </v-tooltip>
                      <v-tooltip text="Enviar nova foto do colaborador">
                        <template #activator="{ props: tooltipProps }">
                          <label
                            v-if="authStore.can(permissions.organization.membersManage)"
                            v-bind="tooltipProps"
                            class="organizations-page__file-action"
                          >
                            <v-icon icon="$upload" size="15" />
                            Foto
                            <input
                              type="file"
                              accept="image/*"
                              @change="onAvatarFileChange(user, $event)"
                            />
                          </label>
                        </template>
                      </v-tooltip>
                      <v-tooltip text="Cadastrar prioridade vinculada a este colaborador">
                        <template #activator="{ props: tooltipProps }">
                          <v-btn
                            v-if="authStore.can(permissions.priority.request)"
                            v-bind="tooltipProps"
                            size="small"
                            color="amber"
                            variant="tonal"
                            @click="openPriorityDialog(user)"
                          >
                            Priorizar
                          </v-btn>
                        </template>
                      </v-tooltip>
                      <v-tooltip
                        v-if="authStore.can(permissions.platform.impersonate)"
                        text="Incorporar este usuario para simular suas permissoes"
                      >
                        <template #activator="{ props: tooltipProps }">
                          <v-btn
                            v-bind="tooltipProps"
                            size="small"
                            color="deep-purple"
                            variant="tonal"
                            :loading="isSessionChanging"
                            @click="impersonateUser(user)"
                          >
                            Incorporar
                          </v-btn>
                        </template>
                      </v-tooltip>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="organizations-page__roles">
            <div
              v-for="(count, role) in roleSummary"
              :key="role"
              class="organizations-page__role-row"
            >
              <span>{{ roleLabel(role) }}</span>
              <strong>{{ count }}</strong>
            </div>
          </div>
        </v-window-item>
      </v-window>

      <section class="organizations-page__priority-board">
        <div class="organizations-page__panel-header">
          <div>
            <p class="organizations-page__eyebrow">Fila operacional</p>
            <h2>Prioridades recentes</h2>
          </div>
          <v-chip color="amber" variant="tonal">{{ requestedPriorityCount }} abertas</v-chip>
        </div>
        <div class="organizations-page__priority-list">
          <div
            v-for="priorityRequest in organizationsStore.priorityRequests"
            :key="priorityRequest.id"
            class="organizations-page__priority"
          >
            <div>
              <strong>{{ targetLabel(priorityRequest.targetType) }}</strong>
              <span>{{ priorityRequest.targetId }}</span>
            </div>
            <span>{{
              priorityRequest.requestedForUserId ? 'Usuario vinculado' : 'Sem usuario'
            }}</span>
            <v-chip
              :color="priorityRequest.priority === 'urgent' ? 'red' : 'amber'"
              variant="tonal"
              size="small"
            >
              {{ priorityRequest.priority }}
            </v-chip>
            <v-chip color="teal" variant="tonal" size="small">
              {{ statusLabel(priorityRequest.status) }}
            </v-chip>
            <div
              v-if="priorityRequest.status === 'requested'"
              class="organizations-page__row-actions"
            >
              <v-tooltip text="Aplicar prioridade solicitada">
                <template #activator="{ props: tooltipProps }">
                  <v-btn
                    v-if="authStore.can(permissions.priority.apply)"
                    v-bind="tooltipProps"
                    size="small"
                    color="teal"
                    variant="tonal"
                    @click="organizationsStore.decidePriorityRequest(priorityRequest.id, 'apply')"
                  >
                    Aplicar
                  </v-btn>
                </template>
              </v-tooltip>
              <v-tooltip text="Negar prioridade solicitada">
                <template #activator="{ props: tooltipProps }">
                  <v-btn
                    v-if="authStore.can(permissions.priority.apply)"
                    v-bind="tooltipProps"
                    size="small"
                    color="red"
                    variant="text"
                    @click="organizationsStore.decidePriorityRequest(priorityRequest.id, 'reject')"
                  >
                    Negar
                  </v-btn>
                </template>
              </v-tooltip>
            </div>
          </div>
          <p
            v-if="organizationsStore.priorityRequests.length === 0"
            class="organizations-page__empty"
          >
            Nenhuma prioridade registrada.
          </p>
        </div>
      </section>
    </v-sheet>

    <v-dialog v-model="memberDialog" max-width="560">
      <v-card>
        <v-card-title>{{
          selectedMember ? 'Editar colaborador' : 'Novo colaborador'
        }}</v-card-title>
        <v-card-text class="organizations-page__dialog-form">
          <v-text-field v-model="memberForm.fullName" label="Nome" variant="outlined" />
          <v-text-field v-model="memberForm.email" label="Email" variant="outlined" />
          <v-text-field
            v-model="memberForm.password"
            :label="selectedMember ? 'Nova senha' : 'Senha temporaria'"
            type="password"
            variant="outlined"
          />
          <v-select
            v-model="memberForm.role"
            :items="roleOptions"
            label="Papel"
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="memberDialog = false">Cancelar</v-btn>
          <v-btn color="teal" :loading="organizationsStore.isSaving" @click="saveMember"
            >Salvar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="cloneDialog" max-width="520">
      <v-card>
        <v-card-title>Clonar colaborador</v-card-title>
        <v-card-text class="organizations-page__dialog-form">
          <v-text-field
            v-model="cloneForm.fullName"
            label="Nome do novo usuario"
            variant="outlined"
          />
          <v-text-field v-model="cloneForm.email" label="Email unico" variant="outlined" />
          <v-text-field
            v-model="cloneForm.password"
            label="Senha temporaria"
            type="password"
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="cloneDialog = false">Cancelar</v-btn>
          <v-btn color="teal" :loading="organizationsStore.isSaving" @click="cloneMember"
            >Clonar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="priorityDialog" max-width="560">
      <v-card>
        <v-card-title>Priorizar trabalho</v-card-title>
        <v-card-text class="organizations-page__dialog-form">
          <v-alert v-if="selectedPriorityUser" type="info" variant="tonal" density="compact">
            Prioridade vinculada a {{ selectedPriorityUser.fullName }}.
          </v-alert>
          <v-select
            v-model="priorityForm.targetType"
            :items="targetTypeOptions"
            label="Vincular com"
            variant="outlined"
          />
          <v-text-field
            v-model="priorityForm.targetId"
            label="ID do projeto, entregavel, documento ou revisao"
            variant="outlined"
          />
          <v-select
            v-model="priorityForm.priority"
            :items="priorityOptions"
            label="Nivel de prioridade"
            variant="outlined"
          />
          <v-textarea v-model="priorityForm.reason" label="Motivo" rows="3" variant="outlined" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="priorityDialog = false">Cancelar</v-btn>
          <v-btn
            color="amber"
            :loading="organizationsStore.isSaving"
            @click="createPriorityRequest"
          >
            Cadastrar prioridade
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.organizations-page {
  display: grid;
  gap: 1.25rem;
}

.organizations-page__loading {
  margin-top: -0.25rem;
}

.organizations-page__overview {
  display: grid;
  grid-template-columns: minmax(18rem, 1.7fr) repeat(3, minmax(10rem, 1fr));
  gap: 1rem;
}

.organizations-page__identity,
.organizations-page__metric,
.organizations-page__workspace {
  background: #ffffff;
  border-color: #d7e4df;
}

.organizations-page__identity {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
}

.organizations-page__identity h2,
.organizations-page__workspace h2 {
  margin: 0;
  color: #123c32;
  font-size: 1.05rem;
  line-height: 1.25;
}

.organizations-page__identity p {
  margin: 0.25rem 0 0;
  color: #667085;
  overflow-wrap: anywhere;
}

.organizations-page__eyebrow {
  margin: 0 0 0.35rem;
  color: #1d6f61;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.organizations-page__metric {
  display: grid;
  gap: 0.5rem;
  padding: 1rem;
}

.organizations-page__metric--warm strong {
  color: #9a3412;
}

.organizations-page__metric span {
  color: #667085;
  font-size: 0.875rem;
}

.organizations-page__metric strong {
  color: #123c32;
  font-size: 2rem;
  line-height: 1;
}

.organizations-page__workspace {
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.organizations-page__tab-grid {
  display: grid;
  grid-template-columns: minmax(18rem, 0.75fr) minmax(0, 1.25fr);
  gap: 1rem;
  padding-top: 1rem;
  align-items: start;
}

.organizations-page__tab-grid--profile {
  grid-template-columns: minmax(18rem, 1fr) minmax(16rem, 0.7fr);
}

.organizations-page__form,
.organizations-page__upload,
.organizations-page__dialog-form {
  display: grid;
  gap: 0.85rem;
}

.organizations-page__upload {
  justify-items: start;
  padding: 1rem;
  border: 1px solid #e3ece8;
  border-radius: 0.5rem;
  background: #f8fbfa;
}

.organizations-page__actions,
.organizations-page__panel-header,
.organizations-page__row-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.organizations-page__panel-header {
  justify-content: space-between;
}

.organizations-page__table-wrap {
  overflow-x: auto;
}

.organizations-page__table {
  width: 100%;
  min-width: 48rem;
  border-collapse: separate;
  border-spacing: 0 0.45rem;
}

.organizations-page__table th,
.organizations-page__table td {
  padding: 0.85rem;
  color: #344054;
  text-align: left;
  vertical-align: middle;
}

.organizations-page__table th {
  border-bottom: 1px solid #d7e4df;
  color: #667085;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
}

.organizations-page__table tbody tr {
  background: #ffffff;
  box-shadow: inset 0 0 0 1px #dfeae6;
}

.organizations-page__table tbody tr:nth-child(odd) {
  background: #f7fbf9;
}

.organizations-page__table tbody tr:hover {
  background: #eef8f4;
}

.organizations-page__table tbody td:first-child {
  border-bottom-left-radius: 0.5rem;
  border-top-left-radius: 0.5rem;
}

.organizations-page__table tbody td:last-child {
  border-bottom-right-radius: 0.5rem;
  border-top-right-radius: 0.5rem;
}

.organizations-page__user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #123c32;
  font-weight: 650;
}

.organizations-page__status-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.organizations-page__file-action {
  display: inline-flex;
  min-height: 2rem;
  align-items: center;
  gap: 0.3rem;
  padding: 0 0.7rem;
  border: 1px solid #b7c7e8;
  border-radius: 999px;
  background: #f2f5ff;
  color: #2447a8;
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 700;
}

.organizations-page__file-action input {
  display: none;
}

.organizations-page__file-action:hover {
  background: #e6ecff;
}

.organizations-page__roles,
.organizations-page__priority-list,
.organizations-page__priority-board {
  display: grid;
  gap: 0.75rem;
  margin-top: 1rem;
}

.organizations-page__priority-board {
  border-top: 1px solid #e3ece8;
  padding-top: 1rem;
}

.organizations-page__role-row,
.organizations-page__priority {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem;
  border: 1px solid #e3ece8;
  border-radius: 0.5rem;
  color: #344054;
}

.organizations-page__priority > div:first-child {
  display: grid;
  gap: 0.2rem;
  min-width: 0;
}

.organizations-page__priority span {
  color: #667085;
  overflow-wrap: anywhere;
}

.organizations-page__role-row strong {
  color: #123c32;
}

.organizations-page__empty {
  color: #667085;
  text-align: center;
}

@media (max-width: 1080px) {
  .organizations-page__overview,
  .organizations-page__tab-grid,
  .organizations-page__tab-grid--profile {
    grid-template-columns: 1fr;
  }
}
</style>
