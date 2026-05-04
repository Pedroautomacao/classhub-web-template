import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Box, Chip, IconButton, Stack, Tooltip } from '@mui/material'
import { Delete, Edit, PersonOff, RestoreFromTrash } from '@mui/icons-material'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable, type Column } from '@/components/common/DataTable'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { UserFormModal } from './components/UserFormModal'
import { usersApi, type UserCreatePayload } from '@/api/users.api'
import { useSnackbarStore } from '@/store/snackbar.store'
import { getApiError } from '@/utils/errors'
import { usePermission } from '@/hooks/usePermission'
import { Permission } from '@/utils/permissions'
import { useAuthStore } from '@/store/auth.store'
import type { User, UserRole } from '@/types'

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  secretary: 'Secretaria',
  teacher: 'Professor',
}

export function UsersListPage() {
  const qc = useQueryClient()
  const { show } = useSnackbarStore()
  const { hasPermission } = usePermission()
  const currentUser = useAuthStore((s) => s.user)
  const canWrite = hasPermission(Permission.USERS_WRITE)
  const canDelete = hasPermission(Permission.USERS_DELETE)

  const [formOpen, setFormOpen] = useState(false)
  const [selected, setSelected] = useState<User | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null)
  const [reactivateTarget, setReactivateTarget] = useState<User | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list(),
  })

  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setFormOpen(false); show('Usuário criado!') },
    onError: (error) => show(getApiError(error, 'Erro ao criar usuário.'), 'error'),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, values, permissions }: { id: string; values: Parameters<typeof usersApi.update>[1]; permissions: string[] }) => {
      await usersApi.update(id, values)
      return usersApi.updatePermissions(id, permissions)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setFormOpen(false); setSelected(null); show('Usuário atualizado!') },
    onError: (error) => show(getApiError(error, 'Erro ao atualizar usuário.'), 'error'),
  })

  const deactivateMutation = useMutation({
    mutationFn: usersApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setDeactivateTarget(null); show('Usuário desativado.') },
    onError: (error) => show(getApiError(error, 'Erro ao desativar usuário.'), 'error'),
  })

  const reactivateMutation = useMutation({
    mutationFn: usersApi.reactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setReactivateTarget(null); show('Usuário reativado!') },
    onError: (error) => show(getApiError(error, 'Erro ao reativar usuário.'), 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setDeleteTarget(null); show('Usuário excluído.') },
    onError: (error) => show(getApiError(error, 'Erro ao excluir usuário.'), 'error'),
  })

  const handleSubmit = (values: { full_name: string; username: string; email: string; phone: string; role: UserRole; password?: string }, permissions: string[]) => {
    if (selected) {
      updateMutation.mutate({ id: selected.id, values: { full_name: values.full_name, email: values.email, phone: values.phone || undefined, role: values.role, password: values.password || undefined }, permissions })
    } else {
      const payload: UserCreatePayload = { full_name: values.full_name, username: values.username, email: values.email, phone: values.phone || undefined, password: values.password ?? '', role: values.role, permissions }
      createMutation.mutate(payload)
    }
  }

  const columns: Column<User>[] = [
    { key: 'full_name', label: 'Nome' },
    { key: 'username', label: 'Usuário' },
    { key: 'email', label: 'E-mail', render: (u) => u.email ?? '—' },
    { key: 'role', label: 'Perfil', render: (u) => ROLE_LABELS[u.role] ?? u.role },
    {
      key: 'is_active', label: 'Status', align: 'center',
      render: (u) => <Chip label={u.is_active ? 'Ativo' : 'Inativo'} color={u.is_active ? 'success' : 'default'} size="small" variant="outlined" />,
    },
    {
      key: 'permissions', label: 'Permissões', align: 'center',
      render: (u) => u.role === 'admin' ? <Chip label="Total" color="primary" size="small" /> : <Chip label={`${u.permissions.length}`} size="small" variant="outlined" />,
    },
    {
      key: 'actions', label: '', align: 'right', width: 90,
      render: (u) => (
        <Stack direction="row" justifyContent="flex-end">
          {canWrite && (
            <Tooltip title="Editar">
              <IconButton size="small" onClick={() => { setSelected(u); setFormOpen(true) }}>
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canWrite && u.id !== currentUser?.id && !u.is_active && (
            <Tooltip title="Reativar">
              <IconButton size="small" color="success" onClick={() => setReactivateTarget(u)}>
                <RestoreFromTrash fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canDelete && u.id !== currentUser?.id && u.is_active && (
            <Tooltip title="Desativar">
              <IconButton size="small" color="warning" onClick={() => setDeactivateTarget(u)}>
                <PersonOff fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canDelete && u.id !== currentUser?.id && (
            <Tooltip title="Excluir">
              <IconButton size="small" color="error" onClick={() => setDeleteTarget(u)}>
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ]

  return (
    <Box>
      <PageHeader
        title="Usuários" subtitle="Gerencie os usuários administrativos do sistema"
        actionLabel="Novo Usuário" actionDisabled={!canWrite}
        onAction={() => { setSelected(null); setFormOpen(true) }}
        helpContent={{
          what: 'A tela de Usuários controla quem tem acesso ao painel administrativo e o que cada pessoa pode fazer. Cada usuário tem um papel (admin, gerente, secretaria) e permissões granulares por módulo.',
          actions: [
            'Criar usuários administrativos com e-mail e senha',
            'Atribuir papel e permissões por módulo (leitura, escrita, exclusão, aprovação)',
            'Alterar senha de usuários existentes',
            'Desativar acesso de usuários que não devem mais entrar no sistema',
          ],
          tips: [
            'O papel "Admin" tem acesso total automaticamente — não precisa configurar permissões individuais.',
            'Permissões granulares permitem, por exemplo, que a secretaria veja alunos mas não possa excluir.',
            'Para segurança, crie um usuário com permissões mínimas para cada função da equipe.',
          ],
          flow: 'Admin principal cria usuários aqui → Cada membro da equipe acessa com suas credenciais → Ações limitadas pelas permissões configuradas.',
        }}
      />
      <DataTable columns={columns} rows={users} loading={isLoading} emptyMessage="Nenhum usuário encontrado." />
      <UserFormModal
        open={formOpen} user={selected} loading={createMutation.isPending || updateMutation.isPending}
        onClose={() => { setFormOpen(false); setSelected(null) }}
        onSubmit={handleSubmit}
      />
      <ConfirmDialog
        open={!!deactivateTarget} title="Desativar Usuário"
        message={`Desativar o usuário "${deactivateTarget?.full_name}"? Ele perderá o acesso ao sistema.`}
        confirmLabel="Desativar" confirmColor="warning" loading={deactivateMutation.isPending}
        onConfirm={() => deactivateTarget && deactivateMutation.mutate(deactivateTarget.id)}
        onCancel={() => setDeactivateTarget(null)}
      />
      <ConfirmDialog
        open={!!reactivateTarget} title="Reativar Usuário"
        message={`Reativar o usuário "${reactivateTarget?.full_name}"? Ele voltará a ter acesso ao sistema.`}
        confirmLabel="Reativar" confirmColor="primary" loading={reactivateMutation.isPending}
        onConfirm={() => reactivateTarget && reactivateMutation.mutate(reactivateTarget.id)}
        onCancel={() => setReactivateTarget(null)}
      />
      <ConfirmDialog
        open={!!deleteTarget} title="Excluir Usuário"
        message={`Excluir permanentemente o usuário "${deleteTarget?.full_name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir" confirmColor="error" loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  )
}
