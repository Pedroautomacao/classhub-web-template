import { useState } from 'react'
import { exportToXlsx } from '@/utils/export'
import { useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Chip, IconButton, Stack, Tooltip, ToggleButtonGroup, ToggleButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Typography, TextField, MenuItem, Divider,
} from '@mui/material'
import { Visibility, Edit } from '@mui/icons-material'
import dayjs from 'dayjs'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable, type Column, type SortOrder } from '@/components/common/DataTable'
import { levelingApi } from '@/api/leveling.api'
import { settingsApi } from '@/api/settings.api'
import { useSnackbarStore } from '@/store/snackbar.store'
import { usePermission } from '@/hooks/usePermission'
import { Permission } from '@/utils/permissions'
import { getApiError } from '@/utils/errors'
import { formatPhoneDisplay } from '@/utils/phone'
import type { LevelingFormResponse, ContactStatus } from '@/types'

const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  analyze: 'Analisar',
  enrolled: 'Matriculado',
  not_interested: 'Sem interesse',
  ghosted: 'Sem retorno',
  waiting_list: 'Lista de espera',
}

const CONTACT_STATUS_COLORS: Record<ContactStatus, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
  analyze: 'warning',
  enrolled: 'success',
  not_interested: 'error',
  ghosted: 'default',
  waiting_list: 'info',
}

export function LevelingListPage() {
  const qc = useQueryClient()
  const location = useLocation()
  const { show } = useSnackbarStore()
  const { hasPermission } = usePermission()
  const canWrite = hasPermission(Permission.LEVELING_WRITE)

  const initialContactStatus = (location.state as any)?.contact_status as ContactStatus | undefined
  const [statusFilter, setStatusFilter] = useState<ContactStatus | undefined>(initialContactStatus)
  const [nameFilter, setNameFilter] = useState('')
  const [phoneFilter, setPhoneFilter] = useState('')
  const [sortBy, setSortBy] = useState<string | undefined>(undefined)
  const [sortOrder, setSortOrder] = useState<SortOrder | undefined>(undefined)
  const [isExporting, setIsExporting] = useState(false)
  const [viewForm, setViewForm] = useState<LevelingFormResponse | null>(null)
  const [editStatus, setEditStatus] = useState<LevelingFormResponse | null>(null)
  const [newStatus, setNewStatus] = useState<ContactStatus>('analyze')
  const [levelResult, setLevelResult] = useState('')
  const [recommendation, setRecommendation] = useState('')

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
  })
  const levelOptions = settingsData?.level_options ?? []

  const { data: forms = [], isLoading } = useQuery({
    queryKey: ['leveling', statusFilter, nameFilter, phoneFilter, sortBy, sortOrder],
    queryFn: () => levelingApi.list({
      contact_status: statusFilter,
      name: nameFilter || undefined,
      phone: phoneFilter || undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
    }),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, level_result, recommendation }: { id: string; status: ContactStatus; level_result?: string; recommendation?: string }) =>
      levelingApi.updateStatus(id, { contact_status: status, level_result: level_result || undefined, recommendation: recommendation || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leveling'] })
      setEditStatus(null)
      show('Status atualizado!')
    },
    onError: (error) => show(getApiError(error, 'Erro ao atualizar status.'), 'error'),
  })

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const rows = await levelingApi.list({
        contact_status: statusFilter,
        name: nameFilter || undefined,
        phone: phoneFilter || undefined,
      })
      exportToXlsx(rows, [
        { label: 'Nome', value: (f) => f.full_name },
        { label: 'E-mail', value: (f) => f.email },
        { label: 'Telefone', value: (f) => f.phone },
        { label: 'Status', value: (f) => CONTACT_STATUS_LABELS[f.contact_status] },
        { label: 'Nível', value: (f) => f.level_result ?? '' },
        { label: 'Recomendação', value: (f) => f.recommendation ?? '' },
        { label: 'Data', value: (f) => f.created_at },
      ], 'nivelamentos')
    } finally {
      setIsExporting(false)
    }
  }

  const columns: Column<LevelingFormResponse>[] = [
    { key: 'full_name', label: 'Nome' },
    { key: 'email', label: 'E-mail' },
    { key: 'phone', label: 'Telefone', render: (f) => formatPhoneDisplay(f.phone) },
    {
      key: 'created_at', label: 'Data',
      render: (f) => dayjs(f.created_at).format('DD/MM/YYYY'),
    },
    {
      key: 'contact_status', label: 'Status', align: 'center',
      render: (f) => (
        <Chip
          label={CONTACT_STATUS_LABELS[f.contact_status]}
          color={CONTACT_STATUS_COLORS[f.contact_status]}
          size="small" variant="outlined"
        />
      ),
    },
    {
      key: 'actions', label: '', align: 'right', width: 90,
      render: (f) => (
        <Stack direction="row" justifyContent="flex-end">
          <Tooltip title="Ver detalhes">
            <IconButton size="small" onClick={() => setViewForm(f)}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          {canWrite && (
            <Tooltip title="Atualizar status">
              <IconButton size="small" color="primary" onClick={() => {
                setEditStatus(f)
                setNewStatus(f.contact_status)
                setLevelResult(f.level_result ?? '')
                setRecommendation(f.recommendation ?? '')
              }}>
                <Edit fontSize="small" />
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
        title="Formulários de Nivelamento"
        subtitle="Acompanhe os leads e candidatos"
        helpContent={{
          what: 'Esta tela exibe todos os formulários de nivelamento preenchidos por candidatos através do link público. O nivelamento avalia o nível de inglês e coleta dados de contato do potencial aluno.',
          actions: [
            'Visualizar respostas completas de cada formulário submetido',
            'Atualizar o status do lead (analisando, matriculado, sem interesse, ghosted, lista de espera)',
            'Filtrar formulários por status para organizar o acompanhamento',
            'Arquivar ou excluir formulários irrelevantes',
          ],
          tips: [
            'Use os status para gerenciar o pipeline de vendas: analisando → matriculado ou sem interesse.',
            'O template do formulário de nivelamento é configurável na tela "Templates de Nivelamento".',
            'Compartilhe o link público do formulário via tela de Links Compartilháveis.',
          ],
          flow: 'Link Público → Candidato preenche o Formulário → Aparece aqui → Admin analisa → Converte para Matrícula ou marca como sem interesse.',
        }}
      />

      <Stack direction="row" mb={2} flexWrap="wrap" gap={1.5} alignItems="center">
        <ToggleButtonGroup size="small" exclusive value={statusFilter ?? 'all'} onChange={(_, v) => { if (v !== null) setStatusFilter(v === 'all' ? undefined : v) }}>
          <ToggleButton value="all">Todos</ToggleButton>
          <ToggleButton value="analyze">Analisar</ToggleButton>
          <ToggleButton value="enrolled">Matriculados</ToggleButton>
          <ToggleButton value="waiting_list">Lista de espera</ToggleButton>
          <ToggleButton value="not_interested">Sem interesse</ToggleButton>
          <ToggleButton value="ghosted">Sem retorno</ToggleButton>
        </ToggleButtonGroup>
        <TextField
          label="Buscar por nome"
          size="small"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          sx={{ minWidth: 180 }}
        />
        <TextField
          label="Buscar por telefone"
          size="small"
          value={phoneFilter}
          onChange={(e) => setPhoneFilter(e.target.value)}
          sx={{ minWidth: 170 }}
        />
      </Stack>

      <DataTable
        columns={columns}
        rows={forms}
        loading={isLoading}
        emptyMessage="Nenhum formulário encontrado."
        onExport={handleExport}
        isExporting={isExporting}
        sortableColumns={['full_name', 'email', 'phone', 'created_at', 'contact_status']}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(by, order) => { setSortBy(by); setSortOrder(order) }}
      />

      {/* Dialog de visualização */}
      <Dialog open={!!viewForm} onClose={() => setViewForm(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Detalhes do Formulário</DialogTitle>
        <DialogContent>
          {viewForm && (
            <Stack spacing={1.5} sx={{ pt: 1 }}>
              {([
                ['Nome', viewForm.full_name],
                ['E-mail', viewForm.email],
                ['Telefone', formatPhoneDisplay(viewForm.phone)],
                ['Instagram', viewForm.instagram],
                ['CPF', viewForm.cpf],
                ['Nascimento', viewForm.birth_date ? dayjs(viewForm.birth_date).format('DD/MM/YYYY') : null],
                ['Disponibilidade', viewForm.availability],
                ['Nível', viewForm.level_result],
                ['Recomendação', viewForm.recommendation],
              ] as [string, string | null | undefined][]).filter(([, v]) => v).map(([label, value]) => (
                <Box key={label}>
                  <Typography variant="caption" color="text.secondary">{label}</Typography>
                  <Typography variant="body2">{value}</Typography>
                </Box>
              ))}
              {viewForm.answers && (() => {
                let parsed: Record<string, string | string[]> = {}
                try { parsed = JSON.parse(viewForm.answers) } catch { /* ignore */ }
                const entries = Object.entries(parsed)
                if (!entries.length) return null

                const snapshot = viewForm.form_snapshot
                return (
                  <>
                    <Divider />
                    <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase">
                      Respostas do formulário
                    </Typography>
                    {entries.map(([key, value]) => {
                      const question = snapshot?.find((q) => q.id === key)
                      const label = question?.text ?? key
                      const displayValue = Array.isArray(value) ? value.join(', ') : value
                      return (
                        <Box key={key}>
                          <Typography variant="caption" color="text.secondary">{label}</Typography>
                          <Typography variant="body2">{displayValue}</Typography>
                        </Box>
                      )
                    })}
                  </>
                )
              })()}
            </Stack>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setViewForm(null)}>Fechar</Button></DialogActions>
      </Dialog>

      {/* Dialog de edição de status */}
      <Dialog open={!!editStatus} onClose={() => setEditStatus(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Atualizar Status</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField select label="Status" fullWidth value={newStatus} onChange={(e) => setNewStatus(e.target.value as ContactStatus)}>
              {Object.entries(CONTACT_STATUS_LABELS).map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
            </TextField>
            <TextField
              select
              label="Resultado do nivelamento"
              fullWidth
              value={levelResult}
              onChange={(e) => setLevelResult(e.target.value)}
            >
              <MenuItem value="">— Nenhum —</MenuItem>
              {levelOptions.map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
            </TextField>
            <TextField label="Recomendação" fullWidth multiline rows={2} value={recommendation} onChange={(e) => setRecommendation(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditStatus(null)}>Cancelar</Button>
          <Button variant="contained" disabled={updateStatusMutation.isPending}
            onClick={() => editStatus && updateStatusMutation.mutate({ id: editStatus.id, status: newStatus, level_result: levelResult, recommendation })}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
