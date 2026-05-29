import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import KnowledgeItemsList from './KnowledgeItemsList.vue'
import { useKnowledgeItemsStore } from '@/modules/knowledge-base/stores/knowledge-items.store'

vi.mock('@/shared/http/api-client', () => ({
  apiClient: {
    knowledgeBase: {
      list: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 12 }),
      search: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 12 }),
    },
  },
}))

const PassthroughStub = defineComponent({
  setup(_, { slots }) {
    return () => h('div', slots.default?.())
  },
})

describe('KnowledgeItemsList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders knowledge items and detail action', async () => {
    const store = useKnowledgeItemsStore()
    store.items = [
      {
        id: 'kb-1',
        organizationId: 'org-1',
        title: 'Padrao tecnico',
        type: 'technical_standard',
        status: 'published',
        tags: ['revisao'],
        createdBy: 'user-1',
        updatedBy: 'user-1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]
    store.total = 1
    vi.spyOn(store, 'listItems').mockResolvedValue(null)

    const wrapper = mount(KnowledgeItemsList, {
      global: {
        stubs: {
          KnowledgeItemCard: {
            props: ['item'],
            template: '<article>{{ item.title }}<a :href="`/knowledge-base/${item.id}`">Detalhes</a></article>',
          },
          VAlert: PassthroughStub,
          VBtn: PassthroughStub,
          VEmptyState: PassthroughStub,
          VPagination: PassthroughStub,
          VProgressLinear: PassthroughStub,
          VSelect: PassthroughStub,
          VTextField: PassthroughStub,
        },
      },
    })

    expect(wrapper.text()).toContain('Padrao tecnico')
    expect(wrapper.html()).toContain('/knowledge-base/kb-1')
  })
})
