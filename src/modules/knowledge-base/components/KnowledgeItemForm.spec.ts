import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { describe, expect, it } from 'vitest'
import KnowledgeItemForm from './KnowledgeItemForm.vue'

const InputStub = defineComponent({
  props: ['modelValue', 'label'],
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h('input', {
        'aria-label': props.label,
        value: props.modelValue ?? '',
        onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value),
      })
  },
})

const PassthroughStub = defineComponent({
  setup(_, { slots }) {
    return () => h('div', slots.default?.())
  },
})

describe('KnowledgeItemForm', () => {
  it('emits a valid payload with lesson learned content', async () => {
    const wrapper = mount(KnowledgeItemForm, {
      global: {
        stubs: {
          VAlert: PassthroughStub,
          VBtn: { template: '<button type="submit"><slot /></button>' },
          VForm: { template: '<form @submit="$emit(\'submit\', $event)"><slot /></form>' },
          VSelect: InputStub,
          VTextField: InputStub,
          VTextarea: InputStub,
        },
      },
    })

    await wrapper.find('input[aria-label="Titulo"]').setValue('Validar acessibilidade')
    await wrapper.find('input[aria-label="Tipo"]').setValue('lesson_learned')
    await wrapper.find('input[aria-label="Tags separadas por virgula"]').setValue('acessibilidade, reforma')
    await wrapper
      .find('input[aria-label^="Conteudo especifico"]')
      .setValue('{"problem":"Retrabalho","recommendation":"Validar antes"}')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')?.[0]?.[0]).toMatchObject({
      title: 'Validar acessibilidade',
      type: 'lesson_learned',
      tags: ['acessibilidade', 'reforma'],
      content: { problem: 'Retrabalho', recommendation: 'Validar antes' },
    })
  })

  it('blocks empty title', async () => {
    const wrapper = mount(KnowledgeItemForm, {
      global: {
        stubs: {
          VAlert: PassthroughStub,
          VBtn: { template: '<button type="submit"><slot /></button>' },
          VForm: { template: '<form @submit="$emit(\'submit\', $event)"><slot /></form>' },
          VSelect: InputStub,
          VTextField: InputStub,
          VTextarea: InputStub,
        },
      },
    })

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeUndefined()
  })
})
