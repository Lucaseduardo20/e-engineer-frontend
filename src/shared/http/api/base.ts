import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import { httpClient } from '@/shared/http/http-client'
import type { ApiResponse } from '@/shared/types/api-contracts'

export class BaseApiService {
  constructor(protected readonly baseUrl: string) {}

  protected getUrl(path = ''): string {
    return `${this.baseUrl}${path}`
  }

  protected async unwrap<T>(request: Promise<AxiosResponse<ApiResponse<T>>>): Promise<T> {
    const response = await request
    return response.data.data
  }

  protected get<T>(path = '', config?: AxiosRequestConfig): Promise<T> {
    return this.unwrap(httpClient.get<ApiResponse<T>>(this.getUrl(path), config))
  }

  protected post<T, TPayload = unknown>(
    path = '',
    payload?: TPayload,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.unwrap(httpClient.post<ApiResponse<T>>(this.getUrl(path), payload, config))
  }

  protected put<T, TPayload = unknown>(
    path = '',
    payload?: TPayload,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.unwrap(httpClient.put<ApiResponse<T>>(this.getUrl(path), payload, config))
  }

  protected async delete<T = void>(path = '', config?: AxiosRequestConfig): Promise<T> {
    return this.unwrap(httpClient.delete<ApiResponse<T>>(this.getUrl(path), config))
  }
}
