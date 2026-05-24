/**
 * Telefones são armazenados no banco como **apenas dígitos com DDI**, sem `+`.
 * Ex: `553194147435` (BR), `14155551234` (US).
 *
 * Este módulo concentra a conversão entre esse formato canônico e o que o
 * `mui-tel-input` consome/produz (E.164 com `+`).
 */

import { parsePhoneNumber } from 'libphonenumber-js'

/** Converte dígitos canônicos (`553194147435`) em E.164 (`+553194147435`) para o input. */
export function digitsToE164(digits: string | null | undefined): string {
  if (!digits) return ''
  const onlyDigits = digits.replace(/\D/g, '')
  if (!onlyDigits) return ''
  return `+${onlyDigits}`
}

/** Converte o valor do mui-tel-input (`+55 31 99414-7435`) em dígitos canônicos (`553194147435`). */
export function e164ToDigits(value: string | null | undefined): string {
  if (!value) return ''
  return value.replace(/\D/g, '')
}

/** Formata dígitos canônicos para exibição amigável (`+55 31 99414-7435`).
 *  Fallback: se o número não puder ser parseado, retorna os dígitos crus. */
export function formatPhoneDisplay(digits: string | null | undefined): string {
  if (!digits) return ''
  const onlyDigits = digits.replace(/\D/g, '')
  if (!onlyDigits) return ''
  try {
    const parsed = parsePhoneNumber(`+${onlyDigits}`)
    if (parsed) return parsed.formatInternational()
  } catch {
    // ignora — fallback abaixo
  }
  return onlyDigits
}

/** URL do WhatsApp para abrir conversa direta com o número canônico. */
export function whatsappUrl(digits: string | null | undefined): string | null {
  if (!digits) return null
  const onlyDigits = digits.replace(/\D/g, '')
  if (!onlyDigits) return null
  return `https://wa.me/${onlyDigits}`
}
