import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import LoginForm from '@/modules/auth/components/LoginForm.vue'

describe('LoginForm', () => {
  it('shows validation errors before submitting invalid credentials', async () => {
    const wrapper = mount(LoginForm, {
      props: {
        loading: false,
        error: null,
      },
    })

    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.text()).toContain('Informe um email valido.')
    expect(wrapper.text()).toContain('A senha deve ter pelo menos 8 caracteres.')
  })

  it('emits valid login credentials', async () => {
    const wrapper = mount(LoginForm, {
      props: {
        loading: false,
        error: null,
      },
    })

    await wrapper.find('input[name="email"]').setValue('engenharia@empresa.com')
    await wrapper.find('input[name="password"]').setValue('Senha123')
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.emitted('submit')).toEqual([
      [
        {
          email: 'engenharia@empresa.com',
          password: 'Senha123',
        },
      ],
    ])
  })
})

