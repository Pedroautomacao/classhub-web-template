import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Alert, Button, CircularProgress, Stack, Typography } from '@mui/material'
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead'
import { AuthShell } from '@/components/auth/AuthShell'
import { CodeInput } from '@/components/auth/CodeInput'
import { authService } from '@/services/auth.service'
import { getApiError } from '@/utils/errors'
import { luminaPalette } from '@/theme/luminaAcademic'

const RESEND_TTL_SECONDS = 60

export function VerifyCodePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const identifier = (location.state as { identifier?: string } | null)?.identifier ?? ''

  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [resendTimer, setResendTimer] = useState(RESEND_TTL_SECONDS)

  useEffect(() => {
    if (!identifier) {
      // Sem identifier no state, volta ao passo 1
      navigate('/auth/recover', { replace: true })
    }
  }, [identifier, navigate])

  useEffect(() => {
    if (resendTimer <= 0) return
    const id = setInterval(() => setResendTimer((t) => t - 1), 1000)
    return () => clearInterval(id)
  }, [resendTimer])

  const validateMutation = useMutation({
    mutationFn: (value: string) => authService.validateCode(identifier, value),
    onSuccess: (data) => {
      navigate('/auth/reset', { state: { reset_token: data.reset_token } })
    },
    onError: (err) => {
      setError(getApiError(err, 'Código inválido ou expirado.'))
      setCode('')
    },
  })

  const resendMutation = useMutation({
    mutationFn: () => authService.recoverPassword(identifier),
    onSuccess: () => {
      setResendTimer(RESEND_TTL_SECONDS)
      setError(null)
      setCode('')
    },
  })

  const handleComplete = (value: string) => {
    setError(null)
    validateMutation.mutate(value)
  }

  const handleSubmit = () => {
    if (code.length !== 6) return
    setError(null)
    validateMutation.mutate(code)
  }

  const timerLabel =
    resendTimer > 0
      ? `Não recebi o código. Reenviar em 00:${String(resendTimer).padStart(2, '0')}`
      : 'Não recebi o código. Reenviar'

  return (
    <AuthShell
      icon={<MarkEmailReadIcon />}
      title="Verifique seu e-mail"
      subtitle={
        identifier ? (
          <>
            Enviamos um código de 6 dígitos para o e-mail associado a{' '}
            <strong>{identifier}</strong>. Cole ou digite o código abaixo.
          </>
        ) : (
          'Enviamos um código de 6 dígitos para seu e-mail.'
        )
      }
      footer={
        <Button
          variant="text"
          onClick={() => navigate('/auth/recover')}
          sx={{ fontWeight: 600, color: 'text.secondary' }}
        >
          Voltar
        </Button>
      }
    >
      <Stack spacing={3}>
        <Typography
          sx={{ textAlign: 'center', fontSize: 14, fontWeight: 600, color: 'text.secondary' }}
        >
          Código de verificação
        </Typography>

        <CodeInput
          value={code}
          onChange={setCode}
          onComplete={handleComplete}
          disabled={validateMutation.isPending}
          error={!!error}
          autoFocus
        />

        {error && <Alert severity="error">{error}</Alert>}

        <Stack alignItems="center">
          <Button
            variant="text"
            size="small"
            disabled={resendTimer > 0 || resendMutation.isPending}
            onClick={() => resendMutation.mutate()}
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: resendTimer > 0 ? 'text.secondary' : luminaPalette.tertiary.main,
              textTransform: 'none',
            }}
          >
            {resendMutation.isPending ? 'Reenviando...' : timerLabel}
          </Button>
        </Stack>

        <Button
          onClick={handleSubmit}
          variant="contained"
          size="large"
          disabled={code.length !== 6 || validateMutation.isPending}
          startIcon={
            validateMutation.isPending ? <CircularProgress size={18} color="inherit" /> : null
          }
          sx={{
            py: 1.5,
            fontWeight: 700,
            borderRadius: 2,
            bgcolor: luminaPalette.tertiary.main,
            '&:hover': { bgcolor: luminaPalette.tertiary.dark },
          }}
        >
          {validateMutation.isPending ? 'Validando...' : 'Validar código'}
        </Button>
      </Stack>
    </AuthShell>
  )
}
