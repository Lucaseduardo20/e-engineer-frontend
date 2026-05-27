import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'
import { getApiError, getApiErrorMessage } from './api-error'

describe('api error helpers', () => {
  it('extracts normalized API errors from Axios responses', () => {
    const error = new AxiosError('Bad Request')
    error.response = {
      config: {} as never,
      data: {
        code: 'ValidationError',
        message: 'Validation failed.',
        details: [{ field: 'name', messages: ['name should not be empty'] }],
      },
      headers: {},
      status: 400,
      statusText: 'Bad Request',
    }

    expect(getApiError(error)).toEqual({
      code: 'ValidationError',
      message: 'Validation failed.',
      details: [{ field: 'name', messages: ['name should not be empty'] }],
    })
    expect(getApiErrorMessage(error, 'Fallback')).toBe('Validation failed.')
  })

  it('uses a friendly network message for connection failures', () => {
    const error = new AxiosError('Network Error', 'ERR_NETWORK')

    expect(getApiErrorMessage(error, 'Fallback')).toBe(
      'Nao foi possivel conectar ao servidor. Verifique se a API esta rodando.',
    )
  })

  it('falls back when the error is not normalized', () => {
    expect(getApiErrorMessage(new Error('Boom'), 'Mensagem padrao')).toBe('Mensagem padrao')
  })
})
