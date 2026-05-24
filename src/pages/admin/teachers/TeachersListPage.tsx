import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Avatar, Box, Chip, Dialog, DialogContent, IconButton, Stack, Tab, Tabs, Tooltip, ToggleButtonGroup, ToggleButton, Typography } from '@mui/material'
import { Edit, Delete, WhatsApp } from '@mui/icons-material'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable, type Column, type SortOrder } from '@/components/common/DataTable'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { TeacherFormModal } from './components/TeacherFormModal'
import { HourClosingsAdminTab } from './components/HourClosingsAdminTab'
import { teachersApi } from '@/api/teachers.api'
import { useSnackbarStore } from '@/store/snackbar.store'
import { getApiError } from '@/utils/errors'
import { usePermission } from '@/hooks/usePermission'
import { Permission } from '@/utils/permissions'
import { exportToXlsx } from '@/utils/export'
import type { Teacher } from '@/types'

import { formatPhoneDisplay, whatsappUrl } from '@/utils/phone'

function openWhatsApp(phone: string) {
  const url = whatsappUrl(phone)
  if (url) window.open(url, '_blank')
}

export function TeachersListPage() {
  const qc = useQueryClient()
  const location = useLocation()
  const { show } = useSnackbarStore()
  const { hasPermission } = usePermission()
  const canWrite = hasPermission(Permission.TEACHERS_WRITE)
  const canDelete = hasPermission(Permission.TEACHERS_DELETE)
  const canApprove = hasPermission(Permission.HOUR_CLOSINGS_APPROVE)
  const canViewRate = hasPermission(Permission.TEACHERS_VIEW_RATE)

  const initialTab = (location.state as any)?.tab as number | undefined
  const initialTraining = (location.state as any)?.training as 'all' | 'active' | 'training' | undefined
  const [tab, setTab] = useState(initialTab ?? 0)
  const [trainingFilter, setTrainingFilter] = useState<'all' | 'active' | 'training'>(initialTraining ?? 'all')
  const [sortBy, setSortBy] = useState<string | undefined>(undefined)
  const [sortOrder, setSortOrder] = useState<SortOrder | undefined>(undefined)
  const [isExporting, setIsExporting] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [selected, setSelected] = useState<Teacher | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null)
  const [previewAvatar, setPreviewAvatar] = useState<Teacher | null>(null)

  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ['teachers', sortBy, sortOrder],
    queryFn: () => teachersApi.list({ sort_by: sortBy, sort_order: sortOrder }),
  })

  const filteredTeachers = trainingFilter === 'active'
    ? teachers.filter((t) => !t.is_training)
    : trainingFilter === 'training'
      ? teachers.filter((t) => t.is_training)
      : teachers

  const createMutation = useMutation({
    mutationFn: teachersApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['teachers'] }); setFormOpen(false); show('Professor criado!') },
    onError: (error) => show(getApiError(error, 'Erro ao criar professor.'), 'error'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof teachersApi.update>[1] }) => teachersApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['teachers'] }); setFormOpen(false); setSelected(null); show('Professor atualizado!') },
    onError: (error) => show(getApiError(error, 'Erro ao atualizar professor.'), 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: teachersApi.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['teachers'] }); setDeleteTarget(null); show('Professor excluído.') },
    onError: (error) => show(getApiError(error, 'Erro ao excluir professor.'), 'error'),
  })

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const rows = await teachersApi.list()
      exportToXlsx(rows, [
        { label: 'Nome', value: (t) => t.name },
        { label: 'E-mail', value: (t) => t.email ?? '' },
        { label: 'Telefone', value: (t) => t.phone ?? '' },
        { label: 'Em treinamento', value: (t) => t.is_training ? 'Sim' : 'Não' },
        ...(canViewRate ? [{ label: 'Valor/hora', value: (t: Teacher) => t.hourly_rate ?? '' }] : []),
      ], 'professores')
    } finally {
      setIsExporting(false)
    }
  }

  const columns: Column<Teacher>[] = [
    {
      key: 'name',
      label: 'Nome',
      render: (t) => (
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Tooltip title={t.avatar_url ? 'Ampliar foto' : ''}>
            <Avatar
              src={t.avatar_url ?? undefined}
              sx={{
                width: 32,
                height: 32,
                fontSize: 13,
                bgcolor: 'primary.main',
                cursor: t.avatar_url ? 'pointer' : 'default',
              }}
              onClick={() => { if (t.avatar_url) setPreviewAvatar(t) }}
            >
              {t.name[0].toUpperCase()}
            </Avatar>
          </Tooltip>
          <Typography variant="body2">{t.name}</Typography>
        </Stack>
      ),
    },
    { key: 'email', label: 'E-mail' },
    {
      key: 'phone', label: 'Telefone',
      render: (t) => t.phone ? (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Tooltip title="Abrir WhatsApp">
            <IconButton size="small" color="success" onClick={() => openWhatsApp(t.phone!)}>
              <WhatsApp fontSize="small" />
            </IconButton>
          </Tooltip>
          <Typography variant="body2">{formatPhoneDisplay(t.phone)}</Typography>
        </Stack>
      ) : '—',
    },
    ...(canViewRate ? [{
      key: 'hourly_rate' as const, label: 'Valor/hora', align: 'right' as const,
      render: (t: Teacher) => `R$ ${Number(t.hourly_rate).toFixed(2).replace('.', ',')}`,
    }] : []),
    {
      key: 'is_training', label: 'Status', align: 'center',
      render: (t) => (
        <Chip
          label={t.is_training ? 'Em treinamento' : 'Ativo'}
          color={t.is_training ? 'warning' : 'success'}
          size="small" variant="outlined"
        />
      ),
    },
    {
      key: 'actions', label: '', align: 'right', width: 90,
      render: (t) => (
        <Stack direction="row" justifyContent="flex-end">
          {canWrite && (
            <Tooltip title="Editar">
              <IconButton size="small" onClick={() => { setSelected(t); setFormOpen(true) }}>
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canDelete && (
            <Tooltip title="Excluir">
              <IconButton size="small" color="error" onClick={() => setDeleteTarget(t)}>
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
        title="Professores"
        subtitle="Gerencie os professores da escola"
        actionLabel={tab === 0 ? 'Novo(a) Professor(a)' : undefined}
        actionDisabled={!canWrite}
        onAction={tab === 0 ? () => { setSelected(null); setFormOpen(true) } : undefined}
        helpContent={{
          what: 'A tela de Professores gerencia todo o corpo docente da escola. Cada professor tem seus dados, disponibilidade de horário, taxa horária e histórico de fechamentos.',
          actions: [
            'Cadastrar e editar professores (nome, e-mail, telefone, taxa horária)',
            'Configurar a disponibilidade semanal de cada professor',
            'Clicar na foto do professor para visualizá-la em tamanho ampliado',
            'Iniciar uma conversa pelo WhatsApp clicando no ícone ao lado do telefone',
            'Visualizar e aprovar ou reprovar fechamentos de horas na aba "Fechamento de Horas"',
            'Verificar quais professores estão em treinamento',
            'Ordenar a tabela por qualquer coluna clicando no cabeçalho',
          ],
          tips: [
            'A disponibilidade do professor é cruzada com a do aluno ao criar turmas — alertas aparecem em caso de conflito.',
            'A taxa horária é usada no cálculo automático dos fechamentos de horas submetidos pelo professor.',
            'Professores em treinamento são exibidos com uma indicação visual diferente.',
          ],
          flow: 'Cadastro do Professor → Configuração de Disponibilidade → Vinculação às Turmas → Submissão de Horas pelo Portal → Aprovação pelo Admin.',
        }}
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Professores" />
          {canApprove && <Tab label="Fechamentos de Horas" />}
        </Tabs>
      </Box>

      {tab === 0 && (
        <>
          <ToggleButtonGroup
            size="small" exclusive sx={{ mb: 2 }}
            value={trainingFilter}
            onChange={(_, v) => { if (v !== null) setTrainingFilter(v) }}
          >
            <ToggleButton value="all">Todos</ToggleButton>
            <ToggleButton value="active">Ativos</ToggleButton>
            <ToggleButton value="training">Em Treinamento</ToggleButton>
          </ToggleButtonGroup>
          <DataTable
            columns={columns}
            rows={filteredTeachers}
            loading={isLoading}
            emptyMessage="Nenhum professor cadastrado."
            onExport={handleExport}
            isExporting={isExporting}
            sortableColumns={['name', 'email', 'phone', 'hourly_rate', 'is_training', 'created_at']}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={(by, order) => { setSortBy(by); setSortOrder(order) }}
          />
        </>
      )}
      {tab === 1 && canApprove && <HourClosingsAdminTab />}

      <TeacherFormModal
        open={formOpen} teacher={selected} loading={createMutation.isPending || updateMutation.isPending}
        onClose={() => { setFormOpen(false); setSelected(null) }}
        onSubmit={(v) => selected ? updateMutation.mutate({ id: selected.id, data: v }) : createMutation.mutate(v)}
      />
      <ConfirmDialog
        open={!!deleteTarget} title="Excluir Professor"
        message={`Excluir o professor "${deleteTarget?.name}"?`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
      <Dialog
        open={!!previewAvatar}
        onClose={() => setPreviewAvatar(null)}
        maxWidth="sm"
      >
        <DialogContent sx={{ p: 0, bgcolor: 'background.default' }}>
          <Box
            component="img"
            src={previewAvatar?.avatar_url ?? ''}
            alt={previewAvatar?.name ?? ''}
            onClick={() => setPreviewAvatar(null)}
            sx={{
              display: 'block',
              maxWidth: '100%',
              maxHeight: '80vh',
              cursor: 'pointer',
            }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  )
}
