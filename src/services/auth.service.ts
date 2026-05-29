import api from '@/api/axios'

/**
 * Fluxo de recuperação de senha (Fase 5 backend + Fase 7 frontend).
 *
 * Os 3 endpoints abaixo correspondem 1:1 ao módulo
 * `app/modules/password_recovery/router.py` da API.
 */
export const authService = {
  /**
   * Solicita um código de 6 dígitos por e-mail. O backend sempre responde
   * 204 — mesmo quando o identifier não existe — pra evitar user enumeration.
   */
  recoverPassword: (identifier: string) =>
    api.post<void>('/auth/recover-password', { identifier }).then((r) => r.data),

  /**
   * Confere o código. Retorna um reset_token (JWT curto, ~10min) que será
   * exigido no reset-password.
   */
  validateCode: (identifier: string, code: string) =>
    api
      .post<{ reset_token: string }>('/auth/validate-code', { identifier, code })
      .then((r) => r.data),

  /**
   * Consome o reset_token e troca a senha do usuário.
   */
  resetPassword: (reset_token: string, new_password: string) =>
    api
      .post<void>('/auth/reset-password', { reset_token, new_password })
      .then((r) => r.data),
}
