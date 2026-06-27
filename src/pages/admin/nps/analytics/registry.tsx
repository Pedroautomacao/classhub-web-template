import { Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material'
import { BarChart } from '@mui/x-charts/BarChart'
import { PieChart } from '@mui/x-charts/PieChart'
import { BUCKET_COLORS, BUCKET_LABELS, computeNps, npsBucket } from '@/utils/nps'
import type { NpsAnswerValue, NpsBucket, NpsQuestion } from '@/types'
import { sentimentBreakdown, wordFrequencies, type Sentiment } from './textAnalysis'
import { WordCloud } from './WordCloud'

const CHART_PALETTE = ['#1b656c', '#2e9e6b', '#f5a623', '#5b8def', '#9b59b6', '#e07b39', '#e5484d', '#56c5d0']
const PRIMARY = '#1b656c'

const SENTIMENT_META: Record<Sentiment, { label: string; color: string }> = {
  positive: { label: 'Positivo', color: BUCKET_COLORS.promoter },
  neutral: { label: 'Neutro', color: BUCKET_COLORS.passive },
  negative: { label: 'Negativo', color: BUCKET_COLORS.detractor },
}

function numericValues(values: NpsAnswerValue[]): number[] {
  return values.filter((v): v is number => typeof v === 'number')
}

function stringValues(values: NpsAnswerValue[]): string[] {
  return values.filter((v): v is string => typeof v === 'string' && v.trim() !== '')
}

// ── NPS ───────────────────────────────────────────────────────────────────────

export function NpsViz({ values }: { values: NpsAnswerValue[] }) {
  const scores = numericValues(values)
  if (scores.length === 0) return <EmptyViz />

  const nps = computeNps(scores) ?? 0
  const counts = Array.from({ length: 11 }, (_, n) => scores.filter((s) => s === n).length)
  const maxCount = Math.max(1, ...counts)

  const buckets: Record<NpsBucket, number> = { detractor: 0, passive: 0, promoter: 0 }
  for (const s of scores) buckets[npsBucket(s)]++
  const pct = (n: number) => (n / scores.length) * 100

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ sm: 'center' }}>
        <Box sx={{ textAlign: 'center', minWidth: 120 }}>
          <Typography variant="h2" fontWeight={800} sx={{ color: nps >= 0 ? BUCKET_COLORS.promoter : BUCKET_COLORS.detractor, lineHeight: 1 }}>
            {nps > 0 ? `+${nps}` : nps}
          </Typography>
          <Typography variant="caption" color="text.secondary">NPS ({scores.length} respostas)</Typography>
        </Box>
        <Box sx={{ flex: 1, width: '100%' }}>
          {/* Medidor linear -100 a +100 */}
          <Box sx={{ position: 'relative', height: 10, borderRadius: 5, background: `linear-gradient(90deg, ${BUCKET_COLORS.detractor}, ${BUCKET_COLORS.passive}, ${BUCKET_COLORS.promoter})` }}>
            <Box sx={{ position: 'absolute', top: -4, left: `calc(${((nps + 100) / 200) * 100}% - 9px)`, width: 18, height: 18, borderRadius: '50%', bgcolor: '#fff', border: '3px solid', borderColor: 'text.primary' }} />
          </Box>
          <Stack direction="row" justifyContent="space-between" mt={0.5}>
            <Typography variant="caption" color="text.secondary">−100</Typography>
            <Typography variant="caption" color="text.secondary">0</Typography>
            <Typography variant="caption" color="text.secondary">+100</Typography>
          </Stack>
        </Box>
      </Stack>

      {/* Distribuição por faixa */}
      <Box>
        <Box sx={{ display: 'flex', height: 26, borderRadius: 1, overflow: 'hidden' }}>
          {(['promoter', 'passive', 'detractor'] as NpsBucket[]).map((b) =>
            buckets[b] > 0 ? (
              <Box key={b} sx={{ width: `${pct(buckets[b])}%`, bgcolor: BUCKET_COLORS[b], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700 }}>{Math.round(pct(buckets[b]))}%</Typography>
              </Box>
            ) : null,
          )}
        </Box>
        <Stack direction="row" spacing={2} mt={1} flexWrap="wrap">
          {(['promoter', 'passive', 'detractor'] as NpsBucket[]).map((b) => (
            <Stack key={b} direction="row" spacing={0.5} alignItems="center">
              <Box sx={{ width: 12, height: 12, borderRadius: '3px', bgcolor: BUCKET_COLORS[b] }} />
              <Typography variant="caption" color="text.secondary">{BUCKET_LABELS[b]}: {buckets[b]}</Typography>
            </Stack>
          ))}
        </Stack>
      </Box>

      {/* Histograma 0–10 (barras custom coloridas por faixa) */}
      <Box>
        <Typography variant="caption" color="text.secondary">Distribuição das notas</Typography>
        <Stack direction="row" spacing={0.5} alignItems="flex-end" sx={{ height: 110, mt: 0.5 }}>
          {counts.map((c, n) => (
            <Stack key={n} flex={1} alignItems="center" spacing={0.3}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>{c || ''}</Typography>
              <Box sx={{ width: '100%', height: `${(c / maxCount) * 80}px`, minHeight: c > 0 ? 3 : 0, bgcolor: BUCKET_COLORS[npsBucket(n)], borderRadius: '3px 3px 0 0' }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>{n}</Typography>
            </Stack>
          ))}
        </Stack>
      </Box>
    </Stack>
  )
}

// ── Rating / Scale ──────────────────────────────────────────────────────────--

function RatingScaleViz({ question, values }: { question: NpsQuestion; values: NpsAnswerValue[] }) {
  const nums = numericValues(values)
  if (nums.length === 0) return <EmptyViz />

  const min = question.type === 'rating' ? 1 : (question.config?.min ?? 1)
  const max = question.type === 'rating' ? (question.config?.max ?? 5) : (question.config?.max ?? 5)
  const labels = Array.from({ length: max - min + 1 }, (_, i) => String(min + i))
  const counts = labels.map((l) => nums.filter((v) => v === Number(l)).length)
  const avg = nums.reduce((a, b) => a + b, 0) / nums.length

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} alignItems="baseline">
        <Typography variant="h4" fontWeight={800} color="primary">{avg.toFixed(1)}</Typography>
        <Typography variant="caption" color="text.secondary">média ({nums.length} respostas, escala {min}–{max})</Typography>
      </Stack>
      <BarChart
        height={220}
        xAxis={[{ scaleType: 'band', data: labels }]}
        series={[{ data: counts, color: PRIMARY, label: 'Respostas' }]}
        hideLegend
      />
    </Stack>
  )
}

// ── Escolha única (pizza) ───────────────────────────────────────────────────--

function SingleChoiceViz({ question, values }: { question: NpsQuestion; values: NpsAnswerValue[] }) {
  const strs = stringValues(values)
  if (strs.length === 0) return <EmptyViz />

  const options = question.options && question.options.length ? question.options : [...new Set(strs)]
  const data = options
    .map((opt, i) => ({ id: i, label: opt, value: strs.filter((s) => s === opt).length, color: CHART_PALETTE[i % CHART_PALETTE.length] }))
    .filter((d) => d.value > 0)

  return (
    <PieChart
      height={240}
      series={[{ data, innerRadius: 50, paddingAngle: 1, cornerRadius: 3 }]}
    />
  )
}

// ── Múltipla escolha (barras horizontais) ───────────────────────────────────--

function MultiChoiceViz({ question, values }: { question: NpsQuestion; values: NpsAnswerValue[] }) {
  const arrays = values.filter((v): v is string[] => Array.isArray(v))
  if (arrays.length === 0) return <EmptyViz />

  const flat = arrays.flat()
  const options = question.options && question.options.length ? question.options : [...new Set(flat)]
  const counts = options.map((opt) => flat.filter((v) => v === opt).length)

  return (
    <Stack spacing={1}>
      <Typography variant="caption" color="text.secondary">
        {arrays.length} respostas (uma resposta pode marcar várias opções)
      </Typography>
      <BarChart
        height={Math.max(180, options.length * 44)}
        layout="horizontal"
        yAxis={[{ scaleType: 'band', data: options }]}
        xAxis={[{ min: 0 }]}
        series={[{ data: counts, color: PRIMARY }]}
        hideLegend
        margin={{ left: 120 }}
      />
    </Stack>
  )
}

// ── Texto (nuvem + sentimento + verbatims) ──────────────────────────────────--

function TextViz({ values }: { values: NpsAnswerValue[] }) {
  const texts = stringValues(values)
  if (texts.length === 0) return <EmptyViz />

  const words = wordFrequencies(texts, 40)
  const sentiment = sentimentBreakdown(texts)
  const total = sentiment.positive + sentiment.neutral + sentiment.negative

  return (
    <Stack spacing={2}>
      {/* Sentimento */}
      <Box>
        <Typography variant="caption" color="text.secondary">Sentimento ({total} respostas)</Typography>
        <Box sx={{ display: 'flex', height: 22, borderRadius: 1, overflow: 'hidden', mt: 0.5 }}>
          {(['positive', 'neutral', 'negative'] as Sentiment[]).map((s) =>
            sentiment[s] > 0 ? (
              <Box key={s} sx={{ width: `${(sentiment[s] / total) * 100}%`, bgcolor: SENTIMENT_META[s].color }} />
            ) : null,
          )}
        </Box>
        <Stack direction="row" spacing={1.5} mt={1} flexWrap="wrap">
          {(['positive', 'neutral', 'negative'] as Sentiment[]).map((s) => (
            <Chip key={s} size="small" variant="outlined"
              label={`${SENTIMENT_META[s].label}: ${sentiment[s]}`}
              sx={{ borderColor: SENTIMENT_META[s].color, color: SENTIMENT_META[s].color }}
            />
          ))}
        </Stack>
      </Box>

      {/* Nuvem de palavras */}
      <WordCloud words={words} />

      {/* Verbatims (amostra) */}
      <Box>
        <Typography variant="caption" color="text.secondary">Respostas recentes</Typography>
        <Stack spacing={0.5} mt={0.5}>
          {texts.slice(0, 5).map((t, i) => (
            <Typography key={i} variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>“{t}”</Typography>
          ))}
        </Stack>
      </Box>
    </Stack>
  )
}

function EmptyViz() {
  return <Typography variant="body2" color="text.secondary">Sem respostas para esta pergunta no período.</Typography>
}

const TYPE_CHIP: Record<string, string> = {
  nps: 'NPS', rating: 'Avaliação', scale: 'Escala',
  single_choice: 'Escolha única', multiple_choice: 'Múltipla escolha', text: 'Texto',
}

/** Card que despacha a visualização correta conforme o tipo da pergunta. */
export function QuestionAnalyticsCard({ question, values }: { question: NpsQuestion; values: NpsAnswerValue[] }) {
  const answered = values.filter((v) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0)).length

  let viz: React.ReactNode
  switch (question.type) {
    case 'nps': viz = <NpsViz values={values} />; break
    case 'rating':
    case 'scale': viz = <RatingScaleViz question={question} values={values} />; break
    case 'single_choice': viz = <SingleChoiceViz question={question} values={values} />; break
    case 'multiple_choice': viz = <MultiChoiceViz question={question} values={values} />; break
    case 'text': viz = <TextViz values={values} />; break
    default: viz = <EmptyViz />
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} mb={1.5} flexWrap="wrap">
          <Typography variant="subtitle1" fontWeight={700} flex={1}>{question.text}</Typography>
          <Chip label={TYPE_CHIP[question.type] ?? question.type} size="small" variant="outlined" />
          <Chip label={`${answered} resp.`} size="small" />
        </Stack>
        {viz}
      </CardContent>
    </Card>
  )
}
