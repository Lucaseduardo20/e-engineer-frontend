import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { apiClient } from '@/shared/http/api-client'
import { useReviewsStore } from './reviews.store'

vi.mock('@/shared/http/api-client', () => ({
  apiClient: {
    deliverables: { list: vi.fn() },
    documents: { list: vi.fn() },
    organizations: { users: vi.fn() },
    projects: { list: vi.fn() },
    reviews: {
      approve: vi.fn(),
      comment: vi.fn(),
      create: vi.fn(),
      get: vi.fn(),
      list: vi.fn(),
      reject: vi.fn(),
    },
  },
}))

describe('reviews store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('loads reviews with filters and tracks pending reviews', async () => {
    vi.mocked(apiClient.reviews.list).mockResolvedValue({
      items: [
        {
          id: 'review-1',
          projectId: 'project-1',
          status: 'pending',
          requestedBy: 'user-1',
          reviewers: [{ userId: 'user-2', role: 'reviewer' }],
          comment: 'Revisar memorial.',
        },
      ],
      total: 1,
      page: 1,
      pageSize: 10,
    })
    const store = useReviewsStore()

    await store.loadReviews(1, { projectId: 'project-1', status: 'pending' })

    expect(apiClient.reviews.list).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      projectId: 'project-1',
      status: 'pending',
    })
    expect(store.reviews).toHaveLength(1)
    expect(store.pendingReviews).toHaveLength(1)
  })

  it('creates and approves reviews through the API client', async () => {
    vi.mocked(apiClient.reviews.create).mockResolvedValue({
      id: 'review-1',
      projectId: 'project-1',
      status: 'pending',
      requestedBy: 'user-1',
      reviewers: [{ userId: 'user-2', role: 'reviewer' }],
      comment: 'Revisar memorial.',
    })
    vi.mocked(apiClient.reviews.approve).mockResolvedValue({
      id: 'review-1',
      projectId: 'project-1',
      status: 'approved',
      requestedBy: 'user-1',
      reviewers: [{ userId: 'user-2', role: 'reviewer' }],
      comment: 'Revisar memorial.',
    })
    vi.mocked(apiClient.reviews.list).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
    })
    const store = useReviewsStore()

    await store.createReview({
      projectId: 'project-1',
      reviewers: ['user-2'],
      comment: 'Revisar memorial.',
    })
    await store.approveReview('review-1', { comment: 'Aprovado.' })

    expect(apiClient.reviews.create).toHaveBeenCalled()
    expect(apiClient.reviews.approve).toHaveBeenCalledWith('review-1', {
      comment: 'Aprovado.',
    })
  })

  it('loads a review detail and adds persistent comments', async () => {
    vi.mocked(apiClient.reviews.get).mockResolvedValue({
      id: 'review-1',
      projectId: 'project-1',
      status: 'pending',
      requestedBy: 'user-1',
      reviewers: [{ userId: 'user-2', role: 'reviewer' }],
      comment: 'Revisar memorial.',
      comments: [
        {
          id: 'comment-1',
          reviewId: 'review-1',
          authorUserId: 'user-2',
          body: 'Ajustar nota tecnica.',
          createdAt: 1717092000000,
        },
      ],
    })
    vi.mocked(apiClient.reviews.comment).mockResolvedValue({
      id: 'comment-2',
      reviewId: 'review-1',
      authorUserId: 'user-1',
      body: 'Corrigido.',
      createdAt: 1717095600000,
    })
    const store = useReviewsStore()

    await store.addComment('review-1', 'Corrigido.')

    expect(apiClient.reviews.comment).toHaveBeenCalledWith('review-1', { body: 'Corrigido.' })
    expect(apiClient.reviews.get).toHaveBeenCalledWith('review-1')
    expect(store.selectedReview?.comments).toHaveLength(1)
  })
})
