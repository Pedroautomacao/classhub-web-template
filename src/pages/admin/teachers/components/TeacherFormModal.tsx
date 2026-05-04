import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import {
  Autocomplete, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, TextField, Grid, FormControlLabel,
  Switch, CircularProgress, useMediaQuery, useTheme,
  Divider, InputAdornment, Typography,
} from '@mui/material'
import type { Teacher, User } from '@/types'
import { teachersApi } from '@/api/teachers.api'
import { AvailabilityEditor, availabilityDaySchema } from '@/components/common/AvailabilityEditor'

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

  const { data: availableUsers = [] } = useQuery({
    queryKey: ['teachers-available-users'],
    queryFn: teachersApi.availableUsers,
    enabled: open && !isEdit,
  })

  const { register, handleSubmit, reset, watch, setValue, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: { availability: [] },
  })

  useEffect(() => {
    if (open) {
      setSelectedUser(null)
      reset(teacher
        ? {
            name: teacher.name,
            email: teacher.email,
            phone: teacher.phone ?? '',
            is_training: teacher.is_training,
            hourly_rate: teacher.hourly_rate,
            availability: teacher.availability ?? [],
          }
        : { name: '', email: '', phone: '', is_training: false, hourly_rate: undefined as any, availability: [] }
      )
    }
  }, [open, teacher, reset])

  const handleUserSelect = (_: unknown, user: User | null) => {
    setSelectedUser(user)
    if (user) {
      setValue('name', user.full_name)
      setValue('email', user.email ?? '')
      setValue('phone', user.phone ?? '')
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={fullScreen}>
      <DialogTitle>{isEdit ? 'Editar Professor' : 'Novo Professor'}</DialogTitle>
      <DialogContent sx={{ overflowX: 'hidden' }}>
        <Stack component="form" id="teacher-form" onSubmit={handleSubmit(onSubmit)} spacing={2} sx={{ pt: 1 }}>

          {!isEdit && (
            <>
              <Autocomplete
                options={availableUsers}
                getOptionLabel={(u) => `${u.full_name} (${u.email})`}
                value={selectedUser}
                onChange={handleUserSelect}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Vincular usuário existente"
                    helperText="Selecione um usuário com perfil Professor para preencher os dados automaticamente"
                  />
                )}
              />
              {availableUsers.length === 0 && (
                <Typography variant="caption" color="text.secondary">
                  Nenhum usuário com perfil Professor disponível para vincular.
                </Typography>
              )}
              <Divider />
            </>
          )}

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
              <TextField
                label="Telefone"
                fullWidth
                slotProps={{
                  inputLabel: { shrink: !!selectedUser || undefined },
                  input: { readOnly: !!selectedUser },
                }}
                {...register('phone')}
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
