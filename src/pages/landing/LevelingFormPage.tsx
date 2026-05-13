import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  Checkbox,
  FormControlLabel,
  FormControl,
  FormGroup,
  Radio,
  RadioGroup,
  Skeleton,
} from '@mui/material'
import { CheckCircle, School } from '@mui/icons-material'
import { levelingApi } from '@/api/leveling.api'
import { levelingTemplatesApi } from '@/api/leveling-templates.api'
import { settingsApi } from '@/api/settings.api'
import { DatePickerField } from '@/components/common/DatePickerField'
import type { TemplateQuestion } from '@/types'

// ── Personal info schema (fixed) ─────────────────────────────────────────────

const personalSchema = z.object({
  full_name: z.string().min(3, 'Nome completo é obrigatório'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  instagram: z.string().optional(),
  birth_date: z.string().optional(),
  cpf: z.string().optional(),
})

type PersonalValues = z.infer<typeof personalSchema>

// ── Dynamic question renderer ─────────────────────────────────────────────────

interface QuestionFieldProps {
  question: TemplateQuestion
  value: string | string[]
  onChange: (v: string | string[]) => void
  error?: string
}

function QuestionField({ question, value, onChange, error }: QuestionFieldProps) {
  if (question.type === 'text') {
    return (
      <TextField
        label={question.text + (question.required ? ' *' : '')}
        multiline
        rows={3}
        fullWidth
        value={value as string}
        onChange={(e) => onChange(e.target.value)}
        error={!!error}
        helperText={error}
      />
    )
  }

  if (question.type === 'single_choice') {
    return (
      <FormControl error={!!error} component="fieldset" fullWidth>
        <Typography variant="body2" fontWeight={500} mb={0.5}>
          {question.text}{question.required ? ' *' : ''}
        </Typography>
        <RadioGroup value={value as string} onChange={(e) => onChange(e.target.value)}>
          {(question.options ?? []).map((opt) => (
            <FormControlLabel
              key={opt}
              value={opt}
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
      <Typography variant="body2" fontWeight={500} mb={0.5}>
        {question.text}{question.required ? ' *' : ''}
      </Typography>
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

// ── Main page ─────────────────────────────────────────────────────────────────

export function LevelingFormPage() {
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [answerErrors, setAnswerErrors] = useState<Record<string, string>>({})

  const { data: landing } = useQuery({
    queryKey: ['landing'],
    queryFn: settingsApi.getLanding,
    staleTime: 5 * 60 * 1000,
  })

  const { data: template, isLoading: templateLoading } = useQuery({
    queryKey: ['leveling-template-active'],
    queryFn: levelingTemplatesApi.getActive,
    retry: false,
  })

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PersonalValues>({
    resolver: zodResolver(personalSchema),
  })

  const validateAnswers = (questions: TemplateQuestion[]) => {
    const newErrors: Record<string, string> = {}
    for (const q of questions) {
      if (!q.required) continue
      const val = answers[q.id]
      if (!val || (Array.isArray(val) && val.length === 0) || val === '') {
        newErrors[q.id] = 'Este campo é obrigatório'
      }
    }
    setAnswerErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const onSubmit = async (personal: PersonalValues) => {
    if (template && !validateAnswers(template.questions)) return

    setSubmitError(null)
    try {
      await levelingApi.submit({
        full_name: personal.full_name,
        email: personal.email,
        phone: personal.phone,
        instagram: personal.instagram || undefined,
        birth_date: personal.birth_date || undefined,
        cpf: personal.cpf || undefined,
        answers: template ? JSON.stringify(answers) : undefined,
        template_id: template?.id,
      })
      setSubmitted(true)
    } catch {
      setSubmitError('Ocorreu um erro ao enviar o formulário. Tente novamente.')
    }
  }

  if (submitted) {
    return (
      <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2 }}>
        <Paper sx={{ p: 6, textAlign: 'center', maxWidth: 480 }}>
          <CheckCircle color="success" sx={{ fontSize: 72, mb: 2 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Formulário enviado!
          </Typography>
          <Typography color="text.secondary">
            Recebemos suas informações. Nossa equipe entrará em contato em breve
            para agendar seu nivelamento.
          </Typography>
        </Paper>
      </Box>
    )
  }

  return (
    <Box sx={{ py: { xs: 4, md: 8 }, px: 2 }}>
      <Container maxWidth="sm">
        <Stack alignItems="center" mb={4}>
          <School color="primary" sx={{ fontSize: 48, mb: 1 }} />
          {landing?.school_name && (
            <Typography variant="subtitle1" color="primary" fontWeight={600} textAlign="center">
              {landing.school_name}
            </Typography>
          )}
          <Typography variant="h4" fontWeight={700} textAlign="center" color="primary">
            Formulário de Nivelamento
          </Typography>
          <Typography color="text.secondary" textAlign="center" mt={1}>
            Preencha os dados abaixo e nossa equipe entrará em contato para
            agendar sua aula de nivelamento gratuita.
          </Typography>
        </Stack>

        <Paper sx={{ p: { xs: 3, md: 4 } }}>
          <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={3}>
            {submitError && <Alert severity="error">{submitError}</Alert>}

            {/* Dados pessoais — sempre fixos */}
            <Typography variant="subtitle1" fontWeight={600} color="primary">
              Dados Pessoais
            </Typography>

            <TextField
              label="Nome completo *"
              fullWidth
              error={!!errors.full_name}
              helperText={errors.full_name?.message}
              {...register('full_name')}
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="E-mail *"
                  type="email"
                  fullWidth
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  {...register('email')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Telefone / WhatsApp *"
                  fullWidth
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                  {...register('phone')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Instagram (opcional)"
                  fullWidth
                  placeholder="@seuinstagram"
                  {...register('instagram')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="birth_date"
                  control={control}
                  render={({ field }) => (
                    <DatePickerField
                      label="Data de nascimento (opcional)"
                      fullWidth
                      value={field.value || null}
                      onChange={(v) => field.onChange(v ?? '')}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="CPF (opcional)"
                  fullWidth
                  {...register('cpf')}
                />
              </Grid>
            </Grid>

            {/* Perguntas dinâmicas do template */}
            {templateLoading ? (
              <>
                <Divider />
                <Skeleton variant="rounded" height={40} />
                <Skeleton variant="rounded" height={80} />
                <Skeleton variant="rounded" height={80} />
              </>
            ) : template ? (
              <>
                <Divider />
                <Typography variant="subtitle1" fontWeight={600} color="primary">
                  Perguntas de Nivelamento
                </Typography>
                {template.questions.map((q) => (
                  <QuestionField
                    key={q.id}
                    question={q}
                    value={answers[q.id] ?? (q.type === 'multiple_choice' ? [] : '')}
                    onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
                    error={answerErrors[q.id]}
                  />
                ))}
              </>
            ) : null}

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : null}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Formulário'}
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  )
}
