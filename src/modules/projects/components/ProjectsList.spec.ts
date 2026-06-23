import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { describe, expect, it } from 'vitest'
import ProjectsList from './ProjectsList.vue'
import type { Project } from '@/shared/types/api-contracts'

const PassthroughStub = defineComponent({
  setup(_, { slots }) {
    return () => h('div', slots.default?.())
  },
})

const SelectStub = defineComponent({
  setup(_, { slots }) {
    return () => h('div', [slots.selection?.(), slots.default?.()])
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
          slots['item.name']?.({ item }),
          slots['item.status']?.({ item }),
          slots['item.progress']?.({ item }),
          slots['item.actions']?.({ item }),
        ]),
      )
  },
})

describe('ProjectsList', () => {
  it('renders project names and status labels', () => {
    const projects: Project[] = [
      {
        id: 'p1',
        name: 'Projeto X',
        status: 'active',
        organizationId: 'o1',
        progress: 42,
      },
    ]

    const wrapper = mount(ProjectsList, {
      props: { projects },
      global: {
        stubs: {
          VBtn: PassthroughStub,
          VCard: PassthroughStub,
          VCardTitle: PassthroughStub,
          VChip: PassthroughStub,
          VDataTable: DataTableStub,
          VIcon: PassthroughStub,
          VSelect: SelectStub,
          BasePagination: PassthroughStub,
          BaseStatusBadge: {
            template: '<span>Ativo</span>',
          },
          VProgressLinear: PassthroughStub,
          RouterLink: {
            template: '<a><slot /></a>',
          },
        },
      },
    })

    expect(wrapper.text()).toContain('Projeto X')
    expect(wrapper.text()).toContain('Ativo')
  })
})
