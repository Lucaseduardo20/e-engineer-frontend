import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { describe, expect, it } from 'vitest'
import DocumentsList from './DocumentsList.vue'
import type { DocumentSummary } from '@/shared/types/api-contracts'

const PassthroughStub = defineComponent({
  setup(_, { slots }) {
    return () => h('div', slots.default?.())
  },
})

describe('DocumentsList', () => {
  it('renders document titles and emits upload actions', async () => {
    const documents: DocumentSummary[] = [
      {
        id: 'document-1',
        projectId: 'project-1',
        title: 'Laudo de fundacao',
        type: 'laudo',
        status: 'approved',
        updatedAt: '2026-05-27T00:00:00.000Z',
      },
    ]

    const wrapper = mount(DocumentsList, {
      props: { documents },
      global: {
        stubs: {
          BasePagination: PassthroughStub,
          DocumentCard: {
            props: ['document'],
            emits: ['upload'],
            template:
              '<button data-test="upload" @click="$emit(\'upload\', document)">{{ document.title }}</button>',
          },
          VCard: PassthroughStub,
          VCardTitle: PassthroughStub,
          VChip: PassthroughStub,
          VIcon: PassthroughStub,
        },
      },
    })

    expect(wrapper.text()).toContain('Laudo de fundacao')
    await wrapper.find('[data-test="upload"]').trigger('click')
    expect(wrapper.emitted('upload')?.[0]).toEqual([documents[0]])
  })
})
