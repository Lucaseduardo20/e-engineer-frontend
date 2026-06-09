import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { describe, expect, it } from 'vitest'
import ProjectDeliverableTechnicalCard from './ProjectDeliverableTechnicalCard.vue'
import type {
  Deliverable,
  DocumentSummary,
  ProjectKnowledgeItem,
  ReviewSummary,
} from '@/shared/types/api-contracts'

const PassthroughStub = defineComponent({
  setup(_, { slots }) {
    return () => h('div', slots.default?.())
  },
})

const SelectStub = defineComponent({
  props: {
    modelValue: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue'],
  setup(_, { emit }) {
    return () =>
      h(
        'button',
        {
          type: 'button',
          onClick: () => emit('update:modelValue', 'done'),
        },
        'Atualizar status',
      )
  },
})

describe('ProjectDeliverableTechnicalCard', () => {
  it('renders operational links and emits status updates', async () => {
    const deliverable: Deliverable = {
      id: 'deliverable-1',
      projectId: 'project-1',
      title: 'Projeto estrutural',
      description: 'Dimensionamento e detalhamento estrutural.',
      dueDate: Date.now() - 86_400_000,
      status: 'in_progress',
      type: 'structural_project',
      assignees: ['Eng. Ana'],
    }
    const documents: DocumentSummary[] = [
      {
        id: 'document-1',
        projectId: 'project-1',
        deliverableId: 'deliverable-1',
        title: 'Memorial estrutural',
        type: 'projeto_estrutural',
        status: 'approved',
        updatedAt: Date.now(),
        officialVersion: {
          id: 'version-1',
          documentId: 'document-1',
          revision: 'R01',
          fileName: 'memorial.pdf',
          filePath: 's3://local/memorial.pdf',
          uploadedBy: 'user-1',
          uploadedAt: Date.now(),
          isOfficial: true,
          status: 'approved',
        },
      },
    ]
    const reviews: ReviewSummary[] = [
      {
        id: 'review-1',
        projectId: 'project-1',
        deliverableId: 'deliverable-1',
        status: 'rejected',
        requestedBy: 'coord-1',
        reviewers: [],
        comment: 'Revisar premissas de carga',
      },
    ]
    const knowledgeItems: ProjectKnowledgeItem[] = [
      {
        relationId: 'relation-1',
        relationType: 'applies_to',
        linkedAt: Date.now(),
        linkedBy: 'coord-1',
        knowledgeItem: {
          id: 'knowledge-1',
          title: 'Padrao estrutural para UBS',
          description: 'Referencia estrutural reutilizavel.',
          type: 'technical_standard',
          status: 'published',
          tags: ['estrutural'],
          updatedAt: Date.now(),
        },
      },
    ]

    const wrapper = mount(ProjectDeliverableTechnicalCard, {
      props: {
        deliverable,
        documents,
        reviews,
        knowledgeItems,
      },
      global: {
        stubs: {
          BaseStatusBadge: {
            props: ['kind'],
            template: '<span>{{ kind }}</span>',
          },
          VAlert: PassthroughStub,
          VBtn: PassthroughStub,
          VChip: PassthroughStub,
          VEmptyState: PassthroughStub,
          VSelect: SelectStub,
          VSheet: PassthroughStub,
        },
      },
    })

    expect(wrapper.text()).toContain('Projeto estrutural')
    expect(wrapper.text()).toContain('Eng. Ana')
    expect(wrapper.text()).toContain('Memorial estrutural')
    expect(wrapper.text()).toContain('Revisar premissas de carga')
    expect(wrapper.text()).toContain('Padrao estrutural para UBS')
    expect(wrapper.text()).toContain('Risco alto')

    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('update:status')).toEqual([[deliverable, 'done']])
  })
})
