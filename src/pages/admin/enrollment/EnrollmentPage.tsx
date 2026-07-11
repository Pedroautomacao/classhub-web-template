import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useWatch, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import {
  Box, Paper, Stack, Typography, TextField, Grid,
  MenuItem, Button, CircularProgress, Alert, Divider, FormControlLabel, Checkbox,
  IconButton, Tooltip,
} from '@mui/material'
import { UploadFile, InsertDriveFile, Close } from '@mui/icons-material'
import { MuiTelInput } from 'mui-tel-input'
import { AvailabilityEditor, availabilityDaySchema } from '@/components/common/AvailabilityEditor'
import { DatePickerField } from '@/components/common/DatePickerField'
import { PageHeader } from '@/components/common/PageHeader'
import { enrollmentApi } from '@/api/enrollment.api'
import { plansApi } from '@/api/plans.api'
import { fileToBase64 } from '@/api/files.api'
import { useSnackbarStore } from '@/store/snackbar.store'
import { getApiError } from '@/utils/errors'
import { e164ToDigits } from '@/utils/phone'

const schema = z.object({
  full_name: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('E-mail inválido').or(z.literal('')).optional(),
  phone: z.string().optional(),
  instagram: z.string().optional(),
  cpf: z.string().min(1, 'CPF obrigatório'),
  birth_date: z.string().optional(),
  availability: z.array(availabilityDaySchema).optional(),
  coupon: z.string().optional(),
  plan_id: z.string().min(1, 'Selecione um plano'),
  payment_method: z.enum(['pix', 'credit_card'], { message: 'Selecione a forma de pagamento' }),
  payment_day: z.number({ message: 'Informe o dia' }).int().min(1).max(31),
  start_date: z.string().min(1, 'Data de cobrança obrigatória'),
  grace_period_days: z.number({ message: 'Informe um número' }).int().min(0).optional(),
  contract_accepted: z.literal(true, { message: 'O aluno deve aceitar o contrato' }),
})
type FormValues = z.infer<typeof schema>

const PAYMENT_LABELS: Record<string, string> = {
  credit_card: 'Cartão de crédito — Assinatura',
  pix: 'PIX — Valor integral do plano',
}

function maskCpf(value: string) {
  return value.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function EnrollmentPage() {
  const navigate = useNavigate()
  const { show } = useSnackbarStore()
  const { data: plansData } = useQuery({ queryKey: ['plans'], queryFn: () => plansApi.list({ only_active: true }) })
  const plans = plansData?.items ?? []

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [contractFile, setContractFile] = useState<File | null>(null)

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { grace_period_days: 0, contract_accepted: true, availability: [] },
  })

  const watchedPlanId = useWatch({ control, name: 'plan_id' })
  const watchedStartDate = useWatch({ control, name: 'start_date' })
  const selectedPlan = plans.find((p) => p.id === watchedPlanId)
  const calculatedEndDate = selectedPlan && watchedStartDate
    ? dayjs(watchedStartDate).add(selectedPlan.duration_months, 'month').format('DD/MM/YYYY')
    : null

  const mutation = useMutation({
    mutationFn: enrollmentApi.enroll,
    onSuccess: () => {
      show('Matrícula realizada com sucesso!')
      navigate('/admin/students')
    },
    onError: (error) => show(getApiError(error, 'Erro ao realizar matrícula.'), 'error'),
  })

  const onSubmit = async (values: FormValues) => {
    let contract_file: string | undefined
    let contract_file_name: string | undefined

    if (contractFile) {
      contract_file = await fileToBase64(contractFile)
      contract_file_name = contractFile.name
    }

    mutation.mutate({
      ...values,
      email: values.email || undefined,
      phone: e164ToDigits(values.phone) || undefined,
      instagram: values.instagram || undefined,
      cpf: values.cpf.replace(/\D/g, ''),
      birth_date: values.birth_date || undefined,
      availability: values.availability?.length ? values.availability : undefined,
      coupon: values.coupon || undefined,
      grace_period_days: values.grace_period_days ?? 0,
      contract_file,
      contract_file_name,
    })
  }

  return (
    <Box>
      <PageHeader
        title="Nova Matrícula"
        subtitle="Cadastre um novo aluno e crie o contrato"
        helpContent={{
          what: 'A tela de Nova Matrícula é usada para formalizar a entrada de um aluno na escola. Ela combina o cadastro do aluno, a escolha do plano, as informações de contrato e o upload do documento assinado em um único fluxo.',
          actions: [
            'Preencher dados pessoais do novo aluno (nome, contato, CPF, disponibilidade)',
            'Selecionar o plano contratado e definir as datas do contrato',
            'Informar um cupom (opcional) — registrado junto ao aluno',
            'Fazer upload do contrato em PDF assinado',
            'Criar automaticamente o aluno e o contrato ao finalizar',
          ],
          tips: [
            'Este formulário também está disponível publicamente — compartilhe o link para que o aluno preencha antes da conversa.',
            'Após a matrícula, lembre-se de alocar o aluno em uma turma na tela de Turmas.',
          ],
          flow: 'Lead → Formulário Público de Matrícula (opcional) → Análise → Nova Matrícula (aqui) → Alocação em Turma.',
        }}
      />
      <Paper sx={{ p: { xs: 3, md: 4 }, maxWidth: 900 }}>
        <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={3}>
          {mutation.isError && <Alert severity="error">Erro ao realizar matrícula. Verifique os dados e tente novamente.</Alert>}

          <Typography variant="subtitle1" fontWeight={600} color="primary">Dados do Aluno</Typography>
          <TextField label="Nome completo *" fullWidth error={!!errors.full_name} helperText={errors.full_name?.message} {...register('full_name')} />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="E-mail" type="email" fullWidth error={!!errors.email} helperText={errors.email?.message} {...register('email')} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <MuiTelInput
                    label="Telefone"
                    fullWidth
                    defaultCountry="BR"
                    value={field.value || ''}
                    onChange={(v) => field.onChange(v)}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Instagram" fullWidth {...register('instagram')} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="CPF *"
                fullWidth
                placeholder="000.000.000-00"
                inputProps={{ inputMode: 'numeric' }}
                error={!!errors.cpf}
                helperText={errors.cpf?.message}
                {...register('cpf')}
                onChange={(e) => setValue('cpf', maskCpf(e.target.value))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="birth_date"
                control={control}
                render={({ field }) => (
                  <DatePickerField
                    label="Data de nascimento"
                    fullWidth
                    value={field.value || null}
                    onChange={(v) => field.onChange(v ?? '')}
                  />
                )}
              />
            </Grid>
          </Grid>

          <AvailabilityEditor control={control} register={register} watch={watch} errors={errors} />

          <Divider />
          <Typography variant="subtitle1" fontWeight={600} color="primary">Plano e Pagamento</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField select label="Plano *" fullWidth error={!!errors.plan_id} helperText={errors.plan_id?.message} {...register('plan_id')} defaultValue="">
                <MenuItem value="" disabled>Selecione...</MenuItem>
                {plans.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField select label="Forma de pagamento *" fullWidth error={!!errors.payment_method} helperText={errors.payment_method?.message} {...register('payment_method')} defaultValue="">
                <MenuItem value="" disabled>Selecione...</MenuItem>
                {Object.entries(PAYMENT_LABELS).map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField label="Dia de vencimento *" type="number" fullWidth error={!!errors.payment_day} helperText={errors.payment_day?.message} {...register('payment_day', { valueAsNumber: true })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
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
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Data de fim (automática)"
                fullWidth
                value={calculatedEndDate ?? ''}
                disabled
                slotProps={{ inputLabel: { shrink: true } }}
                helperText={selectedPlan ? `${selectedPlan.duration_months} ${selectedPlan.duration_months === 1 ? 'mês' : 'meses'} do plano` : 'Selecione o plano e a data de início'}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField label="Carência (dias)" type="number" fullWidth {...register('grace_period_days', { valueAsNumber: true })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField label="Cupom (opcional)" fullWidth {...register('coupon')} />
            </Grid>
          </Grid>

          <Divider />
          <Typography variant="subtitle1" fontWeight={600} color="primary">Contrato</Typography>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            style={{ display: 'none' }}
            onChange={(e) => setContractFile(e.target.files?.[0] ?? null)}
          />
          {contractFile ? (
            <Stack direction="row" alignItems="center" spacing={1} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <InsertDriveFile color="primary" />
              <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {contractFile.name}
              </Typography>
              <Tooltip title="Remover arquivo">
                <IconButton size="small" onClick={() => { setContractFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}>
                  <Close fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          ) : (
            <Button
              variant="outlined"
              startIcon={<UploadFile />}
              onClick={() => fileInputRef.current?.click()}
              sx={{ alignSelf: 'flex-start' }}
            >
              Anexar contrato (PDF) — opcional
            </Button>
          )}

          <FormControlLabel
            control={<Checkbox defaultChecked {...register('contract_accepted')} />}
            label="Aluno aceitou os termos do contrato"
          />
          {errors.contract_accepted && (
            <Typography variant="caption" color="error">{errors.contract_accepted.message}</Typography>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => navigate('/admin/students')} disabled={mutation.isPending}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={mutation.isPending}
              startIcon={mutation.isPending ? <CircularProgress size={18} color="inherit" /> : null}>
              {mutation.isPending ? 'Matriculando...' : 'Realizar Matrícula'}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  )
}
