import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Chip, IconButton, Stack, Tab, Tabs, Tooltip, Typography,
  TextField, MenuItem, Autocomplete,
} from '@mui/material'
import { Edit, Delete, People, FiberManualRecord } from '@mui/icons-material'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable, type Column } from '@/components/common/DataTable'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ClassFormModal } from './components/ClassFormModal'
import { LiveClassesTab } from './components/LiveClassesTab'
import { classesApi, type ClassPayload } from '@/api/classes.api'
import { teachersApi } from '@/api/teachers.api'
import { useSnackbarStore } from '@/store/snackbar.store'
import { getApiError } from '@/utils/errors'
import { usePermission } from '@/hooks/usePermission'
import { Permission } from '@/utils/permissions'
import { DAYS } from '@/utils/availability'
import { exportToXlsx } from '@/utils/export'
import type { Class, Teacher } from '@/types'

const DAY_LABELS: Record<string, string> = Object.fromEntries(DAYS.map((d) => [d.value, d.label]))

const CLASS_TYPE_OPTIONS = [
  { value: 'grammar', label: 'Gramática' },
  { value: 'conversation', label: 'Conversação' },
  { value: 'private_lesson', label: 'Aula particular' },
]

function classTypeLabel(t: string) {
  return CLASS_TYPE_OPTIONS.find((o) => o.value === t)?.label ?? t
}

export function ClassesListPage() {
  const qc = useQueryClient()
  const location = useLocation()
  const { show } = useSnackbarStore()
  const { hasPermission } = usePermission()
  const canWrite = hasPermission(Permission.CLASSES_WRITE)
  const canDelete = hasPermission(Permission.CLASSES_DELETE)

  const initialTab = (location.state as any)?.tab as number | undefined
  const [tab, setTab] = useState(initialTab ?? 0)
  const [formOpen, setFormOpen] = useState(false)
  const [selected, setSelected] = useState<Class | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Class | null>(null)

  const [filterTeacher, setFilterTeacher] = useState<Teacher | null>(null)
  const [filterName, setFilterName] = useState('')
  const [filterDay, setFilterDay] = useState('')
  const [filterStartTime, setFilterStartTime] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterFrequency, setFilterFrequency] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => teachersApi.list(),
  })

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['classes', filterTeacher?.id, filterName, filterDay, filterStartTime, filterType, filterFrequency],
    queryFn: () => classesApi.list({
      teacher_id: filterTeacher?.id || undefined,
      name: filterName || undefined,
      day_of_week: filterDay || undefined,
      start_time: filterStartTime || undefined,
      class_type: filterType || undefined,
      frequency: filterFrequency || undefined,
    }),
  })

  const createMutation = useMutation({
    mutationFn: classesApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['classes'] }); setFormOpen(false); show('Turma criada!') },
    onError: (error) => show(getApiError(error, 'Erro ao criar turma.'), 'error'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ClassPayload> }) => classesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['classes'] }); setFormOpen(false); setSelected(null); show('Turma atualizada!') },
    onError: (error) => show(getApiError(error, 'Erro ao atualizar turma.'), 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: classesApi.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['classes'] }); setDeleteTarget(null); show('Turma excluída.') },
    onError: (error) => show(getApiError(error, 'Erro ao excluir turma.'), 'error'),
  })

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const rows = await classesApi.list({
        teacher_id: filterTeacher?.id || undefined,
        name: filterName || undefined,
        day_of_week: filterDay || undefined,
        start_time: filterStartTime || undefined,
        class_type: filterType || undefined,
        frequency: filterFrequency || undefined,
      })
      exportToXlsx(rows, [
        { label: 'Nome', value: (c) => c.name },
        { label: 'Professor', value: (c) => c.teacher?.name ?? '' },
        { label: 'Dias/Horários', value: (c) => c.schedule.map((s) => `${s.day} ${s.start_time}-${s.end_time}`).join('; ') },
        { label: 'Tipo', value: (c) => c.class_type },
        { label: 'Frequência', value: (c) => c.frequency },
        { label: 'Alunos', value: (c) => c.students.length },
      ], 'turmas')
    } finally {
      setIsExporting(false)
    }
  }

  const columns: Column<Class>[] = [
    { key: 'name', label: 'Nome' },
    {
      key: 'schedule', label: 'Dias e Horários', render: (c) => (
        <Stack spacing={0.25}>
          {c.schedule.map((s) => (
            <Typography key={s.day} variant="body2" noWrap>
              {DAY_LABELS[s.day] ?? s.day}: {s.start_time} – {s.end_time}
            </Typography>
          ))}
        </Stack>
      ),
    },
    {
      key: 'class_type', label: 'Tipo', align: 'center',
      render: (c) => (
        <Chip
          label={classTypeLabel(c.class_type)}
          color={c.class_type === 'grammar' ? 'primary' : c.class_type === 'conversation' ? 'secondary' : 'default'}
          size="small" variant="outlined"
        />
      ),
    },
    {
      key: 'students', label: 'Alunos', align: 'center',
      render: (c) => (
        <Stack direction="row" alignItems="center" spacing={0.5} justifyContent="center">
          <People fontSize="small" color="action" />
          <Typography variant="body2">{c.students.length}</Typography>
        </Stack>
      ),
    },
    {
      key: 'actions', label: '', align: 'right', width: 90,
      render: (c) => (
        <Stack direction="row" justifyContent="flex-end">
          {canWrite && (
            <Tooltip title="Editar">
              <IconButton size="small" onClick={() => { setSelected(c); setFormOpen(true) }}>
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canDelete && (
            <Tooltip title="Excluir">
              <IconButton size="small" color="error" onClick={() => setDeleteTarget(c)}>
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
        title="Turmas" subtitle="Gerencie as turmas da escola"
        actionLabel="Nova Turma" actionDisabled={!canWrite}
        onAction={() => { setSelected(null); setFormOpen(true) }}
        helpContent={{
          what: 'A tela de Turmas organiza os grupos de alunos vinculados a um professor. Cada turma define tipo de aula, frequência, dias/horários de encontro e link de acesso online.',
          actions: [
            'Criar turmas com nome, tipo (gramática, conversação, aula particular), frequência e horários',
            'Vincular um professor responsável à turma',
            'Adicionar e remover alunos de cada turma',
            'Definir o link de reunião online (Google Meet, Zoom, etc.)',
            'Visualizar quais turmas estão acontecendo agora na aba "Ao Vivo"',
          ],
          tips: [
            'Turmas quinzenais exigem uma "Data da 1ª aula". A partir dela o sistema alterna automaticamente a cada 2 semanas — nenhuma configuração adicional por semana.',
            'Dois grupos quinzenais com a mesma professora e horário, mas semanas alternadas, não geram conflito — o sistema detecta a alternância automaticamente pela data de início.',
            'A aba "Ao Vivo" exibe apenas as turmas em andamento agora, já respeitando a semana ativa das quinzenais.',
            'Ao adicionar um aluno com horário conflitante, o sistema exibe um aviso — você pode ignorá-lo se souber da exceção.',
            'Defina os níveis de idioma aceitos para que o sistema alerte quando um aluno de nível diferente for adicionado.',
            'O link de reunião pode ser editado diretamente pelo professor no Portal do Professor.',
          ],
          flow: 'Cadastro do Professor → Criação da Turma (defina frequência e, se quinzenal, a data da 1ª aula) → Adição de Alunos → O Professor acessa pelo Portal.',
        }}
      />
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Todas as Turmas" />
        <Tab
          label={
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <FiberManualRecord sx={{ fontSize: 10, color: 'error.main' }} />
              <span>Ao Vivo Agora</span>
            </Stack>
          }
        />
      </Tabs>
      {tab === 1 ? (
        <LiveClassesTab />
      ) : (
        <>
          <Stack direction="row" flexWrap="wrap" gap={1.5} mb={2} alignItems="center">
            <Autocomplete
              options={teachers}
              getOptionLabel={(t) => t.name}
              value={filterTeacher}
              onChange={(_, v) => setFilterTeacher(v)}
              renderInput={(params) => <TextField {...params} label="Professor" size="small" />}
              sx={{ minWidth: 180 }}
              clearOnEscape
            />
            <TextField
              label="Nome da turma"
              size="small"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              sx={{ minWidth: 160 }}
            />
            <TextField
              select
              label="Dia da semana"
              size="small"
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
              sx={{ minWidth: 175 }}
            >
              <MenuItem value="">Todos</MenuItem>
              {DAYS.map((d) => <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>)}
            </TextField>
            <TextField
              label="Horário de início"
              type="time"
              size="small"
              value={filterStartTime}
              onChange={(e) => setFilterStartTime(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ minWidth: 140 }}
            />
            <TextField
              select
              label="Tipo"
              size="small"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="">Todos</MenuItem>
              {CLASS_TYPE_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField>
            <TextField
              select
              label="Frequência"
              size="small"
              value={filterFrequency}
              onChange={(e) => setFilterFrequency(e.target.value)}
              sx={{ minWidth: 130 }}
            >
              <MenuItem value="">Todas</MenuItem>
              <MenuItem value="weekly">Semanal</MenuItem>
              <MenuItem value="biweekly">Quinzenal</MenuItem>
            </TextField>
          </Stack>
          <DataTable columns={columns} rows={classes} loading={isLoading} emptyMessage="Nenhuma turma cadastrada." onExport={handleExport} isExporting={isExporting} />
        </>
      )}
      <ClassFormModal
        open={formOpen} cls={selected} loading={createMutation.isPending || updateMutation.isPending}
        onClose={() => { setFormOpen(false); setSelected(null) }}
        onSubmit={(v) => {
          const payload = {
            ...v,
            teacher_id: v.teacher_id || null,
            meeting_link: v.meeting_link || null,
            biweekly_start_date: v.frequency === 'biweekly' ? (v.biweekly_start_date || null) : null,
          }
          if (selected) {
            updateMutation.mutate({ id: selected.id, data: payload })
          } else {
            createMutation.mutate(payload)
          }
        }}
      />
      <ConfirmDialog
        open={!!deleteTarget} title="Excluir Turma"
        message={`Excluir a turma "${deleteTarget?.name}"?`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  )
}
