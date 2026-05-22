import { useState, useMemo } from 'react'
import { exportToXlsx } from '@/utils/export'
import { useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  MenuItem,
  Typography,
  Chip,
  Alert,
} from '@mui/material'
import { Edit, PersonOff, PersonAdd, Search, ClassOutlined, Warning, Error, Visibility } from '@mui/icons-material'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable, type Column, type SortOrder } from '@/components/common/DataTable'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DateRangePickerField, type DateRangeValue } from '@/components/common/DateRangePickerField'
import { StudentStatusChip } from './components/StudentStatusChip'
import { StudentFormModal } from './components/StudentFormModal'
import { StudentDetailsModal } from './components/StudentDetailsModal'
import { studentsApi, type StudentUpdate } from '@/api/students.api'
import { classesApi } from '@/api/classes.api'
import { studentMatchesClass } from '@/utils/availability'
import { useSnackbarStore } from '@/store/snackbar.store'
import { usePermission } from '@/hooks/usePermission'
import { Permission } from '@/utils/permissions'
import { getApiError } from '@/utils/errors'
import type { Student, StudentStatus, Class } from '@/types'

// ── Add to Class modal ────────────────────────────────────────────────────────

interface AddToClassModalProps {
  student: Student | null
  classes: Class[]
  onClose: () => void
  onConfirm: (classId: string) => void
  loading: boolean
}

function AddToClassModal({ student, classes, onClose, onConfirm, loading }: AddToClassModalProps) {
  const [selectedClassId, setSelectedClassId] = useState('')

  const handleClose = () => {
    setSelectedClassId('')
    onClose()
  }

  return (
    <Dialog open={!!student} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Adicionar à Turma</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Aluno: <strong>{student?.full_name}</strong>
          </Typography>
          <TextField
            select
            label="Selecione a turma"
            fullWidth
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            {classes.length === 0 && (
              <MenuItem disabled>Nenhuma turma disponível</MenuItem>
            )}
            {classes.map((c) => {
              const conflict = !studentMatchesClass(student?.availability ?? null, c.schedule)
              const levelConflict = student?.level && c.levels?.length && !c.levels.includes(student.level)
              return (
                <MenuItem key={c.id} value={c.id}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%" spacing={1}>
                    <Typography variant="body2">{c.name}</Typography>
                    {conflict && (
                      <Tooltip title="Sem disponibilidade neste turno">
                        <Warning fontSize="small" color="warning" />
                      </Tooltip>
                    )}
                    {levelConflict && (
                      <Tooltip title={`Nível do aluno (${student?.level}) não corresponde ao(s) nível(is) da turma`}>
                        <Error fontSize="small" color="error" />
                      </Tooltip>
                    )}
                  </Stack>
                </MenuItem>
              )
            })}
          </TextField>
          {(() => {
            const selClass = classes.find((c) => c.id === selectedClassId)
            if (selClass && student?.level && selClass.levels?.length && !selClass.levels.includes(student.level)) {
              return (
                <Alert severity="warning">
                  O nível do aluno ({student.level}) não corresponde ao(s) nível(is) da turma ({selClass.levels.join(', ')}).
                </Alert>
              )
            }
            return null
          })()}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button
          variant="contained"
          disabled={!selectedClassId || loading}
          onClick={() => onConfirm(selectedClassId)}
        >
          Adicionar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

type StatusFilter = StudentStatus | 'without_class' | 'with_class' | undefined

export function StudentsListPage() {
  const qc = useQueryClient()
  const location = useLocation()
  const { show } = useSnackbarStore()
  const { hasPermission } = usePermission()
  const canWrite = hasPermission(Permission.STUDENTS_WRITE)
  const canDelete = hasPermission(Permission.STUDENTS_DELETE)
  const canWriteClasses = hasPermission(Permission.CLASSES_WRITE)

  const initialStatus = (location.state as any)?.status as StatusFilter
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialStatus ?? undefined)
  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState<DateRangeValue | null>(null)
  const [sortBy, setSortBy] = useState<string | undefined>(undefined)
  const [sortOrder, setSortOrder] = useState<SortOrder | undefined>(undefined)
  const [isExporting, setIsExporting] = useState(false)
  const [editTarget, setEditTarget] = useState<Student | null>(null)
  const [detailsTarget, setDetailsTarget] = useState<Student | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<Student | null>(null)
  const [reactivateTarget, setReactivateTarget] = useState<Student | null>(null)
  const [addToClassTarget, setAddToClassTarget] = useState<Student | null>(null)

  const apiStatusFilter = (statusFilter === 'without_class' || statusFilter === 'with_class') ? undefined : statusFilter
  const createdAfter = dateRange?.[0] ?? undefined
  const createdBefore = dateRange?.[1] ?? dateRange?.[0] ?? undefined

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students', apiStatusFilter, createdAfter, createdBefore, sortBy, sortOrder],
    queryFn: () => studentsApi.list({
      status: apiStatusFilter,
      created_after: createdAfter,
      created_before: createdBefore,
      sort_by: sortBy,
      sort_order: sortOrder,
    }),
  })

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesApi.list(),
    staleTime: 30_000,
    enabled: !!addToClassTarget,
  })

  const filtered = useMemo(() => {
    let result = students
    if (statusFilter === 'without_class') {
      result = result.filter((s) => s.status === 'active' && (s.classes?.length ?? 0) === 0)
    } else if (statusFilter === 'with_class') {
      result = result.filter((s) => s.status === 'active' && (s.classes?.length ?? 0) > 0)
    }
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (s) =>
          s.full_name.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.cpf?.includes(search),
      )
    }
    return result
  }, [students, statusFilter, search])

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: StudentUpdate }) => studentsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] })
      setEditTarget(null)
      show('Aluno atualizado!')
    },
    onError: (error) => show(getApiError(error, 'Erro ao atualizar aluno.'), 'error'),
  })

  const deactivateMutation = useMutation({
    mutationFn: studentsApi.deactivate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] })
      setDeactivateTarget(null)
      show('Aluno inativado.')
    },
    onError: (error) => show(getApiError(error, 'Erro ao inativar aluno.'), 'error'),
  })

  const reactivateMutation = useMutation({
    mutationFn: studentsApi.reactivate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] })
      setReactivateTarget(null)
      show('Aluno reativado!')
    },
    onError: (error) => show(getApiError(error, 'Erro ao reativar aluno.'), 'error'),
  })

  const addToClassMutation = useMutation({
    mutationFn: ({ classId, studentId }: { classId: string; studentId: string }) =>
      classesApi.addStudent(classId, studentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes'] })
      setAddToClassTarget(null)
      show('Aluno adicionado à turma!')
    },
    onError: (error) => show(getApiError(error, 'Erro ao adicionar à turma.'), 'error'),
  })

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const rows = await studentsApi.list({
        status: apiStatusFilter,
        created_after: createdAfter,
        created_before: createdBefore,
        sort_by: sortBy,
        sort_order: sortOrder,
      })
      exportToXlsx(rows, [
        { label: 'Nome', value: (s) => s.full_name },
        { label: 'E-mail', value: (s) => s.email ?? '' },
        { label: 'Telefone', value: (s) => s.phone ?? '' },
        { label: 'Status', value: (s) => s.status },
        { label: 'Nível', value: (s) => s.level ?? '' },
      ], 'alunos')
    } finally {
      setIsExporting(false)
    }
  }

  const columns: Column<Student>[] = [
    { key: 'full_name', label: 'Nome' },
    {
      key: 'classes_chip',
      label: 'Turma',
      render: (s) => {
        if (!s.classes?.length) return <Chip label="Sem turma" size="small" variant="outlined" color="warning" />
        return (
          <Stack direction="row" flexWrap="wrap" gap={0.5}>
            {s.classes.map((c) => <Chip key={c.id} label={c.name} size="small" variant="outlined" />)}
          </Stack>
        )
      },
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (s) => <StudentStatusChip status={s.status} />,
    },
    { key: 'level', label: 'Nível', render: (s) => s.level ?? '—' },
    {
      key: 'created_at',
      label: 'Cadastro',
      render: (s) => s.created_at ? new Date(s.created_at).toLocaleDateString('pt-BR') : '—',
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      width: 160,
      render: (s) => (
        <Stack direction="row" justifyContent="flex-end">
          {canWriteClasses && s.status === 'active' && !s.classes?.length && (
            <Tooltip title="Adicionar à turma">
              <IconButton size="small" color="primary" onClick={() => setAddToClassTarget(s)}>
                <ClassOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Ver detalhes">
            <IconButton size="small" onClick={() => setDetailsTarget(s)}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          {canWrite && (
            <Tooltip title="Editar">
              <IconButton size="small" onClick={() => setEditTarget(s)}>
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canDelete && s.status === 'active' && (
            <Tooltip title="Inativar">
              <IconButton size="small" color="warning" onClick={() => setDeactivateTarget(s)}>
                <PersonOff fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canWrite && s.status === 'inactive' && (
            <Tooltip title="Reativar">
              <IconButton size="small" color="success" onClick={() => setReactivateTarget(s)}>
                <PersonAdd fontSize="small" />
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
        title="Alunos"
        subtitle="Gerencie os alunos da escola"
        helpContent={{
          what: 'A tela de Alunos centraliza o cadastro e a gestão de todos os alunos matriculados ou já matriculados na escola. Cada aluno possui dados pessoais, disponibilidade de horário e vínculo com plano e turma.',
          actions: [
            'Cadastrar novos alunos manualmente',
            'Editar dados de alunos existentes (nome, e-mail, telefone, CPF, disponibilidade)',
            'Visualizar todos os dados cadastrados do aluno no modal de detalhes (ícone de olho)',
            'Filtrar por status: ativos, inativos, com turma ou sem turma',
            'Filtrar por data de cadastro (data específica ou intervalo, no mesmo calendário)',
            'Ordenar a tabela por qualquer coluna clicando no cabeçalho',
            'Adicionar um aluno diretamente a uma turma existente',
            'Inativar ou reativar alunos',
            'Buscar alunos por nome, e-mail ou CPF',
          ],
          tips: [
            'Use o filtro "Sem Turma" para encontrar alunos ativos que ainda precisam ser alocados.',
            'O modal de detalhes mostra também histórico de contratos e disponibilidade formatada por dia.',
            'Telefone e e-mail não aparecem mais na tabela para liberar espaço — abra o modal de detalhes para vê-los.',
            'A disponibilidade e o nível do aluno são usados para alertar conflitos ao adicioná-lo a uma turma.',
            'O nível é preenchido automaticamente com base no último nivelamento concluído do aluno.',
            'Alunos normalmente chegam via formulário de Matrícula — o cadastro manual é usado para casos especiais.',
          ],
          flow: 'Nivelamento → Matrícula (nível herdado automaticamente) → Alocação em Turma compatível → Criação de Contrato.',
        }}
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2} alignItems="flex-start" flexWrap="wrap">
        <TextField
          size="small"
          placeholder="Buscar por nome, e-mail ou CPF..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ minWidth: 280 }}
        />
        <DateRangePickerField
          size="small"
          label="Data de cadastro"
          value={dateRange}
          onChange={setDateRange}
          sx={{ minWidth: 280 }}
        />
        <ToggleButtonGroup
          size="small"
          exclusive
          value={statusFilter ?? 'all'}
          onChange={(_, v) => { if (v !== null) setStatusFilter(v === 'all' ? undefined : v as StatusFilter) }}
        >
          <ToggleButton value="all">Todos</ToggleButton>
          <ToggleButton value="active">Ativos</ToggleButton>
          <ToggleButton value="inactive">Inativos</ToggleButton>
          <ToggleButton value="with_class">Com Turma</ToggleButton>
          <ToggleButton value="without_class">Sem Turma</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <DataTable
        columns={columns}
        rows={filtered}
        loading={isLoading}
        emptyMessage="Nenhum aluno encontrado."
        onExport={handleExport}
        isExporting={isExporting}
        sortableColumns={['full_name', 'level', 'status', 'created_at']}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(by, order) => { setSortBy(by); setSortOrder(order) }}
      />

      <StudentFormModal
        open={!!editTarget}
        student={editTarget}
        loading={updateMutation.isPending}
        onClose={() => setEditTarget(null)}
        onSubmit={(values) =>
          editTarget && updateMutation.mutate({ id: editTarget.id, data: values })
        }
      />

      <StudentDetailsModal
        student={detailsTarget}
        onClose={() => setDetailsTarget(null)}
      />

      <AddToClassModal
        student={addToClassTarget}
        classes={classes}
        loading={addToClassMutation.isPending}
        onClose={() => setAddToClassTarget(null)}
        onConfirm={(classId) =>
          addToClassTarget && addToClassMutation.mutate({ classId, studentId: addToClassTarget.id })
        }
      />

      <ConfirmDialog
        open={!!deactivateTarget}
        title="Inativar Aluno"
        message={`Tem certeza que deseja inativar "${deactivateTarget?.full_name}"?`}
        confirmLabel="Inativar"
        confirmColor="warning"
        loading={deactivateMutation.isPending}
        onConfirm={() => deactivateTarget && deactivateMutation.mutate(deactivateTarget.id)}
        onCancel={() => setDeactivateTarget(null)}
      />

      <ConfirmDialog
        open={!!reactivateTarget}
        title="Reativar Aluno"
        message={`Deseja reativar o aluno "${reactivateTarget?.full_name}"?`}
        confirmLabel="Reativar"
        confirmColor="primary"
        loading={reactivateMutation.isPending}
        onConfirm={() => reactivateTarget && reactivateMutation.mutate(reactivateTarget.id)}
        onCancel={() => setReactivateTarget(null)}
      />
    </Box>
  )
}
