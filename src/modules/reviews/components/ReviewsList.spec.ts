import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { describe, expect, it } from 'vitest'
import ReviewsList from './ReviewsList.vue'
import type { ReviewSummary } from '@/shared/types/api-contracts'

const PassthroughStub = defineComponent({
  setup(_, { slots }) {
    return () => h('div', slots.default?.())
  },
})

describe('ReviewsList', () => {
  it('renders reviews and emits decision actions', async () => {
    const reviews: ReviewSummary[] = [
      {
        id: 'review-1',
        projectId: 'project-1',
        status: 'pending',
        requestedBy: 'user-1',
        reviewers: [{ userId: 'user-2', role: 'reviewer' }],
        comment: 'Revisar memorial.',
      },
    ]

    const wrapper = mount(ReviewsList, {
      props: { reviews },
      global: {
        stubs: {
          BasePagination: PassthroughStub,
          ReviewCard: {
            props: ['review'],
            emits: ['approve', 'open'],
            template:
              '<div><button data-test="open" @click="$emit(\'open\', review)">{{ review.comment }}</button><button data-test="approve" @click="$emit(\'approve\', review)">aprovar</button></div>',
          },
          VCard: PassthroughStub,
          VCardTitle: PassthroughStub,
          VChip: PassthroughStub,
          VIcon: PassthroughStub,
        },
      },
    })

    expect(wrapper.text()).toContain('Revisar memorial.')
    await wrapper.find('[data-test="open"]').trigger('click')
    expect(wrapper.emitted('open')?.[0]).toEqual([reviews[0]])
    await wrapper.find('[data-test="approve"]').trigger('click')
    expect(wrapper.emitted('approve')?.[0]).toEqual([reviews[0]])
  })
})
