import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import {
  Avatar, Box, Button, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, IconButton, Stack,
  TextField, Tooltip, Typography,
} from '@mui/material'
import { CameraAlt, Visibility, VisibilityOff } from '@mui/icons-material'
import { useAuthStore } from '@/store/auth.store'
import { usersApi } from '@/api/users.api'
import { useSnackbarStore } from '@/store/snackbar.store'
import { getApiError } from '@/utils/errors'

const profileSchema = z.object({
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
})

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Obrigatório'),
  new_password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirm_password: z.string().min(1, 'Obrigatório'),
}).refine((d) => d.new_password === d.confirm_password, {
  message: 'As senhas não coincidem',
  path: ['confirm_password'],
})

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

interface Props {
  open: boolean
  onClose: () => void
}

const MAX_AVATAR_BYTES = 2 * 1024 * 1024

export function ProfileModal({ open, onClose }: Props) {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const { show } = useSnackbarStore()

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const initials = user?.full_name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() ?? ''

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: { email: user?.email ?? '', phone: user?.phone ?? '' },
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
  })

  const profileMutation = useMutation({
    mutationFn: (data: ProfileForm) =>
      usersApi.updateMe({ email: data.email || null, phone: data.phone || null }),
    onSuccess: (updated) => { setUser(updated); show('Perfil atualizado!') },
    onError: (err) => show(getApiError(err, 'Erro ao atualizar perfil.'), 'error'),
  })

  const passwordMutation = useMutation({
    mutationFn: (data: PasswordForm) =>
      usersApi.changePassword({ current_password: data.current_password, new_password: data.new_password }),
    onSuccess: () => { passwordForm.reset(); show('Senha alterada com sucesso!') },
    onError: (err) => show(getApiError(err, 'Erro ao alterar senha.'), 'error'),
  })

  const avatarMutation = useMutation({
    mutationFn: (dataUrl: string) => usersApi.updateAvatar(dataUrl),
    onSuccess: (updated) => { setUser(updated); show('Foto atualizada!') },
    onError: (err) => show(getApiError(err, 'Erro ao atualizar foto.'), 'error'),
  })

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_AVATAR_BYTES) {
      show('A imagem deve ter no máximo 2MB.', 'error')
      return
    }
    const reader = new FileReader()
    reader.onload = () => avatarMutation.mutate(reader.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Meu Perfil</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>

          {/* Avatar */}
          <Stack alignItems="center" spacing={1}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={user?.avatar_url ?? undefined}
                sx={{ width: 88, height: 88, fontSize: 28, bgcolor: 'primary.main' }}
              >
                {initials}
              </Avatar>
              <Tooltip title="Alterar foto">
                <IconButton
                  size="small"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarMutation.isPending}
                  sx={{
                    position: 'absolute', bottom: 0, right: 0,
                    bgcolor: 'background.paper', border: '1px solid',
                    borderColor: 'divider', width: 28, height: 28,
                  }}
                >
                  {avatarMutation.isPending
                    ? <CircularProgress size={14} />
                    : <CameraAlt sx={{ fontSize: 16 }} />}
                </IconButton>
              </Tooltip>
            </Box>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleAvatarChange}
            />
            <Typography variant="caption" color="text.secondary">
              JPG, PNG ou GIF · máx. 2MB
            </Typography>
          </Stack>

          <Divider />

          {/* Info fixa */}
          <TextField
            label="Usuário (login)"
            value={user?.username ?? ''}
            fullWidth
            size="small"
            slotProps={{ input: { readOnly: true } }}
          />

          {/* Dados editáveis */}
          <Stack
            component="form"
            id="profile-form"
            spacing={2}
            onSubmit={profileForm.handleSubmit((v) => profileMutation.mutate(v))}
          >
            <TextField
              label="E-mail"
              type="email"
              size="small"
              fullWidth
              error={!!profileForm.formState.errors.email}
              helperText={profileForm.formState.errors.email?.message}
              {...profileForm.register('email')}
            />
            <TextField
              label="Telefone"
              size="small"
              fullWidth
              {...profileForm.register('phone')}
            />
          </Stack>

          <Button
            type="submit"
            form="profile-form"
            variant="outlined"
            disabled={profileMutation.isPending}
            startIcon={profileMutation.isPending ? <CircularProgress size={14} color="inherit" /> : null}
          >
            Salvar dados
          </Button>

          <Divider />

          {/* Alterar senha */}
          <Typography variant="subtitle2" fontWeight={600}>Alterar senha</Typography>
          <Stack
            component="form"
            id="password-form"
            spacing={2}
            onSubmit={passwordForm.handleSubmit((v) => passwordMutation.mutate(v))}
          >
            <TextField
              label="Senha atual"
              type={showCurrent ? 'text' : 'password'}
              size="small"
              fullWidth
              error={!!passwordForm.formState.errors.current_password}
              helperText={passwordForm.formState.errors.current_password?.message}
              slotProps={{
                input: {
                  endAdornment: (
                    <IconButton size="small" onClick={() => setShowCurrent((v) => !v)}>
                      {showCurrent ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  ),
                },
              }}
              {...passwordForm.register('current_password')}
            />
            <TextField
              label="Nova senha"
              type={showNew ? 'text' : 'password'}
              size="small"
              fullWidth
              error={!!passwordForm.formState.errors.new_password}
              helperText={passwordForm.formState.errors.new_password?.message}
              slotProps={{
                input: {
                  endAdornment: (
                    <IconButton size="small" onClick={() => setShowNew((v) => !v)}>
                      {showNew ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  ),
                },
              }}
              {...passwordForm.register('new_password')}
            />
            <TextField
              label="Confirmar nova senha"
              type={showConfirm ? 'text' : 'password'}
              size="small"
              fullWidth
              error={!!passwordForm.formState.errors.confirm_password}
              helperText={passwordForm.formState.errors.confirm_password?.message}
              slotProps={{
                input: {
                  endAdornment: (
                    <IconButton size="small" onClick={() => setShowConfirm((v) => !v)}>
                      {showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  ),
                },
              }}
              {...passwordForm.register('confirm_password')}
            />
          </Stack>

          <Button
            type="submit"
            form="password-form"
            variant="outlined"
            color="warning"
            disabled={passwordMutation.isPending}
            startIcon={passwordMutation.isPending ? <CircularProgress size={14} color="inherit" /> : null}
          >
            Alterar senha
          </Button>

        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  )
}
