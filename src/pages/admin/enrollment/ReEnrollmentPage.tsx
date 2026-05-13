import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  Box, Paper, Stack, Typography, TextField, Grid,
  MenuItem, Button, CircularProgress, Alert, Divider,
  Autocomplete,
} from '@mui/material'
import { AvailabilityEditor, availabilityDaySchema } from '@/components/common/AvailabilityEditor'
import { DatePickerField } from '@/components/common/DatePickerField'
import { PageHeader } from '@/components/common/PageHeader'
import { enrollmentApi } from '@/api/enrollment.api'
import { plansApi } from '@/api/plans.api'
import { studentsApi } from '@/api/students.api'
import { useSnackbarStore } from '@/store/snackbar.store'
import { getApiError } from '@/utils/errors'
import type { Student } from '@/types'

const schema = z.object({
  plan_id: z.string().min(1, 'Selecione um plano'),
  payment_method: z.enum(['pix', 'credit_card'], { message: 'Selecione a forma de pagamento' }),
  payment_day: z.number({ message: 'Informe o dia' }).int().min(1).max(31),
  start_date: z.string().min(1, 'Data de cobrança obrigatória'),
  grace_period_days: z.number({ message: 'Informe um número' }).int().min(0).optional(),
  availability: z.array(availabilityDaySchema).optional(),
})
type FormValues = z.infer<typeof schema>

const PAYMENT_LABELS: Record<string, string> = {
  credit_card: 'Cartão de crédito — Assinatura',
  pix: 'PIX — Valor integral do plano',
}

export function ReEnrollmentPage() {
  const navigate = useNavigate()
  const { show } = useSnackbarStore()
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  const { data: plans = [] } = useQuery({ queryKey: ['plans'], queryFn: () => plansApi.list(true) })
  const { data: students = [] } = useQuery({ queryKey: ['students'], queryFn: () => studentsApi.list() })

  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { grace_period_days: 0, availability: [] },
  })

  const mutation = useMutation({
    mutationFn: enrollmentApi.reEnroll,
    onSuccess: () => { show('Rematrícula realizada!'); navigate('/admin/students') },
    onError: (error) => show(getApiError(error, 'Erro ao realizar rematrícula.'), 'error'),
  })

  const onSubmit = (values: FormValues) => {
    if (!selectedStudent) return
    mutation.mutate({
      student_id: selectedStudent.id,
      ...values,
      grace_period_days: values.grace_period_days ?? 0,
      availability: values.availability?.length ? values.availability : undefined,
    })
  }

  return (
    <Box>
      <PageHeader
        title="Rematrícula"
        subtitle="Reative um aluno e crie um novo contrato"
        helpContent={{
          what: 'A tela de Rematrícula é usada para renovar o vínculo de um aluno que estava inativo ou com contrato expirado. Ela busca o aluno pelo CPF ou e-mail e cria um novo contrato sem precisar recadastrar tudo.',
          actions: [
            'Localizar um aluno já existente pelo CPF ou e-mail',
            'Atualizar informações de contato e disponibilidade se necessário',
            'Selecionar o novo plano e definir as datas do novo contrato',
            'Fazer upload do novo contrato assinado',
            'Reativar automaticamente o aluno ao finalizar',
          ],
          tips: [
            'Use Rematrícula sempre que um aluno retornar — evita duplicar cadastros.',
            'O link público de rematrícula pode ser enviado diretamente ao aluno para ele preencher.',
          ],
          flow: 'Aluno com contrato expirado → Link Público de Rematrícula (opcional) → Rematrícula (aqui) → Novo Contrato ativo.',
        }}
      />
      <Paper sx={{ p: { xs: 3, md: 4 }, maxWidth: 900 }}>
        <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={3}>
          {mutation.isError && <Alert severity="error">Erro ao realizar rematrícula. Tente novamente.</Alert>}

          <Typography variant="subtitle1" fontWeight={600} color="primary">Selecionar Aluno</Typography>
          <Autocomplete
            options={students}
            getOptionLabel={(s) => `${s.full_name}${s.cpf ? ` — CPF: ${s.cpf}` : ''}`}
            value={selectedStudent}
            onChange={(_, v) => {
              setSelectedStudent(v)
              reset((prev) => ({ ...prev, availability: v?.availability ?? [] }))
            }}
            renderInput={(params) => (
              <TextField {...params} label="Buscar aluno *" placeholder="Nome ou CPF..." />
            )}
          />
          {selectedStudent && (
            <Alert severity="info">
              Aluno selecionado: <strong>{selectedStudent.full_name}</strong> — Status atual: {selectedStudent.status === 'active' ? 'Ativo' : 'Inativo'}
            </Alert>
          )}

          <AvailabilityEditor control={control} register={register} watch={watch} errors={errors} />

          <Divider />
          <Typography variant="subtitle1" fontWeight={600} color="primary">Novo Contrato</Typography>
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
              <TextField label="Carência (dias)" type="number" fullWidth {...register('grace_period_days', { valueAsNumber: true })} />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => navigate('/admin/students')} disabled={mutation.isPending}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={mutation.isPending || !selectedStudent}
              startIcon={mutation.isPending ? <CircularProgress size={18} color="inherit" /> : null}>
              {mutation.isPending ? 'Processando...' : 'Realizar Rematrícula'}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  )
}
