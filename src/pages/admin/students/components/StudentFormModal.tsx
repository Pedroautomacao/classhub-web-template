import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  Grid,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Divider,
  Typography,
  Box,
  Tooltip,
  Autocomplete,
} from '@mui/material'
import { Download, InsertDriveFile } from '@mui/icons-material'
import { MuiTelInput } from 'mui-tel-input'
import { AvailabilityEditor, availabilityDaySchema } from '@/components/common/AvailabilityEditor'
import { DatePickerField } from '@/components/common/DatePickerField'
import { contractsApi } from '@/api/contracts.api'
import { filesApi, downloadBase64File } from '@/api/files.api'
import { settingsApi } from '@/api/settings.api'
import { useSnackbarStore } from '@/store/snackbar.store'
import { digitsToE164, e164ToDigits } from '@/utils/phone'
import type { Student, AvailabilityDay } from '@/types'

function maskCpf(value: string) {
  return value.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

const schema = z.object({
  full_name: z.string().min(2, 'Nome obrigatório'),
  cpf: z.string().min(1, 'CPF obrigatório'),
  email: z.string().email('E-mail inválido').or(z.literal('')).optional(),
  phone: z.string().optional(),
  instagram: z.string().optional(),
  birth_date: z.string().optional(),
  availability: z.array(availabilityDaySchema).optional(),
  level: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

type SubmitValues = Omit<FormValues, 'availability' | 'email' | 'phone' | 'instagram' | 'birth_date' | 'level'> & {
  email?: string | null
  phone?: string | null
  instagram?: string | null
  birth_date?: string | null
  availability?: AvailabilityDay[] | null
  level?: string | null
}

interface Props {
  open: boolean
  student: Student | null
  loading?: boolean
  onClose: () => void
  onSubmit: (values: SubmitValues) => void
}

export function StudentFormModal({ open, student, loading = false, onClose, onSubmit }: Props) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'))
  const { show } = useSnackbarStore()

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
  })
  const availableLevels = settingsData?.level_options ?? []

  useEffect(() => {
    if (open && student) {
      reset({
        full_name: student.full_name,
        email: student.email ?? '',
        phone: digitsToE164(student.phone),
        instagram: student.instagram ?? '',
        cpf: student.cpf ? maskCpf(student.cpf) : '',
        birth_date: student.birth_date ?? '',
        availability: student.availability ?? [],
        level: student.level ?? '',
      })
    }
  }, [open, student, reset])

  const { data: contractsData } = useQuery({
    queryKey: ['contracts', { student_id: student?.id, contract_status: 'active' }],
    queryFn: () => contractsApi.list({ student_id: student!.id, contract_status: 'active' }),
    enabled: open && !!student,
  })
  const activeContract = contractsData?.items[0] ?? null
  const contractFile = activeContract?.file ?? null

  const handleDownload = async () => {
    if (!contractFile) return
    try {
      const data = await filesApi.getContent(contractFile.id)
      downloadBase64File(data.content, data.file_name)
    } catch {
      show('Erro ao baixar o arquivo.', 'error')
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={fullScreen}>
      <DialogTitle>Editar Aluno</DialogTitle>
      <DialogContent>
        <Stack component="form" id="student-form" onSubmit={handleSubmit((values) => onSubmit({
          ...values,
          cpf: values.cpf.replace(/\D/g, ''),
          email: values.email || null,
          phone: e164ToDigits(values.phone) || null,
          instagram: values.instagram || null,
          birth_date: values.birth_date || null,
          availability: values.availability?.length ? values.availability : null,
          level: values.level || null,
        }))} spacing={2} sx={{ pt: 1 }}>
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
              <Controller
                name="level"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    options={availableLevels}
                    value={field.value ?? ''}
                    onChange={(_, v) => field.onChange(v ?? '')}
                    renderInput={(params) => (
                      <TextField {...params} label="Nível" placeholder="Selecionar nível..." />
                    )}
                  />
                )}
              />
            </Grid>
          </Grid>

          <AvailabilityEditor control={control} register={register} watch={watch} errors={errors} />

          {activeContract && (
            <>
              <Divider />
              <Typography variant="subtitle2" color="text.secondary">
                Contrato ativo
              </Typography>
              {contractFile ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <InsertDriveFile color="primary" fontSize="small" />
                  <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {contractFile.file_name}
                  </Typography>
                  <Tooltip title="Baixar documento">
                    <Button size="small" startIcon={<Download />} onClick={handleDownload}>
                      Baixar
                    </Button>
                  </Tooltip>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Nenhum documento anexado a este contrato.
                </Typography>
              )}
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button
          type="submit"
          form="student-form"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
