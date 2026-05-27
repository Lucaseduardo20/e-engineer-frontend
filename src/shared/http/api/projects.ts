import { BaseApiService } from '@/shared/http/api/base'
import type { Paginated, Project } from '@/shared/types/api-contracts'

export type ProjectDTO = Project

export interface CreateProjectRequest {
  name: string
  projectType: string
}

export interface CreateProjectResponse {
  id: string
  organizationId: string
  name: string
  projectType: string
  status: Project['status']
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
    return this.get<Paginated<ProjectDTO>>('', { params })
  }

  getById(id: string): Promise<ProjectDTO> {
    return this.get<ProjectDTO>(`/${id}`)
  }

  create(request: CreateProjectRequest): Promise<CreateProjectResponse> {
    return this.post<CreateProjectResponse, CreateProjectRequest>('', request)
  }
}

export const projectsService = new ProjectsService()
