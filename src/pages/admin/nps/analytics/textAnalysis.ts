// Análise de texto offline para as respostas abertas do NPS:
// - tokenização + remoção de stopwords PT-BR (para a nuvem de palavras)
// - sentimento por léxico PT-BR (aproximado, com tratamento de negação)

export type Sentiment = 'positive' | 'neutral' | 'negative'

const STOPWORDS = new Set([
  'a', 'o', 'e', 'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas',
  'um', 'uma', 'uns', 'umas', 'que', 'com', 'por', 'para', 'pra', 'se', 'os', 'as',
  'ao', 'aos', 'mas', 'ou', 'foi', 'ser', 'sou', 'sao', 'eu', 'ele', 'ela', 'eles',
  'elas', 'voce', 'voces', 'meu', 'minha', 'seu', 'sua', 'nao', 'sim', 'ja', 'la',
  'isso', 'isto', 'esse', 'essa', 'este', 'esta', 'muito', 'muita', 'mais', 'menos',
  'tem', 'tinha', 'ter', 'sobre', 'como', 'quando', 'tambem', 'so', 'me', 'meus',
  'minhas', 'seus', 'suas', 'pelo', 'pela', 'dele', 'dela', 'todo', 'toda', 'todos',
  'todas', 'ate', 'entre', 'depois', 'antes', 'porque', 'pois', 'entao', 'aqui',
  'ai', 'foi', 'era', 'estou', 'esta', 'estao', 'fica', 'ficou', 'vai', 'vou',
])

const POSITIVE = new Set([
  'otimo', 'otima', 'excelente', 'maravilhoso', 'maravilhosa', 'bom', 'boa', 'boas',
  'bons', 'gostei', 'amei', 'adorei', 'amo', 'adoro', 'top', 'incrivel', 'perfeito',
  'perfeita', 'recomendo', 'satisfeito', 'satisfeita', 'feliz', 'felizes', 'legal',
  'legais', 'agradavel', 'eficiente', 'rapido', 'rapida', 'atencioso', 'atenciosa',
  'dedicado', 'dedicada', 'paciente', 'organizado', 'organizada', 'divertido',
  'divertida', 'melhor', 'melhorou', 'evolui', 'aprendi', 'ajudou', 'ajuda',
  'qualidade', 'sucesso', 'parabens', 'show', 'sensacional', 'fantastico', 'fantastica',
  'nota', 'dez', 'completo', 'completa', 'claro', 'clara', 'didatico', 'didatica',
])

const NEGATIVE = new Set([
  'ruim', 'pessimo', 'pessima', 'horrivel', 'terrivel', 'odiei', 'odeio', 'detesto',
  'fraco', 'fraca', 'lento', 'lenta', 'demora', 'demorado', 'demorada', 'caro', 'cara',
  'confuso', 'confusa', 'desorganizado', 'desorganizada', 'insatisfeito', 'insatisfeita',
  'decepcionado', 'decepcionada', 'decepcao', 'problema', 'problemas', 'dificil',
  'dificuldade', 'falta', 'faltou', 'falha', 'falhas', 'cancelar', 'cancelado',
  'reclamacao', 'reclamar', 'chato', 'chata', 'pior', 'piorou', 'desistir', 'desisti',
  'bagunca', 'baguncado', 'atrasado', 'atrasada', 'atraso', 'erro', 'erros', 'cansativo',
])

const NEGATORS = new Set(['nao', 'nunca', 'jamais', 'nem', 'sem'])

/** Remove acentos e baixa a caixa. */
export function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/** Quebra em tokens "limpos" (sem pontuação, sem stopwords, len >= 3). */
export function tokenize(text: string): string[] {
  return normalize(text)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t))
}

export interface WordFreq {
  text: string
  value: number
}

/** Frequência das palavras mais comuns em uma lista de textos. */
export function wordFrequencies(texts: string[], limit = 50): WordFreq[] {
  const counts = new Map<string, number>()
  for (const t of texts) {
    for (const token of tokenize(t)) {
      counts.set(token, (counts.get(token) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .map(([text, value]) => ({ text, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
}

/** Sentimento de um único texto via léxico, com inversão por negação. */
export function analyzeSentiment(text: string): Sentiment {
  const tokens = normalize(text).replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean)
  let score = 0
  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i]
    let polarity = 0
    if (POSITIVE.has(word)) polarity = 1
    else if (NEGATIVE.has(word)) polarity = -1
    if (polarity !== 0) {
      const prev = tokens[i - 1]
      const prev2 = tokens[i - 2]
      if (NEGATORS.has(prev) || NEGATORS.has(prev2)) polarity *= -1
      score += polarity
    }
  }
  if (score > 0) return 'positive'
  if (score < 0) return 'negative'
  return 'neutral'
}

/** Distribuição de sentimento em uma lista de textos. */
export function sentimentBreakdown(texts: string[]): Record<Sentiment, number> {
  const result: Record<Sentiment, number> = { positive: 0, neutral: 0, negative: 0 }
  for (const t of texts) {
    if (!t.trim()) continue
    result[analyzeSentiment(t)]++
  }
  return result
}
