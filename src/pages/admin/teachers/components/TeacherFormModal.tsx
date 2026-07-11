import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import {
  Autocomplete, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, TextField, Grid, FormControlLabel,
  Switch, CircularProgress, useMediaQuery, useTheme,
  Divider, InputAdornment, Typography,
} from '@mui/material'
import { MuiTelInput } from 'mui-tel-input'
import type { Teacher, User } from '@/types'
import { teachersApi } from '@/api/teachers.api'
import { AvailabilityEditor, availabilityDaySchema } from '@/components/common/AvailabilityEditor'
import { digitsToE164, e164ToDigits } from '@/utils/phone'

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().optional(),
  is_training: z.boolean(),
  hourly_rate: z.coerce.number().positive('Informe o valor por hora/aula'),
  availability: z.array(availabilityDaySchema).min(1, 'Adicione pelo menos um horário de disponibilidade'),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  teacher?: Teacher | null
  loading?: boolean
  onClose: () => void
  onSubmit: (v: FormValues) => void
}

export function TeacherFormModal({ open, teacher, loading = false, onClose, onSubmit }: Props) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'))
  const isEdit = !!teacher

  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userError, setUserError] = useState('')

  // Create mode: only users not yet linked to a teacher
  const { data: availableUsers = [] } = useQuery({
    queryKey: ['teachers-available-users'],
    queryFn: teachersApi.availableUsers,
    enabled: open && !isEdit,
  })

  // Edit mode: all active users not linked to other teachers + current linked user
  const { data: allTeacherUsers = [] } = useQuery({
    queryKey: ['teachers-all-users', teacher?.email],
    queryFn: () => teachersApi.allTeacherUsers(teacher?.email),
    enabled: open && isEdit,
  })

  const users = isEdit ? allTeacherUsers : availableUsers

  const { register, handleSubmit, reset, watch, setValue, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: { availability: [] },
  })

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setUserError('')
      setSelectedUser(null)
      reset(teacher
        ? {
            name: teacher.name,
            email: teacher.email,
            phone: digitsToE164(teacher.phone),
            is_training: teacher.is_training,
            hourly_rate: teacher.hourly_rate,
            availability: teacher.availability ?? [],
          }
        : { name: '', email: '', phone: '', is_training: false, hourly_rate: undefined as any, availability: [] }
      )
    }
  }, [open, teacher, reset])

  // Pre-select linked user once allTeacherUsers loads (edit mode)
  useEffect(() => {
    if (open && teacher && allTeacherUsers.length > 0) {
      const linked = allTeacherUsers.find((u) => u.email === teacher.email)
      if (linked) setSelectedUser(linked)
    }
  }, [open, teacher, allTeacherUsers])

  const handleUserSelect = (_: unknown, user: User | null) => {
    setSelectedUser(user)
    setUserError('')
    if (user) {
      setValue('name', user.full_name)
      setValue('email', user.email ?? '')
      setValue('phone', digitsToE164(user.phone))
    } else {
      setValue('name', '')
      setValue('email', '')
      setValue('phone', '')
    }
  }

  const handleFormSubmit = handleSubmit((values) => {
    if (!selectedUser) {
      setUserError('Selecione o usuário do professor')
      return
    }
    onSubmit({ ...values, phone: e164ToDigits(values.phone) || undefined })
  })

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={fullScreen}>
      <DialogTitle>{isEdit ? 'Editar Professor' : 'Novo Professor'}</DialogTitle>
      <DialogContent sx={{ overflowX: 'hidden' }}>
        <Stack component="form" id="teacher-form" onSubmit={handleFormSubmit} spacing={2} sx={{ pt: 1 }}>

          <Autocomplete
            options={users}
            getOptionLabel={(u) => `${u.full_name} (${u.email})`}
            isOptionEqualToValue={(option, value) => option.email === value?.email}
            value={selectedUser}
            onChange={handleUserSelect}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Usuário *"
                error={!!userError}
                helperText={userError || (isEdit
                  ? 'Alterar o usuário atualiza nome, e-mail e telefone do professor'
                  : 'Selecione um usuário com perfil Professor')}
              />
            )}
          />

          {!isEdit && users.length === 0 && (
            <Typography variant="caption" color="text.secondary">
              Nenhum usuário com perfil Professor disponível para vincular.
            </Typography>
          )}

          <Divider />

          <TextField
            label="Nome *"
            fullWidth
            error={!!errors.name}
            helperText={errors.name?.message}
            slotProps={{
              inputLabel: { shrink: !!selectedUser || undefined },
              input: { readOnly: !!selectedUser },
            }}
            {...register('name')}
          />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="E-mail *"
                type="email"
                fullWidth
                error={!!errors.email}
                helperText={errors.email?.message}
                slotProps={{
                  inputLabel: { shrink: !!selectedUser || undefined },
                  input: { readOnly: !!selectedUser },
                }}
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
                    disabled={!!selectedUser}
                    value={field.value || ''}
                    onChange={(v) => field.onChange(v)}
                  />
                )}
              />
            </Grid>
          </Grid>

          <TextField
            label="Valor por hora/aula *"
            type="number"
            fullWidth
            inputProps={{ step: '0.01', min: '0' }}
            InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
            error={!!errors.hourly_rate}
            helperText={errors.hourly_rate?.message}
            {...register('hourly_rate')}
          />

          <FormControlLabel
            control={<Switch checked={watch('is_training')} onChange={(e) => setValue('is_training', e.target.checked)} />}
            label="Em treinamento"
          />

          <Divider />

          <AvailabilityEditor control={control} register={register} watch={watch} errors={errors} />
          {(errors.availability as any)?.message && (
            <Typography variant="caption" color="error">
              {(errors.availability as any).message}
            </Typography>
          )}

        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button type="submit" form="teacher-form" variant="contained" disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}>
          {isEdit ? 'Salvar' : 'Criar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
