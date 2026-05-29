import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
} from '@mui/material'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import HttpsIcon from '@mui/icons-material/Https'
import CloseIcon from '@mui/icons-material/Close'
import { useAuth } from '@/hooks/useAuth'
import { luminaPalette } from '@/theme/luminaAcademic'

const schema = z.object({
  username: z.string().min(1, 'Usuário obrigatório'),
  password: z.string().min(1, 'Senha obrigatória'),
})

type FormValues = z.infer<typeof schema>

interface LoginDialogProps {
  open: boolean
  onClose: () => void
  /** Redireciona o usuário após login bem-sucedido. Default: /admin/dashboard */
  redirectTo?: string
}

export function LoginDialog({ open, onClose, redirectTo = '/admin/dashboard' }: LoginDialogProps) {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const handleClose = () => {
    reset()
    setError(null)
    setShowPassword(false)
    onClose()
  }

  const onSubmit = async (values: FormValues) => {
    setError(null)
    try {
      await login(values)
      handleClose()
      navigate(redirectTo)
    } catch {
      setError('Usuário ou senha incorretos.')
    }
  }

  const handleForgotPassword = () => {
    handleClose()
    navigate('/auth/recover')
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: { xs: 4, md: 7 },
            overflow: 'hidden',
            position: 'relative',
            // Em xs, alinha em baixo (bottom sheet); em sm+, centraliza
            mt: { xs: 'auto', sm: 0 },
            mb: { xs: 0, sm: 0 },
            mx: { xs: 0, sm: 'auto' },
          },
        },
        backdrop: { sx: { backdropFilter: 'blur(8px)', bgcolor: 'rgba(25, 28, 29, 0.4)' } },
      }}
    >
      {/* Faixa decorativa no topo */}
      <Box sx={{ display: 'flex', height: 4 }}>
        <Box sx={{ flex: 1, bgcolor: luminaPalette.primary.main }} />
        <Box sx={{ flex: 1, bgcolor: luminaPalette.tertiary.main }} />
      </Box>

      <IconButton
        aria-label="Fechar"
        onClick={handleClose}
        sx={{
          position: 'absolute',
          top: 12,
          right: 12,
          color: 'text.secondary',
        }}
      >
        <CloseIcon />
      </IconButton>

      <DialogContent sx={{ px: { xs: 3, sm: 4 }, py: { xs: 4, sm: 5 } }}>
        {/* Branding & Título */}
        <Stack alignItems="center" spacing={1.5} sx={{ mb: 4 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 3,
              bgcolor: luminaPalette.primary.container,
              color: luminaPalette.primary.onContainer,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AdminPanelSettingsIcon sx={{ fontSize: 28 }} />
          </Box>
          <Typography
            component="h2"
            sx={{
              fontFamily: '"Hanken Grotesk", sans-serif',
              fontWeight: 700,
              fontSize: { xs: 24, sm: 28 },
              textAlign: 'center',
              letterSpacing: '-0.01em',
            }}
          >
            Acesso Administrativo
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 14, textAlign: 'center' }}>
            Bem-vindo ao portal de gestão escolar.
          </Typography>
        </Stack>

        <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={2.5}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Usuário"
            fullWidth
            autoFocus
            autoComplete="username"
            error={!!errors.username}
            helperText={errors.username?.message}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
            {...register('username')}
          />

          <Box>
            <TextField
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              autoComplete="current-password"
              error={!!errors.password}
              helperText={errors.password?.message}
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
              {...register('password')}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
              <Box
                component="button"
                type="button"
                onClick={handleForgotPassword}
                sx={{
                  appearance: 'none',
                  background: 'none',
                  border: 'none',
                  p: 0,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'primary.main',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Esqueci minha senha
              </Box>
            </Box>
          </Box>

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={isSubmitting}
            endIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <ArrowForwardIcon />}
            sx={{
              mt: 2,
              borderRadius: 999,
              py: 1.5,
              fontWeight: 700,
              boxShadow: '0px 4px 14px rgba(27, 101, 108, 0.25)',
            }}
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </Button>
        </Stack>

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={1}
          sx={{ mt: 4, color: 'text.secondary' }}
        >
          <HttpsIcon sx={{ fontSize: 14 }} />
          <Typography sx={{ fontSize: 12, letterSpacing: '0.02em' }}>
            Conexão segura
          </Typography>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
