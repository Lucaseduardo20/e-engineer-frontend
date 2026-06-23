import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { describe, expect, it } from 'vitest'
import ReviewForm from './ReviewForm.vue'

const InputStub = defineComponent({
  props: ['modelValue', 'label'],
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h('input', {
        'aria-label': props.label,
        value: Array.isArray(props.modelValue)
          ? props.modelValue.join(',')
          : (props.modelValue ?? ''),
        onInput: (event: Event) => {
          const value = (event.target as HTMLInputElement).value
          emit('update:modelValue', props.label === 'Revisores' ? value.split(',') : value)
        },
      })
  },
})

const PassthroughStub = defineComponent({
  setup(_, { slots }) {
    return () => h('div', slots.default?.())
  },
})

describe('ReviewForm', () => {
  it('emits review request payload', async () => {
    const wrapper = mount(ReviewForm, {
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
        users: [
          {
            id: 'user-2',
            fullName: 'Leonardo',
            email: 'leonardo@engflow.local',
            roles: [],
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
          VIcon: PassthroughStub,
          VSelect: InputStub,
          VSpacer: PassthroughStub,
          VTextField: InputStub,
          VTextarea: InputStub,
        },
      },
    })

    await wrapper.find('input[aria-label="Projeto tecnico"]').setValue('project-1')
    await wrapper.find('input[aria-label="Revisores"]').setValue('user-2')
    await wrapper.find('input[aria-label="Descricao da revisao"]').setValue('Revisar memorial.')
    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('submit')?.[0]?.[0]).toMatchObject({
      projectId: 'project-1',
      reviewers: ['user-2'],
      comment: 'Revisar memorial.',
    })
  })
})
