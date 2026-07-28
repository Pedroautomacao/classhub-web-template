import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Box, Stack, TextField, InputAdornment, ToggleButtonGroup, ToggleButton,
  Chip, Tooltip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Divider, Checkbox, FormControlLabel, Alert,
  CircularProgress,
} from '@mui/material'
import { Search, CheckCircle, Cancel, Warning, Visibility } from '@mui/icons-material'
import dayjs from 'dayjs'
import { DataTable, type Column, type SortOrder } from '@/components/common/DataTable'
import { DatePickerField } from '@/components/common/DatePickerField'
import { enrollmentSubmissionsApi } from '@/api/enrollment-submissions.api'
import { classesApi } from '@/api/classes.api'
import { DAYS, studentMatchesClass } from '@/utils/availability'
import { useSnackbarStore } from '@/store/snackbar.store'
import { getApiError } from '@/utils/errors'
import type { EnrollmentSubmission, AvailabilityDay, Class, SubmissionPlanInfo } from '@/types'

function formatCpf(cpf: string) {
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11) return cpf
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

function dayLabel(value: string) {
  return DAYS.find((d) => d.value === value)?.label ?? value
}

function scheduleLabel(c: Class) {
  if (!c.schedule.length) return 'Sem horário cadastrado'
  return c.schedule.map((s) => `${dayLabel(s.day)} ${s.start_time}–${s.end_time}`).join(' · ')
}

function freqLabel(f: string) {
  return f === 'biweekly' ? 'quinzenal' : 'semanal'
}

function planScopeLabel(p: SubmissionPlanInfo) {
  const parts: string[] = []
  if (p.covers_grammar) parts.push(`Gramática ${freqLabel(p.grammar_frequency)}`)
  if (p.covers_conversation) parts.push(`Conversação ${freqLabel(p.conversation_frequency)}`)
  return parts.length ? parts.join(', ') : 'sem modalidade definida'
}

type StatusFilter = 'all' | 'renewed' | 'not_renewed'

export function ReEnrollmentSubmissionsTab() {
  const { show } = useSnackbarStore()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [onlyConflict, setOnlyConflict] = useState(false)
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<string | undefined>(undefined)
  const [sortOrder, setSortOrder] = useState<SortOrder | undefined>(undefined)
  const [detail, setDetail] = useState<EnrollmentSubmission | null>(null)
  // Alterações pendentes de matrícula em turma (aplicadas ao salvar).
  const [toRemove, setToRemove] = useState<Set<string>>(new Set())
  const [toAdd, setToAdd] = useState<Set<string>>(new Set())

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => { setPage(1) }, [search, statusFilter, onlyConflict, dateFrom, dateTo, sortBy, sortOrder])

  const renewedParam = statusFilter === 'all' ? undefined : statusFilter === 'renewed'

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['re-enrollment-submissions', search, statusFilter, onlyConflict, dateFrom, dateTo, page, sortBy, sortOrder],
    queryFn: () => enrollmentSubmissionsApi.listReEnrollment({
      search: search || undefined,
      renewed: renewedParam,
      has_conflict: onlyConflict || undefined,
      created_after: dateFrom || undefined,
      created_before: dateTo || undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
      page,
      page_size: 20,
    }),
  })

  const rows = data?.items ?? []

  // Turmas para o modal (só carrega quando um detalhe está aberto).
  const { data: classesData, refetch: refetchClasses } = useQuery({
    queryKey: ['classes', 'all-for-alloc'],
    queryFn: () => classesApi.list({ page_size: 9999 }),
    enabled: !!detail?.student_id,
  })
  const classes = classesData?.items ?? []

  const availability = (detail?.availability_snapshot ?? []) as AvailabilityDay[]
  const studentLevel = detail?.student_level ?? null
  const studentPlan = detail?.student_plan ?? null
  const studentId = detail?.student_id ?? null

  // Estado ATUAL do aluno nas turmas (não o snapshot histórico).
  const currentClasses = useMemo(
    () => classes.filter((c) => c.students?.some((s) => s.id === studentId)),
    [classes, studentId],
  )
  const currentClassIds = useMemo(() => new Set(currentClasses.map((c) => c.id)), [currentClasses])

  const availableClasses = useMemo(() => {
    const eligible = classes.filter((c) => !currentClassIds.has(c.id))
    const withFit = eligible.map((c) => {
      const timeFits = availability.length > 0 && studentMatchesClass(availability, c.schedule)
      const levelFits = !studentLevel || !c.levels?.length || c.levels.includes(studentLevel)
      // Plano: sem plano não restringe. Com plano, a turma precisa ser de um tipo
      // coberto e ter a frequência da modalidade correspondente.
      let typeFits = true
      let freqFits = true
      if (studentPlan) {
        if (c.class_type === 'grammar') {
          typeFits = studentPlan.covers_grammar
          freqFits = c.frequency === studentPlan.grammar_frequency
        } else if (c.class_type === 'conversation') {
          typeFits = studentPlan.covers_conversation
          freqFits = c.frequency === studentPlan.conversation_frequency
        } else {
          // aula particular: não é sugerida por plano
          typeFits = false
        }
      }
      return { cls: c, timeFits, levelFits, typeFits, freqFits, fits: timeFits && levelFits && typeFits && freqFits }
    })
    return withFit.sort((a, b) =>
      Number(b.fits) - Number(a.fits)
      || Number(b.typeFits) - Number(a.typeFits)
      || Number(b.timeFits) - Number(a.timeFits),
    )
  }, [classes, availability, currentClassIds, studentLevel, studentPlan])

  const openDetail = (r: EnrollmentSubmission) => {
    setToRemove(new Set())
    setToAdd(new Set())
    setDetail(r)
  }
  const closeDetail = () => {
    setDetail(null)
    setToRemove(new Set())
    setToAdd(new Set())
  }

  const toggleRemove = (classId: string) => {
    setToRemove((prev) => {
      const next = new Set(prev)
      next.has(classId) ? next.delete(classId) : next.add(classId)
      return next
    })
  }
  const toggleAdd = (classId: string) => {
    setToAdd((prev) => {
      const next = new Set(prev)
      next.has(classId) ? next.delete(classId) : next.add(classId)
      return next
    })
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!studentId) return
      await Promise.all([
        ...[...toRemove].map((classId) => classesApi.removeStudent(classId, studentId)),
        ...[...toAdd].map((classId) => classesApi.addStudent(classId, studentId)),
      ])
    },
    onSuccess: () => {
      show('Matrículas em turma atualizadas!')
      closeDetail()
      refetchClasses()
      refetch()
    },
    onError: (e) => show(getApiError(e, 'Erro ao atualizar as turmas do aluno.'), 'error'),
  })

  const hasChanges = toRemove.size > 0 || toAdd.size > 0

  const columns: Column<EnrollmentSubmission>[] = [
    { key: 'full_name', label: 'Nome' },
    { key: 'cpf', label: 'CPF', render: (r) => r.cpf ? formatCpf(r.cpf) : '—' },
    {
      key: 'renewed', label: 'Matriculou', align: 'center',
      render: (r) => r.renewed
        ? <CheckCircle color="success" fontSize="small" />
        : <Cancel color="error" fontSize="small" />,
    },
    {
      key: 'created_at', label: 'Data e hora',
      render: (r) => dayjs(r.created_at).format('DD/MM/YYYY HH:mm'),
    },
    {
      key: 'conflict', label: 'Conflitos', align: 'center',
      render: (r) => {
        if (!r.renewed) return <Typography variant="body2" color="text.secondary">—</Typography>
        return (
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
            {r.conflict_active ? (
              <Chip icon={<Warning />} label="Conflito" size="small" color="warning" variant="outlined" />
            ) : r.has_conflict ? (
              <Tooltip title="Havia conflito no envio, mas o aluno já foi realocado">
                <Chip label="Resolvido" size="small" color="success" />
              </Tooltip>
            ) : (
              <Chip label="OK" size="small" color="success" variant="outlined" />
            )}
            <Tooltip title="Gerenciar turmas e disponibilidade">
              <IconButton size="small" onClick={() => openDetail(r)}>
                <Visibility fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        )
      },
    },
  ]

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2} flexWrap="wrap" alignItems={{ sm: 'center' }}>
        <TextField
          size="small"
          placeholder="Buscar por nome ou CPF..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> } }}
          sx={{ minWidth: 260 }}
        />
        <DatePickerField label="De" size="small" value={dateFrom || null} maxDate={dateTo || undefined} onChange={(v) => setDateFrom(v ?? '')} sx={{ minWidth: 150 }} />
        <DatePickerField label="Até" size="small" value={dateTo || null} minDate={dateFrom || undefined} onChange={(v) => setDateTo(v ?? '')} sx={{ minWidth: 150 }} />
        <ToggleButtonGroup
          size="small"
          exclusive
          value={statusFilter}
          onChange={(_, v) => { if (v !== null) setStatusFilter(v as StatusFilter) }}
        >
          <ToggleButton value="all">Todos</ToggleButton>
          <ToggleButton value="renewed">Rematricularam</ToggleButton>
          <ToggleButton value="not_renewed">Não rematricularam</ToggleButton>
        </ToggleButtonGroup>
        <FormControlLabel
          control={<Checkbox size="small" checked={onlyConflict} onChange={(e) => setOnlyConflict(e.target.checked)} />}
          label="Só com conflito"
        />
      </Stack>

      <DataTable
        columns={columns}
        rows={rows}
        loading={isLoading}
        emptyMessage="Nenhuma resposta de rematrícula encontrada."
        page={data?.page}
        pageCount={data?.pages}
        onPageChange={setPage}
        sortableColumns={['full_name', 'renewed', 'created_at', 'has_conflict']}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(by, order) => { setSortBy(by); setSortOrder(order) }}
      />

      <Dialog open={!!detail} onClose={closeDetail} maxWidth="sm" fullWidth>
        <DialogTitle>Gerenciar turmas — {detail?.full_name}</DialogTitle>
        <DialogContent>
          {detail && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              {detail.conflict_active && (
                <Chip icon={<Warning />} label="Há conflito entre as turmas atuais e a nova disponibilidade" color="warning" variant="outlined" sx={{ alignSelf: 'flex-start' }} />
              )}

              <Typography variant="subtitle2" fontWeight={700} color="primary">Nova disponibilidade registrada</Typography>
              {availability.length ? (
                <Stack spacing={0.5}>
                  {availability.map((a, i) => (
                    <Typography key={i} variant="caption" color="text.secondary">
                      <strong>{dayLabel(a.day)}:</strong> {a.slots.map((s) => `${s.start}–${s.end}`).join(', ')}
                    </Typography>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">Nenhuma disponibilidade informada.</Typography>
              )}

              {studentId && (
                <>
                  <Divider />
                  <Typography variant="subtitle2" fontWeight={700} color="primary">Turmas atuais do aluno</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Marque as turmas das quais deseja remover o aluno (ex.: a que está em conflito).
                  </Typography>
                  {currentClasses.length ? (
                    <Stack spacing={0.5}>
                      {currentClasses.map((c) => {
                        const fits = availability.length > 0 && studentMatchesClass(availability, c.schedule)
                        return (
                          <Box
                            key={c.id}
                            sx={{
                              border: 1, borderColor: 'divider', borderRadius: 1, p: 1,
                              opacity: toRemove.has(c.id) ? 0.6 : 1,
                            }}
                          >
                            <FormControlLabel
                              sx={{ m: 0, width: '100%' }}
                              control={<Checkbox size="small" color="error" checked={toRemove.has(c.id)} onChange={() => toggleRemove(c.id)} />}
                              label={
                                <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                                  <Typography variant="body2" fontWeight={600} sx={{ textDecoration: toRemove.has(c.id) ? 'line-through' : 'none' }}>
                                    {c.name}
                                  </Typography>
                                  {!fits && <Chip icon={<Warning />} label="Conflito" size="small" color="warning" variant="outlined" />}
                                  <Typography variant="caption" color="text.secondary">{scheduleLabel(c)}</Typography>
                                </Stack>
                              }
                            />
                          </Box>
                        )
                      })}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">O aluno não está em nenhuma turma.</Typography>
                  )}

                  <Divider />
                  <Typography variant="subtitle2" fontWeight={700} color="primary">Adicionar em turmas</Typography>
                  <Typography variant="caption" color="text.secondary">
                    As turmas sugeridas ("Sugerida") aparecem primeiro. A sugestão considera a disponibilidade do aluno
                    {studentPlan ? `, o plano (${studentPlan.name}: ${planScopeLabel(studentPlan)})` : ''}
                    {studentLevel ? ` e o nível (${studentLevel})` : ''}.
                  </Typography>
                  {(!studentPlan || !studentLevel) && (
                    <Alert severity="info" sx={{ py: 0.5 }}>
                      Sugestão limitada:{' '}
                      {!studentPlan && 'o aluno não tem plano vinculado, então não filtramos por tipo de aula nem frequência. '}
                      {!studentLevel && 'o aluno não tem nível registrado, então não filtramos por nível. '}
                      Ajuste o cadastro do aluno para sugestões mais precisas.
                    </Alert>
                  )}
                  {availableClasses.length ? (
                    <Stack spacing={0.5}>
                      {availableClasses.map(({ cls, fits, timeFits, levelFits, typeFits, freqFits }) => (
                        <Box
                          key={cls.id}
                          sx={{
                            border: 1, borderColor: toAdd.has(cls.id) ? 'primary.main' : 'divider',
                            borderRadius: 1, p: 1,
                          }}
                        >
                          <FormControlLabel
                            sx={{ m: 0, width: '100%' }}
                            control={<Checkbox size="small" checked={toAdd.has(cls.id)} onChange={() => toggleAdd(cls.id)} />}
                            label={
                              <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                                <Typography variant="body2" fontWeight={600}>{cls.name}</Typography>
                                {fits && <Chip label="Sugerida" size="small" color="success" />}
                                {!timeFits && <Chip label="Fora do horário" size="small" color="warning" variant="outlined" />}
                                {timeFits && !typeFits && <Chip label="Outro tipo de aula" size="small" color="warning" variant="outlined" />}
                                {timeFits && typeFits && !freqFits && <Chip label="Outra frequência" size="small" color="warning" variant="outlined" />}
                                {timeFits && typeFits && freqFits && !levelFits && <Chip label="Outro nível" size="small" color="warning" variant="outlined" />}
                                <Typography variant="caption" color="text.secondary">{scheduleLabel(cls)}</Typography>
                              </Stack>
                            }
                          />
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">Nenhuma turma disponível para adicionar.</Typography>
                  )}

                  {hasChanges && (
                    <Alert severity="info">
                      {toRemove.size > 0 && `${toRemove.size} remoção(ões)`}
                      {toRemove.size > 0 && toAdd.size > 0 && ' e '}
                      {toAdd.size > 0 && `${toAdd.size} inclusão(ões)`}
                      {' '}serão aplicadas ao salvar.
                    </Alert>
                  )}
                </>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetail}>Fechar</Button>
          {studentId && (
            <Button
              variant="contained"
              disabled={!hasChanges || saveMutation.isPending}
              startIcon={saveMutation.isPending ? <CircularProgress size={16} color="inherit" /> : null}
              onClick={() => saveMutation.mutate()}
            >
              Salvar alterações
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}
