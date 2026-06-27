import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  FormControl,
  FormControlLabel,
  FormGroup,
  Paper,
  Radio,
  RadioGroup,
  Rating,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { CheckCircle, Insights, Star } from '@mui/icons-material'
import { npsApi, npsTemplatesApi } from '@/api/nps.api'
import { settingsApi } from '@/api/settings.api'
import { isQuestionVisible, npsScoreColor } from '@/utils/nps'
import type { NpsAnswerValue, NpsQuestion } from '@/types'

function isEmpty(v: NpsAnswerValue | undefined): boolean {
  if (v === undefined || v === null || v === '') return true
  if (Array.isArray(v)) return v.length === 0
  return false // 0 é uma resposta válida (ex.: nota NPS = 0)
}

// ── Renderizador de pergunta por tipo ─────────────────────────────────────────

interface QuestionFieldProps {
  question: NpsQuestion
  value: NpsAnswerValue | undefined
  onChange: (v: NpsAnswerValue) => void
  error?: string
}

function QuestionField({ question, value, onChange, error }: QuestionFieldProps) {
  const label = (
    <Typography variant="body2" fontWeight={500} mb={0.5}>
      {question.text}{question.required ? ' *' : ''}
    </Typography>
  )

  if (question.type === 'nps') {
    const selected = typeof value === 'number' ? value : null
    return (
      <Box>
        {label}
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          {Array.from({ length: 11 }, (_, n) => {
            const on = selected === n
            return (
              <Button
                key={n}
                onClick={() => onChange(n)}
                variant={on ? 'contained' : 'outlined'}
                sx={{
                  minWidth: 38, px: 0,
                  ...(on
                    ? { bgcolor: npsScoreColor(n), '&:hover': { bgcolor: npsScoreColor(n) } }
                    : { color: 'text.secondary', borderColor: 'divider' }),
                }}
              >
                {n}
              </Button>
            )
          })}
        </Stack>
        <Stack direction="row" justifyContent="space-between" mt={0.5}>
          <Typography variant="caption" color="text.secondary">Nada provável</Typography>
          <Typography variant="caption" color="text.secondary">Muito provável</Typography>
        </Stack>
        {error && <Typography variant="caption" color="error">{error}</Typography>}
      </Box>
    )
  }

  if (question.type === 'rating') {
    const max = question.config?.max ?? 5
    return (
      <Box>
        {label}
        <Rating
          value={typeof value === 'number' ? value : null}
          max={max}
          onChange={(_, v) => onChange(v ?? 0)}
          icon={<Star fontSize="inherit" />}
          emptyIcon={<Star fontSize="inherit" />}
          size="large"
        />
        {error && <Typography variant="caption" color="error" display="block">{error}</Typography>}
      </Box>
    )
  }

  if (question.type === 'scale') {
    const min = question.config?.min ?? 1
    const max = question.config?.max ?? 5
    const selected = typeof value === 'number' ? value : null
    return (
      <Box>
        {label}
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((n) => (
            <Button
              key={n}
              onClick={() => onChange(n)}
              variant={selected === n ? 'contained' : 'outlined'}
              sx={{ minWidth: 40, px: 0 }}
            >
              {n}
            </Button>
          ))}
        </Stack>
        {(question.config?.min_label || question.config?.max_label) && (
          <Stack direction="row" justifyContent="space-between" mt={0.5}>
            <Typography variant="caption" color="text.secondary">{question.config?.min_label}</Typography>
            <Typography variant="caption" color="text.secondary">{question.config?.max_label}</Typography>
          </Stack>
        )}
        {error && <Typography variant="caption" color="error" display="block">{error}</Typography>}
      </Box>
    )
  }

  if (question.type === 'text') {
    return (
      <Box>
        {label}
        <TextField
          multiline rows={3} fullWidth
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          error={!!error}
          helperText={error}
        />
      </Box>
    )
  }

  if (question.type === 'single_choice') {
    return (
      <FormControl error={!!error} component="fieldset" fullWidth>
        {label}
        <RadioGroup value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)}>
          {(question.options ?? []).map((opt) => (
            <FormControlLabel
              key={opt} value={opt}
              control={<Radio size="small" />}
              label={<Typography variant="body2">{opt}</Typography>}
            />
          ))}
        </RadioGroup>
        {error && <Typography variant="caption" color="error">{error}</Typography>}
      </FormControl>
    )
  }

  // multiple_choice
  const selected = Array.isArray(value) ? value : []
  return (
    <FormControl error={!!error} component="fieldset" fullWidth>
      {label}
      <FormGroup>
        {(question.options ?? []).map((opt) => (
          <FormControlLabel
            key={opt}
            control={
              <Checkbox
                size="small"
                checked={selected.includes(opt)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...selected, opt]
                    : selected.filter((v) => v !== opt)
                  onChange(next)
                }}
              />
            }
            label={<Typography variant="body2">{opt}</Typography>}
          />
        ))}
      </FormGroup>
      {error && <Typography variant="caption" color="error">{error}</Typography>}
    </FormControl>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────

export function NpsFormPage() {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, NpsAnswerValue>>({})
  const [answerErrors, setAnswerErrors] = useState<Record<string, string>>({})

  const { data: landing } = useQuery({
    queryKey: ['landing'],
    queryFn: settingsApi.getLanding,
    staleTime: 5 * 60 * 1000,
  })

  const { data: template, isLoading, isError } = useQuery({
    queryKey: ['nps-template-active'],
    queryFn: npsTemplatesApi.getActive,
    retry: false,
  })

  const visibleQuestions = (template?.questions ?? []).filter((q) => isQuestionVisible(q, answers))

  const onSubmit = async () => {
    if (!template) return
    const newErrors: Record<string, string> = {}
    for (const q of visibleQuestions) {
      if (q.required && isEmpty(answers[q.id])) {
        newErrors[q.id] = 'Esta pergunta é obrigatória'
      }
    }
    setAnswerErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    // Envia só as respostas das perguntas visíveis (descarta condicionais ocultas).
    const visibleIds = new Set(visibleQuestions.map((q) => q.id))
    const payload = Object.fromEntries(
      Object.entries(answers).filter(([id]) => visibleIds.has(id)),
    )

    setSubmitError(null)
    setSubmitting(true)
    try {
      await npsApi.submit({ template_id: template.id, answers: payload })
      setSubmitted(true)
    } catch {
      setSubmitError('Ocorreu um erro ao enviar a pesquisa. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2 }}>
        <Paper sx={{ p: 6, textAlign: 'center', maxWidth: 480 }}>
          <CheckCircle color="success" sx={{ fontSize: 72, mb: 2 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Obrigado pela sua resposta!
          </Typography>
          <Typography color="text.secondary">
            Seu feedback é anônimo e nos ajuda muito a melhorar.
          </Typography>
        </Paper>
      </Box>
    )
  }

  return (
    <Box sx={{ py: { xs: 4, md: 8 }, px: 2 }}>
      <Container maxWidth="sm">
        <Stack alignItems="center" mb={4}>
          <Insights color="primary" sx={{ fontSize: 48, mb: 1 }} />
          {landing?.school_name && (
            <Typography variant="subtitle1" color="primary" fontWeight={600} textAlign="center">
              {landing.school_name}
            </Typography>
          )}
          <Typography variant="h4" fontWeight={700} textAlign="center" color="primary">
            Pesquisa de Satisfação
          </Typography>
          <Typography color="text.secondary" textAlign="center" mt={1}>
            Sua resposta é anônima. Obrigado por nos ajudar a melhorar!
          </Typography>
        </Stack>

        <Paper sx={{ p: { xs: 3, md: 4 } }}>
          {isLoading ? (
            <Stack spacing={3}>
              <Skeleton variant="rounded" height={40} />
              <Skeleton variant="rounded" height={80} />
              <Skeleton variant="rounded" height={80} />
            </Stack>
          ) : isError || !template ? (
            <Alert severity="info">Nenhuma pesquisa ativa no momento.</Alert>
          ) : (
            <Stack spacing={3}>
              {submitError && <Alert severity="error">{submitError}</Alert>}
              {visibleQuestions.map((q) => (
                <QuestionField
                  key={q.id}
                  question={q}
                  value={answers[q.id]}
                  onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
                  error={answerErrors[q.id]}
                />
              ))}
              <Button
                variant="contained"
                size="large"
                fullWidth
                disabled={submitting}
                onClick={onSubmit}
                startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
              >
                {submitting ? 'Enviando...' : 'Enviar resposta'}
              </Button>
            </Stack>
          )}
        </Paper>
      </Container>
    </Box>
  )
}
