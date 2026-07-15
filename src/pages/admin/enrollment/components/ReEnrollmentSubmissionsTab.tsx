import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Box, Stack, TextField, InputAdornment, ToggleButtonGroup, ToggleButton,
  Chip, Tooltip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Divider, Checkbox, FormControlLabel, MenuItem, Alert,
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
import type { EnrollmentSubmission, AvailabilityDay } from '@/types'

function formatCpf(cpf: string) {
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11) return cpf
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

function dayLabel(value: string) {
  return DAYS.find((d) => d.value === value)?.label ?? value
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
  const [selectedClassId, setSelectedClassId] = useState('')

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

  // Turmas para o modal de alocação (só carrega quando um detalhe está aberto).
  const { data: classesData } = useQuery({
    queryKey: ['classes', 'all-for-alloc'],
    queryFn: () => classesApi.list({ page_size: 9999 }),
    enabled: !!detail?.student_id,
    staleTime: 30_000,
  })
  const classes = classesData?.items ?? []

  const allocateMutation = useMutation({
    mutationFn: ({ classId, studentId }: { classId: string; studentId: string }) =>
      classesApi.addStudent(classId, studentId),
    onSuccess: () => {
      show('Aluno alocado à turma!')
      setDetail(null)
      setSelectedClassId('')
      refetch()
    },
    onError: (e) => show(getApiError(e, 'Erro ao alocar o aluno na turma.'), 'error'),
  })

  const availability = (detail?.availability_snapshot ?? []) as AvailabilityDay[]
  // Turmas em que o aluno já está (do snapshot) — não sugerir de novo.
  const currentClassIds = new Set((detail?.classes_snapshot ?? []).map((c) => c.id).filter(Boolean))

  const studentLevel = detail?.student_level ?? null

  const rankedClasses = useMemo(() => {
    const eligible = classes.filter((c) => !currentClassIds.has(c.id))
    const withFit = eligible.map((c) => {
      const timeFits = availability.length > 0 && studentMatchesClass(availability, c.schedule)
      // Nível: se o aluno tem nível e a turma define níveis, precisa bater.
      // Sem nível do aluno ou turma sem níveis definidos → não restringe.
      const levelFits = !studentLevel || !c.levels?.length || c.levels.includes(studentLevel)
      return { cls: c, timeFits, levelFits, fits: timeFits && levelFits }
    })
    // Sugeridas (horário + nível) primeiro; depois as que batem só no horário.
    return withFit.sort((a, b) => Number(b.fits) - Number(a.fits) || Number(b.timeFits) - Number(a.timeFits))
  }, [classes, availability, currentClassIds, studentLevel])

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
            <Tooltip title="Ver turmas e disponibilidade">
              <IconButton size="small" onClick={() => setDetail(r)}>
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

      <Dialog
        open={!!detail}
        onClose={() => { setDetail(null); setSelectedClassId('') }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Turmas e disponibilidade — {detail?.full_name}</DialogTitle>
        <DialogContent>
          {detail && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              {detail.conflict_active && (
                <Chip icon={<Warning />} label="Há conflito entre as turmas atuais e a nova disponibilidade" color="warning" variant="outlined" sx={{ alignSelf: 'flex-start' }} />
              )}

              <Typography variant="subtitle2" fontWeight={700} color="primary">Turmas atuais do aluno</Typography>
              {detail.classes_snapshot?.length ? (
                <Stack spacing={1}>
                  {detail.classes_snapshot.map((c, i) => (
                    <Box key={c.id ?? i} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                      <Typography variant="body2" fontWeight={600}>{c.name}</Typography>
                      {c.schedule.length ? c.schedule.map((s, j) => (
                        <Typography key={j} variant="caption" color="text.secondary" display="block">
                          {dayLabel(s.day)} — {s.start_time} às {s.end_time}
                        </Typography>
                      )) : (
                        <Typography variant="caption" color="text.secondary">Sem horário cadastrado.</Typography>
                      )}
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">O aluno não estava em nenhuma turma.</Typography>
              )}

              <Divider />

              <Typography variant="subtitle2" fontWeight={700} color="primary">Nova disponibilidade registrada</Typography>
              {availability.length ? (
                <Stack spacing={1}>
                  {availability.map((a, i) => (
                    <Box key={i}>
                      <Typography variant="body2" fontWeight={600}>{dayLabel(a.day)}</Typography>
                      {a.slots.map((slot, j) => (
                        <Typography key={j} variant="caption" color="text.secondary" display="block">
                          {slot.start} às {slot.end}
                        </Typography>
                      ))}
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">Nenhuma disponibilidade informada.</Typography>
              )}

              {detail.student_id && (
                <>
                  <Divider />
                  <Typography variant="subtitle2" fontWeight={700} color="primary">Alocar em uma turma</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {studentLevel
                      ? `Sugestão por disponibilidade do aluno e por nível (${studentLevel}). As turmas sugeridas aparecem primeiro.`
                      : 'Sugestão pela disponibilidade do aluno (sem nivelamento registrado). As turmas compatíveis aparecem primeiro.'}
                  </Typography>
                  <TextField
                    select
                    label="Selecione a turma"
                    fullWidth
                    size="small"
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                  >
                    {rankedClasses.length === 0 && <MenuItem disabled>Nenhuma turma disponível</MenuItem>}
                    {rankedClasses.map(({ cls, fits, timeFits, levelFits }) => (
                      <MenuItem key={cls.id} value={cls.id}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%" spacing={1}>
                          <span>{cls.name}</span>
                          <Stack direction="row" spacing={0.5}>
                            {fits && <Chip label="Sugerida" size="small" color="success" />}
                            {!timeFits && <Chip label="Fora do horário" size="small" color="warning" variant="outlined" />}
                            {timeFits && !levelFits && <Chip label="Outro nível" size="small" color="warning" variant="outlined" />}
                          </Stack>
                        </Stack>
                      </MenuItem>
                    ))}
                  </TextField>
                  {(() => {
                    const sel = rankedClasses.find((r) => r.cls.id === selectedClassId)
                    if (!sel) return null
                    if (!sel.timeFits) {
                      return <Alert severity="warning">Esta turma não cabe na disponibilidade que o aluno registrou.</Alert>
                    }
                    if (!sel.levelFits) {
                      return <Alert severity="warning">O nível do aluno ({studentLevel}) não corresponde ao(s) nível(is) desta turma.</Alert>
                    }
                    return null
                  })()}
                </>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDetail(null); setSelectedClassId('') }}>Fechar</Button>
          {detail?.student_id && (
            <Button
              variant="contained"
              disabled={!selectedClassId || allocateMutation.isPending}
              startIcon={allocateMutation.isPending ? <CircularProgress size={16} color="inherit" /> : null}
              onClick={() => detail.student_id && allocateMutation.mutate({ classId: selectedClassId, studentId: detail.student_id })}
            >
              Alocar na turma
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}
