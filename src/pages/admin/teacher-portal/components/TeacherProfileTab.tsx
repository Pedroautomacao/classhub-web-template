import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert, Box, Button, CircularProgress, Divider, Stack, TextField, Typography,
} from '@mui/material'
import { Save, InfoOutlined } from '@mui/icons-material'
import { teachersApi } from '@/api/teachers.api'
import { useSnackbarStore } from '@/store/snackbar.store'
import { getApiError } from '@/utils/errors'
import { AvailabilityEditor, availabilityDaySchema } from '@/components/common/AvailabilityEditor'

const schema = z.object({
  email: z.string().email('E-mail inválido').min(1),
  phone: z.string().optional(),
  availability: z.array(availabilityDaySchema),
})

type FormValues = z.infer<typeof schema>

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 10)
    return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
  return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

export function TeacherProfileTab() {
  const qc = useQueryClient()
  const { show } = useSnackbarStore()

  const { data: teacher, isLoading, isError } = useQuery({
    queryKey: ['my-profile'],
    queryFn: teachersApi.getMe,
    retry: false,
  })

  const { register, handleSubmit, reset, watch, control, setValue, formState: { errors, isDirty } } =
    useForm<FormValues>({
      resolver: zodResolver(schema) as any,
      defaultValues: { email: '', phone: '', availability: [] },
    })

  useEffect(() => {
    if (teacher) {
      reset({
        email: teacher.email,
        phone: teacher.phone ? maskPhone(teacher.phone) : '',
        availability: teacher.availability ?? [],
      })
    }
  }, [teacher, reset])

  const mutation = useMutation({
    mutationFn: (data: FormValues) => teachersApi.updateMe(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-profile'] })
      qc.invalidateQueries({ queryKey: ['teachers'] })
      show('Perfil atualizado!')
    },
    onError: (err) => show(getApiError(err, 'Erro ao salvar perfil.'), 'error'),
  })

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (isError) {
    return (
      <Alert severity="info" icon={<InfoOutlined />} sx={{ maxWidth: 520 }}>
        Seu usuário não está vinculado a um cadastro de professor. Entre em contato com a administração para habilitar a edição de perfil.
      </Alert>
    )
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit((v) => mutation.mutate(v))}
      sx={{ maxWidth: 600 }}
    >
      <Stack spacing={3}>
        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary">Nome</Typography>
          <Typography variant="body1" fontWeight={500}>{teacher?.name}</Typography>
        </Stack>

        <Divider />

        <TextField
          label="E-mail *"
          type="email"
          fullWidth
          error={!!errors.email}
          helperText={errors.email?.message}
          {...register('email')}
        />

        <TextField
          label="Telefone"
          fullWidth
          placeholder="(11) 99999-9999"
          {...register('phone')}
          onChange={(e) => setValue('phone', maskPhone(e.target.value), { shouldDirty: true })}
        />

        <AvailabilityEditor control={control} register={register} watch={watch} errors={errors} />

        <Box>
          <Button
            type="submit"
            variant="contained"
            startIcon={mutation.isPending ? <CircularProgress size={16} color="inherit" /> : <Save />}
            disabled={mutation.isPending || !isDirty}
          >
            Salvar alterações
          </Button>
        </Box>
      </Stack>
    </Box>
  )
}
