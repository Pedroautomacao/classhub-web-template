import type { NpsAnswerValue, NpsBucket, NpsQuestion } from '@/types'

/** Faixa de NPS a partir de uma nota 0–10. */
export function npsBucket(value: number): NpsBucket {
  if (value <= 6) return 'detractor'
  if (value <= 8) return 'passive'
  return 'promoter'
}

export const BUCKET_LABELS: Record<NpsBucket, string> = {
  detractor: 'Detrator',
  passive: 'Neutro',
  promoter: 'Promotor',
}

/** Cores fixas das faixas (usadas em badges e nos gráficos). */
export const BUCKET_COLORS: Record<NpsBucket, string> = {
  detractor: '#e5484d',
  passive: '#f5a623',
  promoter: '#2e9e6b',
}

/** Cor de cada nota 0–10 conforme a faixa. */
export function npsScoreColor(score: number): string {
  return BUCKET_COLORS[npsBucket(score)]
}

/**
 * Uma pergunta com `condition` só aparece quando a resposta da pergunta
 * referenciada (tipo nps) cai em uma das faixas configuradas.
 */
export function isQuestionVisible(
  question: NpsQuestion,
  answers: Record<string, NpsAnswerValue>,
): boolean {
  if (!question.condition) return true
  const ref = answers[question.condition.question_id]
  if (typeof ref !== 'number') return false
  return question.condition.buckets.includes(npsBucket(ref))
}

/** Primeira pergunta tipo `nps` de uma lista (a "pergunta âncora" do NPS). */
export function firstNpsQuestion(questions: NpsQuestion[] | null | undefined): NpsQuestion | undefined {
  return (questions ?? []).find((q) => q.type === 'nps')
}

/** Formata um valor de resposta para exibição. */
export function formatAnswerValue(value: NpsAnswerValue | undefined | null): string {
  if (value === undefined || value === null || value === '') return '—'
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—'
  return String(value)
}

/**
 * NPS = %promotores − %detratores (−100 a +100), considerando apenas as
 * notas válidas (0–10). Retorna null se não houver respostas.
 */
export function computeNps(scores: number[]): number | null {
  if (scores.length === 0) return null
  let promoters = 0
  let detractors = 0
  for (const s of scores) {
    const b = npsBucket(s)
    if (b === 'promoter') promoters++
    else if (b === 'detractor') detractors++
  }
  return Math.round(((promoters - detractors) / scores.length) * 100)
}
