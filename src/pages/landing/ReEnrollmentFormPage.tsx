import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { settingsApi } from '@/api/settings.api'
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
  MenuItem,
} from '@mui/material'
import { CheckCircle, School } from '@mui/icons-material'
import { enrollmentApi } from '@/api/enrollment.api'
import { plansApi } from '@/api/plans.api'

function maskCpf(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

const PAYMENT_METHODS = [
  { value: 'pix', label: 'PIX' },
  { value: 'credit_card', label: 'Cartão de crédito' },
  { value: 'bank_slip', label: 'Boleto' },
  { value: 'cash', label: 'Dinheiro' },
]

const schema = z.object({
  cpf: z.string().min(14, 'CPF inválido'),
  plan_id: z.string().min(1, 'Selecione um plano'),
  payment_method: z.enum(['pix', 'credit_card', 'bank_slip', 'cash'], { message: 'Selecione a forma de pagamento' }),
  start_date: z.string().min(1, 'Informe a data de início'),
})

type FormValues = z.infer<typeof schema>

export function ReEnrollmentFormPage() {
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: landing } = useQuery({
    queryKey: ['landing'],
    queryFn: settingsApi.getLanding,
    staleTime: 5 * 60 * 1000,
  })

  const { data: plans = [] } = useQuery({
    queryKey: ['plans', 'public'],
    queryFn: plansApi.listPublic,
  })

  const {
    handleSubmit,
    control,
    register,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (values: FormValues) => {
    setError(null)
    try {
      await enrollmentApi.publicReEnroll({
        cpf: values.cpf,
        plan_id: values.plan_id,
        payment_method: values.payment_method,
        start_date: values.start_date,
      })
      setSubmitted(true)
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 404) {
        setError('Aluno não encontrado. Verifique o CPF informado.')
      } else {
        setError('Ocorreu um erro ao enviar o formulário. Tente novamente.')
      }
    }
  }

  if (submitted) {
    return (
      <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2 }}>
        <Paper sx={{ p: 6, textAlign: 'center', maxWidth: 480 }}>
          <CheckCircle color="success" sx={{ fontSize: 72, mb: 2 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Solicitação enviada!
          </Typography>
          <Typography color="text.secondary">
            Recebemos sua solicitação de rematrícula. Nossa equipe entrará em contato em breve para confirmar os detalhes.
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
            Formulário de Rematrícula
          </Typography>
          <Typography color="text.secondary" textAlign="center" mt={1}>
            Informe seu CPF para renovar sua matrícula.
          </Typography>
        </Stack>

        <Paper sx={{ p: { xs: 3, md: 4 } }}>
          <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={3}>
            {error && <Alert severity="error">{error}</Alert>}

            <Typography variant="subtitle1" fontWeight={600} color="primary">
              Identificação
            </Typography>

            <Controller
              name="cpf"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <TextField
                  label="CPF *"
                  fullWidth
                  placeholder="000.000.000-00"
                  error={!!errors.cpf}
                  helperText={errors.cpf?.message}
                  value={field.value}
                  onChange={(e) => field.onChange(maskCpf(e.target.value))}
                  inputProps={{ inputMode: 'numeric' }}
                />
              )}
            />

            <Divider />

            <Typography variant="subtitle1" fontWeight={600} color="primary">
              Plano e Início
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Plano *"
                  select
                  fullWidth
                  defaultValue=""
                  error={!!errors.plan_id}
                  helperText={errors.plan_id?.message}
                  {...register('plan_id')}
                >
                  <MenuItem value="" disabled>Selecione...</MenuItem>
                  {plans.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name} — {p.duration_months}m
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Forma de pagamento *"
                  select
                  fullWidth
                  defaultValue=""
                  error={!!errors.payment_method}
                  helperText={errors.payment_method?.message}
                  {...register('payment_method')}
                >
                  <MenuItem value="" disabled>Selecione...</MenuItem>
                  {PAYMENT_METHODS.map((m) => (
                    <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 5 }}>
                <TextField
                  label="Data de início *"
                  type="date"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  error={!!errors.start_date}
                  helperText={errors.start_date?.message}
                  {...register('start_date')}
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : null}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  )
}
