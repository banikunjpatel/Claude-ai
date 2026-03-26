/** Canonical API envelope types matching the FastAPI backend. */

export interface PaginationMeta {
  limit: number
  total?: number
  nextCursor?: string | null
  page?: number | null
}

export interface APIResponse<T> {
  success: true
  data: T
  meta?: PaginationMeta
}

export interface APIError {
  success: false
  error: {
    code: string
    message: string
    statusCode: number
  }
}

/** Normalised error thrown by the Axios response interceptor. */
export interface AppError {
  code: string
  message: string
  statusCode: number
}
