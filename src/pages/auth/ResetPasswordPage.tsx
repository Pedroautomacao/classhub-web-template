import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import {
  Alert,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import LockResetIcon from '@mui/icons-material/LockReset'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import { AuthShell } from '@/components/auth/AuthShell'
import { authService } from '@/services/auth.service'
import { getApiError } from '@/utils/errors'
import { luminaPalette } from '@/theme/luminaAcademic'

const schema = z
  .object({
    new_password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirm_password: z.string().min(1, 'Confirme a senha'),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    path: ['confirm_password'],
    message: 'As senhas não coincidem',
  })
type FormValues = z.infer<typeof schema>

interface PasswordRequirement {
  label: string
  test: (password: string) => boolean
}

const REQUIREMENTS: PasswordRequirement[] = [
  { label: 'Pelo menos 8 caracteres', test: (p) => p.length >= 8 },
  { label: 'Contém maiúscula e minúscula', test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: 'Contém número ou símbolo', test: (p) => /[\d\W_]/.test(p) },
]

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const resetToken = (location.state as { reset_token?: string } | null)?.reset_token ?? ''

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [done, setDone] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const password = watch('new_password') ?? ''

  useEffect(() => {
    if (!resetToken) {
      navigate('/auth/recover', { replace: true })
    }
  }, [resetToken, navigate])

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      authService.resetPassword(resetToken, values.new_password),
    onSuccess: () => setDone(true),
  })

  if (done) {
    return (
      <AuthShell
        icon={<CheckCircleOutlineIcon />}
        title="Senha redefinida!"
        subtitle="Sua senha foi atualizada com sucesso. Você já pode entrar com a nova senha."
        footer={null}
      >
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={() => navigate('/')}
          sx={{ py: 1.5, fontWeight: 700, borderRadius: 2 }}
        >
          Voltar para a página inicial
        </Button>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      icon={<LockResetIcon />}
      title="Redefinir sua senha"
      subtitle="Crie uma senha forte para proteger sua conta de administrador."
      footer={
        <Button
          variant="text"
          onClick={() => navigate('/auth/recover')}
          sx={{ fontWeight: 600, color: 'text.secondary' }}
        >
          Cancelar e voltar
        </Button>
      }
    >
      <Stack component="form" onSubmit={handleSubmit((v) => mutation.mutate(v))} spacing={3}>
        {mutation.isError && (
          <Alert severity="error">
            {getApiError(mutation.error, 'Não foi possível redefinir a senha. Solicite um novo código.')}
          </Alert>
        )}

        <TextField
          label="Nova senha"
          type={showPassword ? 'text' : 'password'}
          fullWidth
          autoFocus
          autoComplete="new-password"
          placeholder="••••••••"
          error={!!errors.new_password}
          helperText={errors.new_password?.message}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    onClick={() => setShowPassword((v) => !v)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          {...register('new_password')}
        />

        <TextField
          label="Confirmar nova senha"
          type={showConfirm ? 'text' : 'password'}
          fullWidth
          autoComplete="new-password"
          placeholder="••••••••"
          error={!!errors.confirm_password}
          helperText={errors.confirm_password?.message}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}
                    onClick={() => setShowConfirm((v) => !v)}
                    edge="end"
                    size="small"
                  >
                    {showConfirm ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          {...register('confirm_password')}
        />

        <Stack spacing={0.5} sx={{ pl: 0.5 }}>
          <Typography sx={{ fontWeight: 600, fontSize: 13, color: 'text.primary' }}>
            Requisitos de senha:
          </Typography>
          {REQUIREMENTS.map((req) => {
            const ok = req.test(password)
            return (
              <Stack key={req.label} direction="row" spacing={1} alignItems="center">
                {ok ? (
                  <CheckCircleOutlineIcon
                    sx={{ fontSize: 16, color: luminaPalette.secondary.main }}
                  />
                ) : (
                  <RadioButtonUncheckedIcon
                    sx={{ fontSize: 16, color: 'text.secondary' }}
                  />
                )}
                <Typography sx={{ fontSize: 13, color: ok ? 'text.primary' : 'text.secondary' }}>
                  {req.label}
                </Typography>
              </Stack>
            )
          })}
        </Stack>

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={mutation.isPending}
          startIcon={mutation.isPending ? <CircularProgress size={18} color="inherit" /> : null}
          sx={{ py: 1.5, fontWeight: 700, borderRadius: 2 }}
        >
          {mutation.isPending ? 'Redefinindo...' : 'Redefinir senha'}
        </Button>
      </Stack>
    </AuthShell>
  )
}
