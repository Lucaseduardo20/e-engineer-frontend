import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { describe, expect, it } from 'vitest'
import DeliverablesList from './DeliverablesList.vue'
import type { Deliverable } from '@/shared/types/api-contracts'

const PassthroughStub = defineComponent({
  setup(_, { slots }) {
    return () => h('div', slots.default?.())
  },
})

const DataTableStub = defineComponent({
  props: {
    items: {
      type: Array,
      default: () => [],
    },
  },
  setup(props, { slots }) {
    return () =>
      h(
        'div',
        props.items.flatMap((item) => [
          slots['item.title']?.({ item }),
          slots['item.type']?.({ item }),
          slots['item.status']?.({ item }),
          slots['item.dueDate']?.({ item }),
          slots['item.actions']?.({ item }),
        ]),
      )
  },
})

describe('DeliverablesList', () => {
  it('renders deliverable technical information and edit actions', () => {
    const deliverables: Deliverable[] = [
      {
        id: 'd1',
        projectId: 'p1',
        title: 'Projeto arquitetonico',
        description: 'Compatibilizado com memorial',
        status: 'in_progress',
        type: 'architectural_project',
        dueDate: 1781222400000,
        assignees: ['Lucas Eduardo'],
      },
    ]

    const wrapper = mount(DeliverablesList, {
      props: { deliverables },
      global: {
        stubs: {
          VBtn: PassthroughStub,
          VCard: PassthroughStub,
          VCardTitle: PassthroughStub,
          VDataTable: DataTableStub,
          VIcon: PassthroughStub,
          VSelect: PassthroughStub,
          VChip: PassthroughStub,
          VExpandTransition: PassthroughStub,
          ExpandTransition: PassthroughStub,
          BasePagination: PassthroughStub,
          BaseStatusBadge: {
            template: '<span>Em producao</span>',
          },
        },
      },
    })

    expect(wrapper.text()).toContain('Projeto arquitetonico')
    expect(wrapper.text()).toContain('Projeto arquitetonico')
    expect(wrapper.text()).toContain('Lucas Eduardo')
    expect(wrapper.text()).toContain('Em producao')
    expect(wrapper.text()).toContain('Editar')
  })
})
