import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { describe, expect, it } from 'vitest'
import DocumentUpload from './DocumentUpload.vue'

const InputStub = defineComponent({
  props: ['modelValue', 'label'],
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h('input', {
        'aria-label': props.label,
        value: props.modelValue ?? '',
        onInput: (event: Event) =>
          emit('update:modelValue', (event.target as HTMLInputElement).value),
      })
  },
})

const SelectStub = InputStub
const PassthroughStub = defineComponent({
  setup(_, { slots }) {
    return () => h('div', slots.default?.())
  },
})

describe('DocumentUpload', () => {
  it('emits document metadata from the form', async () => {
    const wrapper = mount(DocumentUpload, {
      props: {
        projects: [
          {
            id: 'project-1',
            name: 'Ponte Norte',
            status: 'active',
            organizationId: 'org-1',
            progress: 20,
          },
        ],
      },
      global: {
        stubs: {
          VBtn: {
            template: '<button @click="$emit(\'click\')"><slot /></button>',
          },
          VCard: PassthroughStub,
          VCardActions: PassthroughStub,
          VCardText: PassthroughStub,
          VCardTitle: PassthroughStub,
          VDivider: PassthroughStub,
          VFileInput: InputStub,
          VIcon: PassthroughStub,
          VSelect: SelectStub,
          VSpacer: PassthroughStub,
          VSwitch: InputStub,
          VTextField: InputStub,
          VTextarea: InputStub,
        },
      },
    })

    await wrapper.find('input[aria-label="Projeto tecnico"]').setValue('project-1')
    await wrapper.find('input[aria-label="Titulo tecnico"]').setValue('Memorial')
    await wrapper.find('input[aria-label="Tipo de documento"]').setValue('memorial_descritivo')
    await wrapper.find('input[aria-label="Status"]').setValue('draft')
    await wrapper.find('button').trigger('click')

    const submitEvents = wrapper.emitted('submit')
    expect(submitEvents).toBeTruthy()
    expect(submitEvents?.[0]?.[0]).toMatchObject({
      projectId: 'project-1',
      title: 'Memorial',
      type: 'memorial_descritivo',
      status: 'draft',
    })
  })
})
