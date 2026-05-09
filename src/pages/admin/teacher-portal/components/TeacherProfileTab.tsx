import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Button, CircularProgress, Divider, Stack, TextField, Typography,
} from '@mui/material'
import { Save } from '@mui/icons-material'
import { teachersApi } from '@/api/teachers.api'
import { useSnackbarStore } from '@/store/snackbar.store'
import { getApiError } from '@/utils/errors'
import { AvailabilityEditor, availabilityDaySchema } from '@/components/common/AvailabilityEditor'

const schema = z.object({
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

  const { data: teacher, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: teachersApi.getMe,
  })

  const { register, handleSubmit, reset, watch, control, setValue, formState: { errors, isDirty } } =
    useForm<FormValues>({
      resolver: zodResolver(schema) as any,
      defaultValues: { phone: '', availability: [] },
    })

  useEffect(() => {
    if (teacher) {
      reset({
        phone: teacher.phone ? maskPhone(teacher.phone) : '',
        availability: teacher.availability ?? [],
      })
    }
  }, [teacher, reset])

  const mutation = useMutation({
    mutationFn: (data: FormValues) => teachersApi.updateMe(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-profile'] })
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

  return (
    <Box
      component="form"
      onSubmit={handleSubmit((v) => mutation.mutate(v))}
      sx={{ maxWidth: 600 }}
    >
      <Stack spacing={3}>
        <Stack direction="row" spacing={4}>
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary">Nome</Typography>
            <Typography variant="body1" fontWeight={500}>{teacher?.name}</Typography>
          </Stack>
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary">E-mail</Typography>
            <Typography variant="body1">{teacher?.email}</Typography>
          </Stack>
        </Stack>

        <Divider />

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
