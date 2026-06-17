import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { describe, expect, it } from 'vitest'
import ProjectDetail from './ProjectDetail.vue'
import type {
  Deliverable,
  Project,
  ProjectKnowledgeRecommendation,
} from '@/shared/types/api-contracts'

const PassthroughStub = defineComponent({
  setup(_, { slots }) {
    return () => h('div', slots.default?.())
  },
})
const MenuStub = defineComponent({
  setup(_, { slots }) {
    return () =>
      h('div', [
        slots.activator?.({ props: {} }),
        slots.default?.(),
      ])
  },
})

describe('ProjectDetail', () => {
  it('renders the value-first tabs and inherited deliverable tags', () => {
    const project: Project = {
      id: 'project-1',
      name: 'UBS Vila Esperanca',
      status: 'active',
      organizationId: 'org-1',
      progress: 45,
      client: 'Prefeitura',
    }
    const deliverables: Deliverable[] = [
      {
        id: 'deliverable-1',
        projectId: 'project-1',
        title: 'Orcamento',
        status: 'in_progress',
        type: 'budget',
        assignees: ['Eng. Ana'],
        tags: [
          {
            id: 'tag-1',
            name: 'Orcamento',
            slug: 'orcamento',
            category: 'document_type',
            status: 'active',
          },
        ],
      },
    ]
    const knowledgeRecommendations: ProjectKnowledgeRecommendation[] = [
      {
        type: 'review_checklist',
        knowledgeItem: {
          id: 'knowledge-1',
          title: 'Checklist de orcamento',
          type: 'review_checklist',
          status: 'published',
          tags: [],
          updatedAt: Date.now(),
        },
        matchedTags: [
          {
            id: 'tag-1',
            name: 'Orcamento',
            slug: 'orcamento',
            category: 'document_type',
            status: 'active',
          },
        ],
        score: 13,
        reason: 'Combina com tags tecnicas dos entregaveis.',
        alreadyApplied: false,
      },
    ]

    const wrapper = mount(ProjectDetail, {
      props: {
        project,
        deliverables,
        documents: [],
        reviews: [],
        knowledgeItems: [],
        knowledgeRecommendations,
        auditLogs: [],
      },
      global: {
        stubs: {
          BaseStatusBadge: {
            props: ['kind'],
            template: '<span>{{ kind }}</span>',
          },
          DeliverablesBoard: PassthroughStub,
          DocumentUpload: PassthroughStub,
          ProjectDeliverableTechnicalCard: {
            props: ['deliverable'],
            template: '<article>{{ deliverable.title }}</article>',
          },
          ProjectKnowledgeSection: {
            template: '<section>Knowledge aplicado</section>',
          },
          TraceableLinkButton: PassthroughStub,
          VAlert: PassthroughStub,
          VBtn: PassthroughStub,
          VCard: PassthroughStub,
          VChip: PassthroughStub,
          VDialog: PassthroughStub,
          VEmptyState: PassthroughStub,
          VList: PassthroughStub,
          VListItem: PassthroughStub,
          VMenu: MenuStub,
          VProgressCircular: PassthroughStub,
          VSheet: PassthroughStub,
          VTab: PassthroughStub,
          VTabs: PassthroughStub,
          VTimeline: PassthroughStub,
          VTimelineItem: PassthroughStub,
          VWindow: PassthroughStub,
          VWindowItem: PassthroughStub,
        },
      },
    })

    expect(wrapper.text()).toContain('UBS Vila Esperanca')
    expect(wrapper.text()).toContain('Tags herdadas dos entregaveis')
    expect(wrapper.text()).toContain('Orcamento')
    expect(wrapper.text()).toContain('Visao geral')
    expect(wrapper.text()).toContain('Entregaveis')
    expect(wrapper.text()).toContain('Checklist de orcamento')
  })
})
