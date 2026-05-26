<script setup lang="ts">
import { computed, reactive } from 'vue'
import { z } from 'zod'
import type { LoginCredentials } from '@/modules/auth/types/auth.types'

defineProps<{
  loading: boolean
  error: string | null
}>()

const emit = defineEmits<{
  submit: [credentials: LoginCredentials]
}>()

const loginSchema = z.object({
  email: z.string().email('Informe um email valido.'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.'),
})

type LoginField = keyof LoginCredentials

const formData = reactive<LoginCredentials>({
  email: '',
  password: '',
})

const errors = reactive<Partial<Record<LoginField, string>>>({})

function validateField(field: LoginField) {
  const result = loginSchema.shape[field].safeParse(formData[field])

  if (result.success) {
    delete errors[field]
    return
  }

  errors[field] = result.error.issues[0]?.message
}

function validateForm() {
  const result = loginSchema.safeParse(formData)

  errors.email = undefined
  errors.password = undefined

  if (result.success) {
    return true
  }

  for (const issue of result.error.issues) {
    const field = issue.path[0] as LoginField | undefined

    if (field) {
      errors[field] = issue.message
    }
  }

  return false
}

const isFormValid = computed(() => {
  return Boolean(formData.email && formData.password && !errors.email && !errors.password)
})

function handleSubmit() {
  if (!validateForm()) {
    return
  }

  emit('submit', {
    email: formData.email.trim(),
    password: formData.password,
  })
}
</script>

<template>
  <form class="login-form" novalidate @submit.prevent="handleSubmit">
    <div class="login-form__field">
      <label for="auth-email">Email corporativo</label>
      <input
        id="auth-email"
        v-model="formData.email"
        autocomplete="email"
        :aria-invalid="Boolean(errors.email)"
        :disabled="loading"
        inputmode="email"
        name="email"
        placeholder="engenharia@empresa.com"
        type="email"
        @blur="validateField('email')"
        @input="errors.email = undefined"
      />
      <p v-if="errors.email" class="login-form__error">{{ errors.email }}</p>
    </div>

    <div class="login-form__field">
      <label for="auth-password">Senha</label>
      <input
        id="auth-password"
        v-model="formData.password"
        autocomplete="current-password"
        :aria-invalid="Boolean(errors.password)"
        :disabled="loading"
        name="password"
        placeholder="Digite sua senha"
        type="password"
        @blur="validateField('password')"
        @input="errors.password = undefined"
      />
      <p v-if="errors.password" class="login-form__error">{{ errors.password }}</p>
    </div>

    <p v-if="error" class="login-form__server-error" role="alert">{{ error }}</p>

    <button class="login-form__submit" type="submit" :disabled="loading || !isFormValid">
      {{ loading ? 'Entrando...' : 'Entrar no painel' }}
    </button>
  </form>
</template>

<style scoped>
.login-form {
  display: grid;
  gap: 1rem;
}

.login-form__field {
  display: grid;
  gap: 0.45rem;
}

label {
  color: #253040;
  font-size: 0.875rem;
  font-weight: 800;
}

input {
  width: 100%;
  min-height: 2.875rem;
  border: 1px solid #cdd5df;
  border-radius: 0.5rem;
  background: #ffffff;
  color: #172033;
  font: inherit;
  padding: 0 0.875rem;
}

input:focus {
  border-color: #1d6f61;
  box-shadow: 0 0 0 3px rgb(29 111 97 / 0.14);
  outline: none;
}

input:disabled {
  background: #f5f7fa;
  cursor: not-allowed;
}

input[aria-invalid='true'] {
  border-color: #d92d20;
}

.login-form__error,
.login-form__server-error {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.4;
}

.login-form__error {
  color: #b42318;
}

.login-form__server-error {
  border: 1px solid #f3b7b7;
  border-radius: 0.5rem;
  background: #fff1f1;
  color: #b42318;
  padding: 0.75rem;
}

.login-form__submit {
  min-height: 2.875rem;
  border: 1px solid #1d6f61;
  border-radius: 0.5rem;
  background: #1d6f61;
  color: #ffffff;
  font: inherit;
  font-weight: 900;
}

.login-form__submit:disabled {
  border-color: #b7c2cc;
  background: #b7c2cc;
  cursor: not-allowed;
}
</style>
