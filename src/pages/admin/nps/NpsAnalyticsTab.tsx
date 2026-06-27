import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Alert, Box, Card, CardContent, FormControl, Grid, InputLabel, MenuItem,
  Select, Stack, Typography,
} from '@mui/material'
import { LineChart } from '@mui/x-charts/LineChart'
import dayjs from 'dayjs'
import { DatePickerField } from '@/components/common/DatePickerField'
import { npsApi, npsTemplatesApi } from '@/api/nps.api'
import { computeNps, firstNpsQuestion } from '@/utils/nps'
import { QuestionAnalyticsCard } from './analytics/registry'
import type { NpsResponse } from '@/types'

function npsScoreOf(r: NpsResponse): number | null {
  const q = firstNpsQuestion(r.form_snapshot)
  if (!q) return null
  const v = r.answers?.[q.id]
  return typeof v === 'number' ? v : null
}

export function NpsAnalyticsTab() {
  const [templateId, setTemplateId] = useState<string>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const { data: templates = [] } = useQuery({ queryKey: ['nps-templates'], queryFn: npsTemplatesApi.list })

  // Default: campanha ativa (ou a primeira da lista)
  useEffect(() => {
    if (!templateId && templates.length) {
      const active = templates.find((t) => t.is_active)
      setTemplateId(active?.id ?? templates[0].id)
    }
  }, [templates, templateId])

  const selectedTemplate = templates.find((t) => t.id === templateId)

  // Respostas da campanha selecionada (para os cards por pergunta)
  const { data: scoped = [], isLoading } = useQuery({
    queryKey: ['nps-analytics', templateId, dateFrom, dateTo],
    queryFn: () => npsApi.list({
      template_id: templateId,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }),
    enabled: !!templateId,
  })

  // Respostas de TODAS as campanhas (para a linha de NPS no tempo)
  const { data: allResponses = [] } = useQuery({
    queryKey: ['nps-trend', dateFrom, dateTo],
    queryFn: () => npsApi.list({
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }),
  })

  // Linha de NPS por mês (cruzando templates)
  const trend = useMemo(() => {
    const byMonth = new Map<string, number[]>()
    for (const r of allResponses) {
      const score = npsScoreOf(r)
      if (score === null) continue
      const key = r.created_at.slice(0, 7) // YYYY-MM
      const arr = byMonth.get(key) ?? []
      arr.push(score)
      byMonth.set(key, arr)
    }
    const months = [...byMonth.keys()].sort()
    return {
      labels: months.map((m) => dayjs(`${m}-01`).format('MMM/YY')),
      values: months.map((m) => computeNps(byMonth.get(m)!) ?? 0),
    }
  }, [allResponses])

  // NPS geral da campanha selecionada (resumo)
  const overall = useMemo(() => {
    const q = selectedTemplate ? firstNpsQuestion(selectedTemplate.questions) : undefined
    if (!q) return null
    const scores = scoped
      .map((r) => r.answers?.[q.id])
      .filter((v): v is number => typeof v === 'number')
    return { nps: computeNps(scores), count: scores.length }
  }, [selectedTemplate, scoped])

  return (
    <Box>
      {/* Informativo: como ler */}
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>Como ler:</strong> o NPS varia de <strong>−100 a +100</strong> e é calculado como
          {' '}<em>% de Promotores − % de Detratores</em>. Promotores dão nota <strong>9–10</strong>,
          {' '}Neutros <strong>7–8</strong> e Detratores <strong>0–6</strong>.
        </Typography>
        <Typography variant="body2" mt={0.5}>
          Use a <strong>Campanha</strong> e o intervalo de datas para recortar os dados. Cada pergunta é
          resumida no gráfico adequado ao seu tipo; respostas de texto viram nuvem de palavras + análise de sentimento.
        </Typography>
      </Alert>

      {/* Controles */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3} flexWrap="wrap" alignItems={{ sm: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Campanha</InputLabel>
          <Select label="Campanha" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
            {templates.map((t) => (
              <MenuItem key={t.id} value={t.id}>{t.name}{t.is_active ? ' (ativa)' : ''}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <DatePickerField label="De" size="small" value={dateFrom || null} maxDate={dateTo || undefined} onChange={(v) => setDateFrom(v ?? '')} sx={{ minWidth: 150 }} />
        <DatePickerField label="Até" size="small" value={dateTo || null} minDate={dateFrom || undefined} onChange={(v) => setDateTo(v ?? '')} sx={{ minWidth: 150 }} />
      </Stack>

      {templates.length === 0 ? (
        <Alert severity="info">Crie um template de NPS primeiro (aba Template).</Alert>
      ) : (
        <Stack spacing={3}>
          {/* Resumo */}
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Card variant="outlined" sx={{ minWidth: 160 }}>
              <CardContent>
                <Typography variant="h4" fontWeight={800} color="primary">{scoped.length}</Typography>
                <Typography variant="caption" color="text.secondary">respostas no período</Typography>
              </CardContent>
            </Card>
            {overall && overall.count > 0 && (
              <Card variant="outlined" sx={{ minWidth: 160 }}>
                <CardContent>
                  <Typography variant="h4" fontWeight={800} sx={{ color: (overall.nps ?? 0) >= 0 ? '#2e9e6b' : '#e5484d' }}>
                    {(overall.nps ?? 0) > 0 ? `+${overall.nps}` : overall.nps}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">NPS da campanha</Typography>
                </CardContent>
              </Card>
            )}
          </Stack>

          {/* Linha de NPS no tempo (cruza campanhas) */}
          {trend.labels.length > 1 && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} mb={1}>NPS ao longo do tempo</Typography>
                <Typography variant="caption" color="text.secondary">Considera todas as campanhas no período selecionado.</Typography>
                <LineChart
                  height={260}
                  xAxis={[{ scaleType: 'point', data: trend.labels }]}
                  yAxis={[{ min: -100, max: 100 }]}
                  series={[{ data: trend.values, label: 'NPS', color: '#1b656c', area: true, showMark: true }]}
                  hideLegend
                />
              </CardContent>
            </Card>
          )}

          {/* Cards por pergunta da campanha selecionada */}
          {isLoading ? (
            <Typography color="text.secondary">Carregando...</Typography>
          ) : !selectedTemplate || selectedTemplate.questions.length === 0 ? (
            <Alert severity="info">Esta campanha não tem perguntas.</Alert>
          ) : (
            <Grid container spacing={2}>
              {selectedTemplate.questions.map((q) => {
                const values = scoped
                  .map((r) => r.answers?.[q.id])
                  .filter((v) => v !== undefined && v !== null)
                const isWide = q.type === 'nps' || q.type === 'text' || q.type === 'multiple_choice'
                return (
                  <Grid key={q.id} size={{ xs: 12, md: isWide ? 12 : 6 }}>
                    <QuestionAnalyticsCard question={q} values={values as never} />
                  </Grid>
                )
              })}
            </Grid>
          )}
        </Stack>
      )}
    </Box>
  )
}
