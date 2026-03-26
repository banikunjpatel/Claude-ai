/** Auth API calls that proxy through our FastAPI backend. */

import apiClient from './client'
import type { APIResponse } from '@/types/api'

export interface SignUpInput {
  email: string
  password: string
  fullName: string
  referralCode?: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface TokenPayload {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
}

export interface UserProfile {
  userId: string
  email: string
  fullName: string
  avatarUrl: string | null
  referralCode: string
  createdAt: string
}

export const authApi = {
  signUp: (data: SignUpInput) =>
    apiClient.post<APIResponse<TokenPayload>>('/auth/signup', data).then((r) => r.data),

  login: (data: LoginInput) =>
    apiClient.post<APIResponse<TokenPayload>>('/auth/login', data).then((r) => r.data),

  refreshToken: (refreshToken: string) =>
    apiClient.post<APIResponse<TokenPayload>>('/auth/refresh', { refreshToken }).then((r) => r.data),

  logout: () =>
    apiClient.post('/auth/logout').then((r) => r.data),

  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }).then((r) => r.data),

  resetPassword: (token: string, newPassword: string) =>
    apiClient.post('/auth/reset-password', { token, newPassword }).then((r) => r.data),

  updatePassword: (currentPassword: string, newPassword: string) =>
    apiClient.put('/auth/password', { currentPassword, newPassword }).then((r) => r.data),

  getProfile: () =>
    apiClient.get<APIResponse<UserProfile>>('/auth/me').then((r) => r.data),

  updateProfile: (data: Partial<Pick<UserProfile, 'fullName' | 'avatarUrl'>>) =>
    apiClient.put<APIResponse<UserProfile>>('/auth/me', data).then((r) => r.data),

  deleteAccount: () =>
    apiClient.delete('/auth/me').then((r) => r.data),
}
