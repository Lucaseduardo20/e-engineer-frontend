import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import DeliverableForm from './DeliverableForm.vue'

vi.mock('@/shared/http/api-client', () => ({
  apiClient: {
    organizations: {
      users: vi.fn().mockResolvedValue([]),
    },
  },
}))

const PassthroughStub = defineComponent({
  setup(_, { slots }) {
    return () => h('div', slots.default?.())
  },
})

describe('DeliverableForm', () => {
  it('emits a normalized deliverable payload', async () => {
    const wrapper = mount(DeliverableForm, {
      props: {
        projectId: 'p1',
      },
      global: {
        stubs: {
          VBtn: {
            template: '<button type="submit"><slot /></button>',
          },
          VCard: PassthroughStub,
          VCardActions: PassthroughStub,
          VCardText: PassthroughStub,
          VCardTitle: PassthroughStub,
          VDivider: PassthroughStub,
          VForm: {
            template: '<form @submit="$emit(`submit`, $event)"><slot /></form>',
          },
          VIcon: PassthroughStub,
          VSelect: PassthroughStub,
          VSpacer: PassthroughStub,
          VTextarea: {
            props: ['modelValue'],
            emits: ['update:modelValue'],
            template:
              '<textarea name="description" :value="modelValue" @input="$emit(`update:modelValue`, $event.target.value)" />',
          },
          VTextField: {
            props: ['modelValue', 'name'],
            emits: ['update:modelValue'],
            template:
              '<input :name="name" :value="modelValue" @input="$emit(`update:modelValue`, $event.target.value)" />',
          },
        },
      },
    })

    await wrapper.find('input[name="title"]').setValue(' Memorial descritivo ')
    await wrapper.find('textarea[name="description"]').setValue(' Revisao executiva ')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')?.[0]).toEqual([
      {
        projectId: 'p1',
        title: 'Memorial descritivo',
        description: 'Revisao executiva',
        dueDate: null,
        status: 'todo',
        type: 'technical_report',
        assignees: [],
      },
    ])
  })
})
