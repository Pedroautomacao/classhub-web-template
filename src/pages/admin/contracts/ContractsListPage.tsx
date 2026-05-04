import { useRef, useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Chip, IconButton, Stack, Tooltip, ToggleButtonGroup, ToggleButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
  TextField, InputAdornment, CircularProgress,
} from '@mui/material'
import { Search } from '@mui/icons-material'
import { Cancel, InsertDriveFile, UploadFile, Delete, Download } from '@mui/icons-material'
import dayjs from 'dayjs'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable, type Column } from '@/components/common/DataTable'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { contractsApi } from '@/api/contracts.api'
import { filesApi, fileToBase64, downloadBase64File } from '@/api/files.api'
import { useSnackbarStore } from '@/store/snackbar.store'
import { usePermission } from '@/hooks/usePermission'
import { Permission } from '@/utils/permissions'
import { getApiError } from '@/utils/errors'
import type { Contract, ContractStatus, FileMetadata } from '@/types'

const STATUS_LABELS: Record<ContractStatus, string> = {
  active: 'Ativo',
  expired: 'Expirado',
  cancelled: 'Cancelado',
}

const STATUS_COLORS: Record<ContractStatus, 'success' | 'error' | 'default'> = {
  active: 'success',
  expired: 'error',
  cancelled: 'default',
}

function isExpiringSoon(end_date: string) {
  const diff = dayjs(end_date).startOf('day').diff(dayjs().startOf('day'), 'day')
  return diff >= 0 && diff <= 30
}

export function ContractsListPage() {
  const qc = useQueryClient()
  const location = useLocation()
  const { show } = useSnackbarStore()
  const { hasPermission } = usePermission()
  const canWrite = hasPermission(Permission.CONTRACTS_WRITE)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const initialStatus = (location.state as any)?.status as ContractStatus | undefined
  const initialExpiringSoon = (location.state as any)?.expiring_soon as boolean | undefined
  const [statusFilter, setStatusFilter] = useState<ContractStatus | undefined>(initialStatus)
  const [expiringSoonFilter, setExpiringSoonFilter] = useState(initialExpiringSoon ?? false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400)
    return () => clearTimeout(timer)
  }, [searchInput])
  const [cancelTarget, setCancelTarget] = useState<Contract | null>(null)
  const [fileContract, setFileContract] = useState<Contract | null>(null)
  const [deleteFileTarget, setDeleteFileTarget] = useState<FileMetadata | null>(null)

  const { data: contractsRaw = [], isLoading, isFetching } = useQuery({
    queryKey: ['contracts', statusFilter, search],
    queryFn: () => contractsApi.list({
      ...(statusFilter ? { contract_status: statusFilter } : {}),
      ...(search ? { search } : {}),
    }),
  })

  const contracts = expiringSoonFilter
    ? contractsRaw.filter((c) => isExpiringSoon(c.end_date) && c.status === 'active')
    : contractsRaw

  const cancelMutation = useMutation({
    mutationFn: contractsApi.cancel,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts'] })
      setCancelTarget(null)
      show('Contrato cancelado.')
    },
    onError: (error) => show(getApiError(error, 'Erro ao cancelar contrato.'), 'error'),
  })

  const createFileMutation = useMutation({
    mutationFn: (data: { reference_id: string; file_name: string; content: string }) =>
      filesApi.create({ ...data, type: 'contract' }),
    onSuccess: (newFile) => {
      qc.invalidateQueries({ queryKey: ['contracts'] })
      setFileContract((prev) => prev ? { ...prev, file: newFile } : prev)
      show('Documento anexado com sucesso!')
    },
    onError: (error) => show(getApiError(error, 'Erro ao anexar documento.'), 'error'),
  })

  const replaceFileMutation = useMutation({
    mutationFn: ({ fileId, data }: { fileId: string; data: { file_name: string; content: string } }) =>
      filesApi.replace(fileId, data),
    onSuccess: (updatedFile) => {
      qc.invalidateQueries({ queryKey: ['contracts'] })
      setFileContract((prev) => prev ? { ...prev, file: updatedFile } : prev)
      show('Documento substituído com sucesso!')
    },
    onError: (error) => show(getApiError(error, 'Erro ao substituir documento.'), 'error'),
  })

  const deleteFileMutation = useMutation({
    mutationFn: (fileId: string) => filesApi.delete(fileId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts'] })
      setDeleteFileTarget(null)
      setFileContract((prev) => prev ? { ...prev, file: null } : prev)
      show('Documento excluído.')
    },
    onError: (error) => show(getApiError(error, 'Erro ao excluir documento.'), 'error'),
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !fileContract) return
    const content = await fileToBase64(file)
    if (fileContract.file) {
      replaceFileMutation.mutate({ fileId: fileContract.file.id, data: { file_name: file.name, content } })
    } else {
      createFileMutation.mutate({ reference_id: fileContract.id, file_name: file.name, content })
    }
  }

  const isSaving = createFileMutation.isPending || replaceFileMutation.isPending

  const handleDownload = async (file: FileMetadata) => {
    try {
      const data = await filesApi.getContent(file.id)
      downloadBase64File(data.content, data.file_name)
    } catch {
      show('Erro ao baixar o arquivo.', 'error')
    }
  }

  const columns: Column<Contract>[] = [
    { key: 'student', label: 'Aluno', render: (c) => c.student?.full_name ?? '—' },
    { key: 'start_date', label: 'Início', render: (c) => dayjs(c.start_date).format('DD/MM/YYYY') },
    {
      key: 'end_date', label: 'Término',
      render: (c) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          <span>{dayjs(c.end_date).format('DD/MM/YYYY')}</span>
          {isExpiringSoon(c.end_date) && c.status === 'active' && (
            <Chip label="Expira em breve" color="warning" size="small" />
          )}
        </Stack>
      ),
    },
    {
      key: 'status', label: 'Status', align: 'center',
      render: (c) => (
        <Chip label={STATUS_LABELS[c.status]} color={STATUS_COLORS[c.status]} size="small" variant="outlined" />
      ),
    },
    {
      key: 'file', label: 'Documento', align: 'center', width: 80,
      render: (c) => (
        <Tooltip title={c.file ? c.file.file_name : 'Sem documento'}>
          <span>
            <IconButton
              size="small"
              color={c.file ? 'primary' : 'default'}
              onClick={() => setFileContract(c)}
            >
              <InsertDriveFile fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      ),
    },
    {
      key: 'actions', label: '', align: 'right', width: 60,
      render: (c) => canWrite && c.status === 'active' ? (
        <Tooltip title="Cancelar contrato">
          <IconButton size="small" color="error" onClick={() => setCancelTarget(c)}>
            <Cancel fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : null,
    },
  ]

  return (
    <Box>
      <PageHeader
        title="Contratos"
        subtitle="Acompanhe e gerencie os contratos dos alunos"
        helpContent={{
          what: 'A tela de Contratos registra todos os acordos firmados entre a escola e os alunos. Cada contrato vincula um aluno a um plano, com datas de início e fim, período de carência e status atualizado.',
          actions: [
            'Visualizar todos os contratos com status (ativo, expirado, cancelado)',
            'Filtrar por status para encontrar contratos próximos do vencimento',
            'Cancelar contratos manualmente quando necessário',
            'Acessar o PDF do contrato assinado quando disponível',
          ],
          tips: [
            'Contratos expirados aparecem em destaque — use para identificar alunos que precisam renovar.',
            'O período de carência permite que o aluno continue ativo por alguns dias após o vencimento.',
            'Contratos são criados automaticamente no fluxo de Matrícula e Rematrícula.',
          ],
          flow: 'Matrícula/Rematrícula → Criação automática do Contrato → Acompanhamento aqui → Renovação via Rematrícula.',
        }}
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2} alignItems={{ sm: 'center' }} flexWrap="wrap">
        <ToggleButtonGroup
          size="small" exclusive
          value={statusFilter ?? 'all'}
          onChange={(_, v) => {
            if (v !== null) {
              setStatusFilter(v === 'all' ? undefined : v)
              setExpiringSoonFilter(false)
            }
          }}
        >
          <ToggleButton value="all">Todos</ToggleButton>
          <ToggleButton value="active">Ativos</ToggleButton>
          <ToggleButton value="expired">Expirados</ToggleButton>
          <ToggleButton value="cancelled">Cancelados</ToggleButton>
        </ToggleButtonGroup>

        <ToggleButtonGroup
          size="small"
          exclusive
          value={expiringSoonFilter ? 'expiring' : ''}
          onChange={(_, v) => {
            const on = v === 'expiring'
            setExpiringSoonFilter(on)
            if (on) setStatusFilter('active')
          }}
        >
          <ToggleButton value="expiring" color="warning">Vencendo em 30 dias</ToggleButton>
        </ToggleButtonGroup>

        <TextField
          size="small"
          placeholder="Buscar por nome ou CPF..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ minWidth: 260 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  {isFetching && searchInput
                    ? <CircularProgress size={16} />
                    : <Search fontSize="small" />}
                </InputAdornment>
              ),
            },
          }}
        />
      </Stack>

      <DataTable columns={columns} rows={contracts} loading={isLoading} emptyMessage="Nenhum contrato encontrado." />

      {/* Cancelar contrato */}
      <ConfirmDialog
        open={!!cancelTarget} title="Cancelar Contrato"
        message="Tem certeza que deseja cancelar este contrato? Esta ação não pode ser desfeita."
        confirmLabel="Cancelar Contrato" loading={cancelMutation.isPending}
        onConfirm={() => cancelTarget && cancelMutation.mutate(cancelTarget.id)}
        onCancel={() => setCancelTarget(null)}
      />

      {/* Painel de documento */}
      <Dialog open={!!fileContract} onClose={() => setFileContract(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Documento do Contrato</DialogTitle>
        <DialogContent>
          <input ref={fileInputRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handleFileChange} />

          {fileContract?.file ? (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <InsertDriveFile color="primary" />
                <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {fileContract.file.file_name}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="outlined" startIcon={<Download />} onClick={() => handleDownload(fileContract.file!)} sx={{ flex: 1 }}>
                  Baixar
                </Button>
                {canWrite && (
                  <>
                    <Button
                      size="small" variant="outlined" startIcon={<UploadFile />}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSaving}
                      sx={{ flex: 1 }}
                    >
                      Substituir
                    </Button>
                    <Button
                      size="small" variant="outlined" color="error" startIcon={<Delete />}
                      onClick={() => setDeleteFileTarget(fileContract.file!)}
                      sx={{ flex: 1 }}
                    >
                      Excluir
                    </Button>
                  </>
                )}
              </Stack>
            </Stack>
          ) : (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Nenhum documento anexado a este contrato.
              </Typography>
              {canWrite && (
                <Button
                  variant="outlined" startIcon={<UploadFile />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSaving}
                >
                  Anexar documento (PDF)
                </Button>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFileContract(null)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Confirmar exclusão do arquivo */}
      <ConfirmDialog
        open={!!deleteFileTarget} title="Excluir Documento"
        message="Tem certeza que deseja excluir o documento deste contrato?"
        confirmLabel="Excluir" confirmColor="error"
        loading={deleteFileMutation.isPending}
        onConfirm={() => deleteFileTarget && deleteFileMutation.mutate(deleteFileTarget.id)}
        onCancel={() => setDeleteFileTarget(null)}
      />
    </Box>
  )
}
