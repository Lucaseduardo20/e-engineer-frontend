import { BaseApiService } from '@/shared/http/api/base'
import { toTimestamp } from '@/shared/formatters/date.formatter'
import type {
  Paginated,
  Project,
  ProjectBaseRecommendation,
  ProjectTechnicalProfile,
} from '@/shared/types/api-contracts'

export type ProjectDTO = Project

export interface CreateProjectRequest {
  name: string
  projectType: string
  baseProjectId?: string
  tagIds?: string[]
}

export interface CreateProjectResponse {
  id: string
  organizationId: string
  name: string
  projectType: string
  status: Project['status']
  tagIds?: string[]
  clonedFromProjectId?: string | null
  clonedStructure?: {
    deliverablesCopied: number
    documentsCopied: number
    documentVersionsCopied: number
    reviewsCopied: number
  } | null
}

export interface UpdateProjectRequest {
  name?: string
  projectType?: string
  tagIds?: string[]
}

export interface ListProjectsParams {
  page?: number
  pageSize?: number
  name?: string
  status?: Project['status']
}

export class ProjectsService extends BaseApiService {
  constructor() {
    super('/projects')
  }

  list(params: ListProjectsParams = {}): Promise<Paginated<ProjectDTO>> {
    return this.get<Paginated<ProjectDTO>>('', { params }).then((response) => ({
      ...response,
      items: response.items.map(mapProject),
    }))
  }

  getById(id: string): Promise<ProjectDTO> {
    return this.get<ProjectDTO>(`/${id}`).then(mapProject)
  }

  create(request: CreateProjectRequest): Promise<CreateProjectResponse> {
    return this.post<CreateProjectResponse, CreateProjectRequest>('', request)
  }

  update(id: string, request: UpdateProjectRequest): Promise<ProjectDTO> {
    return this.patch<ProjectDTO, UpdateProjectRequest>(`/${id}`, request).then(mapProject)
  }

  getTechnicalProfile(id: string): Promise<ProjectTechnicalProfile> {
    return this.get<ProjectTechnicalProfile>(`/${id}/technical-profile`)
  }

  recommendBases(request: { tagIds: string[]; limit?: number }): Promise<{ items: ProjectBaseRecommendation[] }> {
    return this.post<{ items: ProjectBaseRecommendation[] }, { tagIds: string[]; limit?: number }>(
      '/recommend-bases',
      request,
    )
  }
}

export const projectsService = new ProjectsService()

function mapProject(project: ProjectDTO): ProjectDTO {
  return {
    ...project,
    startDate: toTimestamp(project.startDate) ?? undefined,
    endDate: toTimestamp(project.endDate) ?? undefined,
  }
}
