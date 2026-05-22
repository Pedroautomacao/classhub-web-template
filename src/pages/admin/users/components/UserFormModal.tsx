import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, TextField, MenuItem, Grid,
  CircularProgress, Typography, Divider, FormControlLabel, Checkbox, Box, Chip,
  useMediaQuery, useTheme,
} from '@mui/material'
import type { User } from '@/types'
import { Permission } from '@/utils/permissions'

const PERMISSION_GROUPS = [
  { label: 'Alunos', permissions: [Permission.STUDENTS_READ, Permission.STUDENTS_WRITE, Permission.STUDENTS_DELETE] },
  { label: 'Contratos', permissions: [Permission.CONTRACTS_READ, Permission.CONTRACTS_WRITE, Permission.CONTRACTS_DELETE] },
  { label: 'Professores', permissions: [Permission.TEACHERS_READ, Permission.TEACHERS_WRITE, Permission.TEACHERS_DELETE, Permission.TEACHERS_VIEW_RATE] },
  { label: 'Turmas', permissions: [Permission.CLASSES_READ, Permission.CLASSES_WRITE, Permission.CLASSES_DELETE] },
  { label: 'Planos', permissions: [Permission.PLANS_READ, Permission.PLANS_WRITE, Permission.PLANS_DELETE] },
  { label: 'Nivelamento & Templates', permissions: [Permission.LEVELING_READ, Permission.LEVELING_WRITE, Permission.LEVELING_DELETE] },
  { label: 'Fechamento de Horas', permissions: [Permission.HOUR_CLOSINGS_READ, Permission.HOUR_CLOSINGS_WRITE, Permission.HOUR_CLOSINGS_APPROVE] },
  { label: 'Pagamentos', permissions: [Permission.PAYMENTS_READ, Permission.PAYMENTS_WRITE] },
  { label: 'Matrícula', permissions: [Permission.ENROLLMENT_WRITE] },
  { label: 'Usuários', permissions: [Permission.USERS_READ, Permission.USERS_WRITE, Permission.USERS_DELETE] },
  { label: 'Configurações', permissions: [Permission.SETTINGS_READ, Permission.SETTINGS_WRITE] },
  { label: 'Dashboard', permissions: [Permission.DASHBOARD_READ] },
]

const PERM_ACTION_LABEL: Record<string, string> = {
  read: 'Ver', write: 'Editar', delete: 'Excluir', approve: 'Aprovar', view_rate: 'Ver Valor/hora', list: 'Listar',
}

function getAction(perm: string) {
  return PERM_ACTION_LABEL[perm.split(':')[1]] ?? perm.split(':')[1]
}

const schema = z.object({
  full_name: z.string().min(2, 'Nome obrigatório'),
  username: z.string().min(3, 'Mínimo 3 caracteres').regex(/^[a-z0-9_]+$/, 'Apenas letras minúsculas, números e _'),
  email: z.string().email('E-mail inválido').min(1, 'E-mail obrigatório'),
  phone: z.string().min(1, 'Telefone obrigatório'),
  password: z.string().min(6, 'Mínimo 6 caracteres').optional().or(z.literal('')),
  role: z.enum(['admin', 'manager', 'secretary', 'teacher']),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  user?: User | null
  loading?: boolean
  onClose: () => void
  onSubmit: (values: FormValues, permissions: string[]) => void
}

export function UserFormModal({ open, user, loading = false, onClose, onSubmit }: Props) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'))

  const isEdit = !!user
  const [selectedPerms, setSelectedPerms] = useState<string[]>([])

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const role = watch('role')

  useEffect(() => {
    if (open) {
      reset(user
        ? { full_name: user.full_name, username: user.username, email: user.email ?? '', phone: user.phone ?? '', password: '', role: user.role }
        : { full_name: '', username: '', email: '', phone: '', password: '', role: 'secretary' }
      )
      setSelectedPerms(user?.permissions ?? [])
    }
  }, [open, user, reset])

  const togglePerm = (perm: string) => {
    setSelectedPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    )
  }

  const toggleGroup = (perms: string[]) => {
    const allSelected = perms.every((p) => selectedPerms.includes(p))
    setSelectedPerms((prev) =>
      allSelected ? prev.filter((p) => !perms.includes(p)) : [...new Set([...prev, ...perms])]
    )
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={fullScreen}>
      <DialogTitle>{isEdit ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
      <DialogContent>
        <Stack component="form" id="user-form" onSubmit={handleSubmit((v) => onSubmit(v, selectedPerms))} spacing={3} sx={{ pt: 1 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Nome completo *" fullWidth error={!!errors.full_name} helperText={errors.full_name?.message} {...register('full_name')} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Usuário (login) *" fullWidth error={!!errors.username} helperText={errors.username?.message} {...register('username')} disabled={isEdit} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="E-mail *" type="email" fullWidth error={!!errors.email} helperText={errors.email?.message} {...register('email')} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Telefone *" fullWidth error={!!errors.phone} helperText={errors.phone?.message} {...register('phone')} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label={isEdit ? 'Nova senha (deixe em branco para manter)' : 'Senha *'} type="password" fullWidth error={!!errors.password} helperText={errors.password?.message} {...register('password')} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField select label="Perfil *" fullWidth {...register('role')} value={role ?? 'secretary'}>
                <MenuItem value="admin">Administrador</MenuItem>
                <MenuItem value="manager">Gerente</MenuItem>
                <MenuItem value="secretary">Secretaria</MenuItem>
                <MenuItem value="teacher">Professor</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          {role !== 'admin' && (
            <>
              <Divider />
              <Box>
                <Typography variant="subtitle2" fontWeight={600} mb={1}>
                  Permissões
                  <Typography component="span" variant="caption" color="text.secondary" ml={1}>
                    (Administradores têm acesso total automático)
                  </Typography>
                </Typography>
                <Stack spacing={1.5}>
                  {PERMISSION_GROUPS.map((group) => {
                    const allSelected = group.permissions.every((p) => selectedPerms.includes(p))
                    return (
                      <Box key={group.label}>
                        <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                size="small"
                                checked={allSelected}
                                indeterminate={group.permissions.some((p) => selectedPerms.includes(p)) && !allSelected}
                                onChange={() => toggleGroup(group.permissions)}
                              />
                            }
                            label={<Typography variant="body2" fontWeight={600}>{group.label}</Typography>}
                          />
                        </Stack>
                        <Stack direction="row" flexWrap="wrap" gap={1} pl={4}>
                          {group.permissions.map((perm) => (
                            <Chip
                              key={perm}
                              label={getAction(perm)}
                              size="small"
                              variant={selectedPerms.includes(perm) ? 'filled' : 'outlined'}
                              color={selectedPerms.includes(perm) ? 'primary' : 'default'}
                              onClick={() => togglePerm(perm)}
                              sx={{ cursor: 'pointer' }}
                            />
                          ))}
                        </Stack>
                      </Box>
                    )
                  })}
                </Stack>
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button type="submit" form="user-form" variant="contained" disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}>
          {isEdit ? 'Salvar' : 'Criar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
