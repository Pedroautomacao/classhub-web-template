import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import {
  TextField,
  Button,
  Stack,
  InputAdornment,
  CircularProgress,
} from '@mui/material'
import LockResetIcon from '@mui/icons-material/LockReset'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { AuthShell } from '@/components/auth/AuthShell'
import { authService } from '@/services/auth.service'

const schema = z.object({
  identifier: z.string().min(1, 'Informe e-mail ou usuário'),
})
type FormValues = z.infer<typeof schema>

export function RecoverPasswordPage() {
  const navigate = useNavigate()
  const [submittedIdentifier, setSubmittedIdentifier] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: (values: FormValues) => authService.recoverPassword(values.identifier),
    onSuccess: (_data, values) => {
      // Por questão de segurança o backend sempre responde 204 — não revela
      // se o identifier existe. Aqui sempre avançamos para a tela de código.
      setSubmittedIdentifier(values.identifier)
      navigate('/auth/verify', { state: { identifier: values.identifier } })
    },
  })

  const onSubmit = (values: FormValues) => mutation.mutate(values)

  return (
    <AuthShell
      icon={<LockResetIcon />}
      title="Recuperar senha"
      subtitle="Informe seu e-mail ou usuário cadastrado e enviaremos um código de 6 dígitos para sua caixa de entrada."
      footer={
        <Button
          variant="text"
          onClick={() => navigate('/')}
          sx={{ fontWeight: 600, color: 'text.secondary' }}
        >
          Voltar para o login
        </Button>
      }
    >
      <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={3}>
        <TextField
          label="E-mail ou usuário"
          fullWidth
          autoFocus
          autoComplete="username"
          placeholder="seu@email.com ou usuario"
          error={!!errors.identifier}
          helperText={errors.identifier?.message}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <PersonOutlineIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          {...register('identifier')}
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={mutation.isPending}
          endIcon={
            mutation.isPending ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <ArrowForwardIcon />
            )
          }
          sx={{ py: 1.5, fontWeight: 700, borderRadius: 2 }}
        >
          {mutation.isPending ? 'Enviando...' : 'Enviar código'}
        </Button>

        {submittedIdentifier && (
          <Button
            variant="text"
            size="small"
            onClick={() =>
              navigate('/auth/verify', { state: { identifier: submittedIdentifier } })
            }
            sx={{ fontWeight: 600 }}
          >
            Já tenho o código →
          </Button>
        )}
      </Stack>
    </AuthShell>
  )
}
