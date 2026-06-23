import { AxiosError } from 'axios'
import type { ApiError } from '@/shared/types/api-contracts'

function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value &&
    typeof (value as ApiError).code === 'string' &&
    typeof (value as ApiError).message === 'string'
  )
}

export function getApiError(error: unknown): ApiError | null {
  if (error instanceof AxiosError && isApiError(error.response?.data)) {
    return error.response.data
  }

  return null
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const apiError = getApiError(error)

  if (apiError?.message) {
    return apiError.message
  }

  if (error instanceof AxiosError && error.response?.status === 403) {
    return 'Voce nao tem permissao para executar esta acao.'
  }

  if (
    error instanceof AxiosError &&
    (error.response?.status === 0 || error.code === 'ERR_NETWORK')
  ) {
    return 'Nao foi possivel conectar ao servidor. Verifique se a API esta rodando.'
  }

  return fallback
}
