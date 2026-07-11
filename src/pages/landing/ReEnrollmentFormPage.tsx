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
  Checkbox,
  FormControl,
  FormControlLabel,
} from '@mui/material'
import { CheckCircle, School, Search, Person } from '@mui/icons-material'
import { MuiTelInput } from 'mui-tel-input'
import { enrollmentApi } from '@/api/enrollment.api'
import { plansApi } from '@/api/plans.api'
import { DatePickerField } from '@/components/common/DatePickerField'
import { AvailabilityEditor, availabilityDaySchema } from '@/components/common/AvailabilityEditor'
import { digitsToE164, e164ToDigits } from '@/utils/phone'
import type { StudentLookupResult } from '@/types'

function maskCpf(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

const PAYMENT_METHODS = [
  { value: 'credit_card', label: 'Cartão de crédito — Assinatura' },
  { value: 'pix', label: 'PIX — Valor integral do plano' },
]

const schema = z
  .object({
    cpf: z.string().min(14, 'CPF inválido'),
    email: z.string().min(1, 'E-mail obrigatório').email('E-mail inválido'),
    phone: z.string().min(1, 'Telefone obrigatório'),
    instagram: z.string().optional(),
    birth_date: z.string().min(1, 'Data de nascimento obrigatória'),
    availability: z.array(availabilityDaySchema).optional(),
    // Quando true, o aluno optou por NÃO renovar a matrícula.
    opt_out: z.boolean().optional(),
    // Campos de renovação — validados condicionalmente abaixo. Aceitam string
    // vazia (estado inicial dos selects) para não falharem o parse quando o
    // aluno opta por não renovar e os campos ficam ocultos/em branco.
    plan_id: z.string().optional(),
    payment_method: z.string().optional(),
    start_date: z.string().optional(),
    contract_accepted: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    // Ao não renovar, os campos de plano/contrato não são exigidos.
    if (data.opt_out) return

    if (!data.availability || data.availability.length === 0) {
      ctx.addIssue({ code: 'custom', message: 'Informe sua disponibilidade de horários', path: ['availability'] })
    }
    if (!data.plan_id) {
      ctx.addIssue({ code: 'custom', message: 'Selecione um plano', path: ['plan_id'] })
    }
    if (data.payment_method !== 'pix' && data.payment_method !== 'credit_card') {
      ctx.addIssue({ code: 'custom', message: 'Selecione a forma de pagamento', path: ['payment_method'] })
    }
    if (!data.start_date) {
      ctx.addIssue({ code: 'custom', message: 'Informe a data de cobrança', path: ['start_date'] })
    }
    if (data.contract_accepted !== true) {
      ctx.addIssue({
        code: 'custom',
        message: 'Você deve aceitar os termos para continuar',
        path: ['contract_accepted'],
      })
    }
  })

type FormValues = z.infer<typeof schema>

export function ReEnrollmentFormPage() {
  const [submitted, setSubmitted] = useState(false)
  const [optedOut, setOptedOut] = useState(false)
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
    watch,
    setValue,
    getValues,
    reset,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      cpf: '',
      email: '',
      phone: '',
      instagram: '',
      birth_date: '',
      availability: [],
      opt_out: false,
      contract_accepted: false,
    },
  })

  const wantsToOptOut = watch('opt_out')

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
      setValue('phone', digitsToE164(found.phone), { shouldValidate: false })
      setValue('instagram', found.instagram ?? '', { shouldValidate: false })
      setValue('birth_date', found.birth_date ?? '', { shouldValidate: false })
      // Traz a disponibilidade já cadastrada para o aluno editar se quiser.
      reset((prev) => ({ ...prev, availability: found.availability ?? [] }))
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
        phone: e164ToDigits(values.phone),
        instagram: values.instagram || undefined,
        birth_date: values.birth_date,
        availability: values.availability?.length ? values.availability : undefined,
        opt_out: values.opt_out || undefined,
        plan_id: values.opt_out ? undefined : values.plan_id,
        payment_method: values.opt_out ? undefined : values.payment_method,
        start_date: values.opt_out ? undefined : values.start_date,
      })
      setOptedOut(!!values.opt_out)
      setSubmitted(true)
    } catch {
      setSubmitError('Ocorreu um erro ao enviar a solicitação. Tente novamente.')
    }
  }

  if (submitted) {
    return (
      <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2 }}>
        <Paper sx={{ p: 6, textAlign: 'center', maxWidth: 480 }}>
          <CheckCircle color="success" sx={{ fontSize: 72, mb: 2 }} />
          {optedOut ? (
            <>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Matrícula encerrada
              </Typography>
              <Typography color="text.secondary">
                Registramos que você não deseja renovar sua matrícula. Foi uma alegria ter você com a gente — sentiremos sua falta! As portas ficam sempre abertas para o seu retorno.
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Solicitação enviada!
              </Typography>
              <Typography color="text.secondary">
                Recebemos sua solicitação de rematrícula. Nossa equipe entrará em contato em breve para confirmar os detalhes.
              </Typography>
            </>
          )}
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
            Rematrícula
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
                        <MuiTelInput
                          label="Telefone *"
                          fullWidth
                          defaultCountry="BR"
                          value={field.value || ''}
                          onChange={(v) => field.onChange(v)}
                          error={!!errors.phone}
                          helperText={errors.phone?.message}
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
                    <Controller
                      name="birth_date"
                      control={control}
                      render={({ field }) => (
                        <DatePickerField
                          label="Data de nascimento *"
                          fullWidth
                          value={field.value || null}
                          onChange={(v) => field.onChange(v ?? '')}
                          error={!!errors.birth_date}
                          helperText={errors.birth_date?.message}
                        />
                      )}
                    />
                  </Grid>
                </Grid>

                <Divider />

                {/* Disponibilidade — pré-preenchida com o que o aluno já tem cadastrado */}
                <Box>
                  <AvailabilityEditor control={control} register={register} watch={watch} errors={errors} />
                  {!wantsToOptOut && typeof errors.availability?.message === 'string' && (
                    <Typography variant="caption" color="error">
                      {errors.availability.message}
                    </Typography>
                  )}
                </Box>

                <Divider />

                {/* Opção de não renovar */}
                <Controller
                  name="opt_out"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={!!field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      }
                      label={
                        <Typography variant="body2">
                          Não quero renovar minha matrícula.
                        </Typography>
                      }
                    />
                  )}
                />

                {wantsToOptOut && (
                  <Alert severity="warning">
                    Ao confirmar, sua matrícula será encerrada e você será removido das turmas em que estiver. Você pode rematricular-se a qualquer momento.
                  </Alert>
                )}

                {/* Seção: Plano e Início — oculta quando o aluno opta por não renovar */}
                {!wantsToOptOut && (
                  <>
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
                              {p.name}
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
                        <Controller
                          name="start_date"
                          control={control}
                          render={({ field }) => (
                            <DatePickerField
                              label="Data de cobrança *"
                              fullWidth
                              value={field.value || null}
                              onChange={(v) => field.onChange(v ?? '')}
                              error={!!errors.start_date}
                              helperText={errors.start_date?.message}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>

                    <Controller
                      name="contract_accepted"
                      control={control}
                      render={({ field }) => (
                        <FormControl error={!!errors.contract_accepted}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={!!field.value}
                                onChange={(e) => field.onChange(e.target.checked)}
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
                  </>
                )}

                {submitError && <Alert severity="error">{submitError}</Alert>}

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  color={wantsToOptOut ? 'error' : 'primary'}
                  disabled={isSubmitting}
                  startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : null}
                >
                  {isSubmitting
                    ? 'Enviando...'
                    : wantsToOptOut
                      ? 'Confirmar cancelamento'
                      : 'Enviar Solicitação'}
                </Button>
              </>
            )}

          </Stack>
        </Paper>
      </Container>
    </Box>
  )
}
