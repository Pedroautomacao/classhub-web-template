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
  InputAdornment,
} from '@mui/material'
import { CheckCircle, School, Search, Person } from '@mui/icons-material'
import { enrollmentApi } from '@/api/enrollment.api'
import { plansApi } from '@/api/plans.api'
import type { StudentLookupResult } from '@/types'

function maskCpf(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

const PAYMENT_METHODS = [
  { value: 'credit_card', label: 'Cartão de crédito — Assinatura' },
  { value: 'pix', label: 'PIX — Valor integral do plano' },
]

const schema = z.object({
  cpf: z.string().min(14, 'CPF inválido'),
  email: z.string().min(1, 'E-mail obrigatório').email('E-mail inválido'),
  phone: z.string().min(14, 'Telefone inválido'),
  instagram: z.string().optional(),
  birth_date: z.string().min(1, 'Data de nascimento obrigatória'),
  plan_id: z.string().min(1, 'Selecione um plano'),
  payment_method: z.enum(['pix', 'credit_card'], { message: 'Selecione a forma de pagamento' }),
  start_date: z.string().min(1, 'Informe a data de cobrança'),
})

type FormValues = z.infer<typeof schema>

export function ReEnrollmentFormPage() {
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [student, setStudent] = useState<StudentLookupResult | null>(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)

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
    setValue,
    getValues,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { cpf: '', email: '', phone: '', instagram: '', birth_date: '' },
  })

  const handleSearch = async () => {
    const cpf = getValues('cpf')
    const valid = await trigger('cpf')
    if (!valid) return

    setLookupLoading(true)
    setLookupError(null)
    setStudent(null)

    try {
      const found = await enrollmentApi.lookupByCpf(cpf.replace(/\D/g, ''))
      setStudent(found)
      setValue('email', found.email ?? '', { shouldValidate: false })
      setValue('phone', found.phone ? maskPhone(found.phone) : '', { shouldValidate: false })
      setValue('instagram', found.instagram ?? '', { shouldValidate: false })
      setValue('birth_date', found.birth_date ?? '', { shouldValidate: false })
    } catch {
      setLookupError('Aluno não encontrado. Verifique o CPF informado.')
    } finally {
      setLookupLoading(false)
    }
  }

  const onSubmit = async (values: FormValues) => {
    if (!student) return
    setSubmitError(null)
    try {
      await enrollmentApi.publicReEnroll({
        cpf: values.cpf.replace(/\D/g, ''),
        email: values.email,
        phone: values.phone,
        instagram: values.instagram || undefined,
        birth_date: values.birth_date,
        plan_id: values.plan_id,
        payment_method: values.payment_method,
        start_date: values.start_date,
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

            {/* Seção: Identificação */}
            <Typography variant="subtitle1" fontWeight={600} color="primary">
              Identificação
            </Typography>

            <Stack direction="row" spacing={1} alignItems="flex-start">
              <Controller
                name="cpf"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="CPF *"
                    fullWidth
                    placeholder="000.000.000-00"
                    error={!!errors.cpf}
                    helperText={errors.cpf?.message}
                    value={field.value}
                    onChange={(e) => {
                      field.onChange(maskCpf(e.target.value))
                      if (student) setStudent(null)
                      if (lookupError) setLookupError(null)
                    }}
                    inputProps={{ inputMode: 'numeric' }}
                    disabled={lookupLoading}
                  />
                )}
              />
              <Button
                variant="outlined"
                onClick={handleSearch}
                disabled={lookupLoading}
                sx={{ height: 56, minWidth: 110, flexShrink: 0 }}
                startIcon={lookupLoading ? <CircularProgress size={16} color="inherit" /> : <Search />}
              >
                {lookupLoading ? 'Buscando...' : 'Buscar'}
              </Button>
            </Stack>

            {lookupError && <Alert severity="error">{lookupError}</Alert>}

            {/* Seção: Confirmação de dados (aparece após CPF encontrado) */}
            {student && (
              <>
                <Alert severity="success" icon={<Person />}>
                  Aluno encontrado: <strong>{student.full_name}</strong>. Confirme e atualize seus dados abaixo.
                </Alert>

                <Divider />

                <Typography variant="subtitle1" fontWeight={600} color="primary">
                  Confirme seus dados
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="CPF"
                      fullWidth
                      value={getValues('cpf')}
                      disabled
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="E-mail *"
                      fullWidth
                      error={!!errors.email}
                      helperText={errors.email?.message}
                      {...register('email')}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Controller
                      name="phone"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          label="Telefone *"
                          fullWidth
                          placeholder="(11) 99999-9999"
                          error={!!errors.phone}
                          helperText={errors.phone?.message}
                          value={field.value}
                          onChange={(e) => field.onChange(maskPhone(e.target.value))}
                          inputProps={{ inputMode: 'numeric' }}
                          slotProps={{ input: { startAdornment: <InputAdornment position="start">📱</InputAdornment> } }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Instagram"
                      fullWidth
                      placeholder="@usuario"
                      error={!!errors.instagram}
                      helperText={errors.instagram?.message}
                      {...register('instagram')}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Data de nascimento *"
                      type="date"
                      fullWidth
                      slotProps={{ inputLabel: { shrink: true } }}
                      error={!!errors.birth_date}
                      helperText={errors.birth_date?.message}
                      {...register('birth_date')}
                    />
                  </Grid>
                </Grid>

                <Divider />

                {/* Seção: Plano e Início */}
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

                {submitError && <Alert severity="error">{submitError}</Alert>}

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
              </>
            )}

          </Stack>
        </Paper>
      </Container>
    </Box>
  )
}
