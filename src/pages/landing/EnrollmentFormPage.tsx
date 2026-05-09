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
  Checkbox,
  FormControlLabel,
  FormControl,
  MenuItem,
} from '@mui/material'
import { CheckCircle, School } from '@mui/icons-material'
import { enrollmentApi } from '@/api/enrollment.api'
import { plansApi } from '@/api/plans.api'

const PAYMENT_METHODS = [
  { value: 'credit_card', label: 'Cartão de crédito — Assinatura' },
  { value: 'pix', label: 'PIX — Valor integral do plano' },
]

const schema = z.object({
  full_name: z.string().min(3, 'Nome completo é obrigatório'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z.string().min(10, 'Telefone inválido'),
  instagram: z.string().optional(),
  birth_date: z.string().optional(),
  cpf: z.string().optional(),
  plan_id: z.string().min(1, 'Selecione um plano'),
  payment_method: z.enum(['pix', 'credit_card'], { message: 'Selecione a forma de pagamento' }),
  start_date: z.string().min(1, 'Informe a data de cobrança'),
  contract_accepted: z.literal(true, {
    error: 'Você deve aceitar os termos para continuar',
  }),
})

type FormValues = z.infer<typeof schema>

export function EnrollmentFormPage() {
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
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { contract_accepted: undefined as unknown as true },
  })

  const onSubmit = async (values: FormValues) => {
    setError(null)
    try {
      await enrollmentApi.publicEnroll({
        full_name: values.full_name,
        email: values.email || undefined,
        phone: values.phone,
        instagram: values.instagram || undefined,
        birth_date: values.birth_date || undefined,
        cpf: values.cpf || undefined,
        plan_id: values.plan_id,
        payment_method: values.payment_method,
        start_date: values.start_date,
        contract_accepted: values.contract_accepted,
      })
      setSubmitted(true)
    } catch {
      setError('Ocorreu um erro ao enviar o formulário. Tente novamente.')
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
            Recebemos sua solicitação de matrícula. Nossa equipe entrará em contato em breve para confirmar os detalhes.
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
            Formulário de Matrícula
          </Typography>
          <Typography color="text.secondary" textAlign="center" mt={1}>
            Preencha os dados abaixo para solicitar sua matrícula. Nossa equipe entrará em contato para finalizar o processo.
          </Typography>
        </Stack>

        <Paper sx={{ p: { xs: 3, md: 4 } }}>
          <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={3}>
            {error && <Alert severity="error">{error}</Alert>}

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
                  label="E-mail"
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
                <TextField
                  label="Data de nascimento (opcional)"
                  type="date"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  {...register('birth_date')}
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
                  label="Data de cobrança *"
                  type="date"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  error={!!errors.start_date}
                  helperText={errors.start_date?.message}
                  {...register('start_date')}
                />
              </Grid>
            </Grid>

            <Divider />

            <Controller
              name="contract_accepted"
              control={control}
              render={({ field }) => (
                <FormControl error={!!errors.contract_accepted}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={!!field.value}
                        onChange={(e) => field.onChange(e.target.checked || undefined)}
                      />
                    }
                    label={
                      <Typography variant="body2">
                        Declaro que recebi, li e aceito os termos de contrato. *
                      </Typography>
                    }
                  />
                  {errors.contract_accepted && (
                    <Typography variant="caption" color="error" mt={0.5}>
                      {errors.contract_accepted.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />

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
