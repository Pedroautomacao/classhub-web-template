import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert, Box, Button, Card, CardContent, CardHeader, Checkbox, Chip,
  CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, Grid, IconButton, MenuItem, Stack, TextField, Tooltip, Typography,
} from '@mui/material'
import {
  Add, Delete, Edit, InfoOutlined, Send, EventNote,
} from '@mui/icons-material'
import dayjs from 'dayjs'
import { DatePickerField } from '@/components/common/DatePickerField'
import { TimePickerField } from '@/components/common/TimePickerField'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import {
  hourClosingsApi,
  hourEntriesApi,
  hourSubmissionsApi,
} from '@/api/hour-closings.api'
import { useSnackbarStore } from '@/store/snackbar.store'
import { getApiError } from '@/utils/errors'
import type {
  AvailableClassForClosing, HourEntry, HourEntryStatus, HourEntryUpdatePayload,
} from '@/types'

const STATUS_LABEL: Record<HourEntryStatus, string> = {
  draft: 'Aguardando envio',
  pending: 'Em análise',
  approved: 'Aprovado',
  rejected: 'Reprovado',
  cancelled: 'Cancelado',
}
const STATUS_COLOR: Record<HourEntryStatus, 'default' | 'warning' | 'success' | 'error'> = {
  draft: 'default',
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  cancelled: 'default',
}

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function fmt(val: number) {
  return `R$ ${Number(val).toFixed(2).replace('.', ',')}`
}

function fmtDate(d: string) {
  return dayjs(d).format('DD/MM/YYYY')
}

function durationHours(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60)
}

function lastDayOfMonth(year: number, month0: number): string {
  return dayjs(new Date(year, month0 + 1, 0)).format('YYYY-MM-DD')
}

function firstDayOfMonth(year: number, month0: number): string {
  return `${year}-${String(month0 + 1).padStart(2, '0')}-01`
}

// ── New entry form (single lesson) ───────────────────────────────────────────

function NewEntryForm() {
  const qc = useQueryClient()
  const { show } = useSnackbarStore()

  const [date, setDate] = useState('')
  const [selectedClass, setSelectedClass] = useState<AvailableClassForClosing | null>(null)
  const [specialType, setSpecialType] = useState<'avulsa' | 'reuniao' | null>(null)
  const [specialName, setSpecialName] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [err, setErr] = useState('')

  const { data: classes = [], isFetching } = useQuery({
    queryKey: ['available-classes', date],
    queryFn: () => hourClosingsApi.getAvailableClasses(date),
    enabled: !!date,
  })

  const reset = () => {
    setDate(''); setSelectedClass(null); setSpecialType(null)
    setSpecialName(''); setStart(''); setEnd(''); setErr('')
  }

  const mutation = useMutation({
    mutationFn: hourEntriesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-entries'] })
      show('Aula registrada!')
      reset()
    },
    onError: (e) => show(getApiError(e, 'Erro ao registrar.'), 'error'),
  })

  const handleClassChange = (value: string) => {
    setErr('')
    if (value === '__avulsa__' || value === '__reuniao__') {
      setSpecialType(value === '__avulsa__' ? 'avulsa' : 'reuniao')
      setSelectedClass(null); setSpecialName(''); setStart(''); setEnd('')
    } else {
      setSpecialType(null); setSpecialName('')
      const cls = classes.find((c) => c.class_id === value) ?? null
      setSelectedClass(cls)
      if (cls) { setStart(cls.start_time); setEnd(cls.end_time) }
      else { setStart(''); setEnd('') }
    }
  }

  const canSubmit = !!date && !!start && !!end

  const submit = () => {
    if (!canSubmit) return
    if (end <= start) { setErr('O horário de término deve ser após o de início.'); return }
    const class_id = specialType ? null : (selectedClass?.class_id ?? null)
    const defaultName = specialType === 'reuniao' ? 'Reunião' : 'Aula avulsa'
    const class_name = specialType
      ? (specialName.trim() || defaultName)
      : (selectedClass?.class_name ?? 'Aula avulsa')
    mutation.mutate({ class_id, class_name, lesson_date: date, start_time: start, end_time: end })
  }

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardHeader
        title="Registrar aula"
        titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
        subheader="Cada aula trabalhada vira um registro 'aguardando envio'. Quando quiser, agrupe vários numa única submissão pra análise."
        subheaderTypographyProps={{ variant: 'caption' }}
      />
      <CardContent>
        <Grid container spacing={1.5} alignItems="flex-end">
          <Grid size={{ xs: 12, sm: 3 }}>
            <DatePickerField
              label="Data da aula *" fullWidth size="small"
              value={date || null} onChange={(v) => { setDate(v ?? ''); setSelectedClass(null); setSpecialType(null); setStart(''); setEnd('') }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              select label="Turma / Tipo" fullWidth size="small"
              value={specialType === 'avulsa' ? '__avulsa__' : specialType === 'reuniao' ? '__reuniao__' : (selectedClass?.class_id ?? '')}
              onChange={(e) => handleClassChange(e.target.value)}
              disabled={!date || isFetching}
            >
              <MenuItem value="">Selecione...</MenuItem>
              <MenuItem value="__avulsa__">Aula avulsa</MenuItem>
              <MenuItem value="__reuniao__">Reunião</MenuItem>
              {classes.map((c) => (
                <MenuItem key={c.class_id} value={c.class_id}>{c.class_name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          {specialType && (
            <Grid size={{ xs: 12, sm: 2 }}>
              <TextField
                label="Descrição (opcional)" fullWidth size="small"
                value={specialName} onChange={(e) => setSpecialName(e.target.value)}
              />
            </Grid>
          )}
          <Grid size={{ xs: 6, sm: specialType ? 1 : 2 }}>
            <TimePickerField label="Início *" value={start} onChange={setStart} size="small" sx={{ width: '100%' }} />
          </Grid>
          <Grid size={{ xs: 6, sm: specialType ? 1 : 2 }}>
            <TimePickerField label="Término *" value={end} onChange={setEnd} min={start || undefined} size="small" sx={{ width: '100%' }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 2 }}>
            <Button
              variant="contained" fullWidth startIcon={<Add />}
              disabled={!canSubmit || mutation.isPending}
              onClick={submit}
            >
              {mutation.isPending ? 'Salvando...' : 'Registrar'}
            </Button>
          </Grid>
        </Grid>
        {err && <Typography variant="caption" color="error" mt={1} display="block">{err}</Typography>}
      </CardContent>
    </Card>
  )
}

// ── Edit-entry modal ─────────────────────────────────────────────────────────

function EditEntryModal({ entry, onClose }: { entry: HourEntry; onClose: () => void }) {
  const qc = useQueryClient()
  const { show } = useSnackbarStore()
  const [date, setDate] = useState(entry.lesson_date)
  const [start, setStart] = useState(entry.start_time)
  const [end, setEnd] = useState(entry.end_time)
  const [className, setClassName] = useState(entry.class_name)

  const mutation = useMutation({
    mutationFn: (payload: HourEntryUpdatePayload) => hourEntriesApi.update(entry.id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-entries'] })
      show('Registro atualizado!')
      onClose()
    },
    onError: (e) => show(getApiError(e, 'Erro ao atualizar.'), 'error'),
  })

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Editar registro</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <DatePickerField label="Data da aula" fullWidth value={date} onChange={(v) => setDate(v ?? '')} />
          <TextField label="Descrição" fullWidth value={className} onChange={(e) => setClassName(e.target.value)} />
          <Stack direction="row" spacing={2}>
            <TimePickerField label="Início" value={start} onChange={setStart} sx={{ flex: 1 }} />
            <TimePickerField label="Término" value={end} onChange={setEnd} min={start || undefined} sx={{ flex: 1 }} />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={mutation.isPending}>Cancelar</Button>
        <Button
          variant="contained"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate({ class_name: className, lesson_date: date, start_time: start, end_time: end })}
        >
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Bulk submit modal (por mês/ano) ──────────────────────────────────────────

function BulkSubmitDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const { show } = useSnackbarStore()
  const now = dayjs()
  const [month, setMonth] = useState(now.month()) // 0-indexed
  const [year, setYear] = useState(now.year())
  const [notes, setNotes] = useState('')

  const dateFrom = firstDayOfMonth(year, month)
  const dateTo = lastDayOfMonth(year, month)

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['my-entries', 'bulk', year, month],
    queryFn: () => hourEntriesApi.listMy({
      status_filter: 'draft',
      lesson_date_from: dateFrom,
      lesson_date_to: dateTo,
    }),
  })

  const mutation = useMutation({
    mutationFn: hourSubmissionsApi.create,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['my-entries'] })
      qc.invalidateQueries({ queryKey: ['my-hour-closings'] })
      show(`Submissão criada! ${entries.length} registros enviados (${fmt(data.suggested_value)}).`)
      onClose()
    },
    onError: (e) => show(getApiError(e, 'Erro ao submeter.'), 'error'),
  })

  const totalHours = entries.reduce((sum, e) => sum + durationHours(e.start_time, e.end_time), 0)
  const totalValue = entries.reduce(
    (sum, e) => sum + durationHours(e.start_time, e.end_time) * Number(e.hourly_rate_snapshot), 0,
  )

  const yearOptions = Array.from({ length: 6 }, (_, i) => now.year() - 3 + i)

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Submeter em massa</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Alert severity="info" icon={<InfoOutlined fontSize="small" />}>
            Listando aulas <strong>dadas em {MONTHS_PT[month]}/{year}</strong> que ainda estão em rascunho.
            Aulas registradas com atraso aparecem aqui se a data da aula é desse mês.
          </Alert>
          <Stack direction="row" spacing={2}>
            <TextField
              select label="Mês" fullWidth size="small"
              value={month} onChange={(e) => setMonth(Number(e.target.value))}
            >
              {MONTHS_PT.map((m, i) => <MenuItem key={i} value={i}>{m}</MenuItem>)}
            </TextField>
            <TextField
              select label="Ano" fullWidth size="small"
              value={year} onChange={(e) => setYear(Number(e.target.value))}
            >
              {yearOptions.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
            </TextField>
          </Stack>
          <TextField
            label="Observações (opcional)" fullWidth size="small" multiline rows={2}
            value={notes} onChange={(e) => setNotes(e.target.value)}
          />

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : entries.length === 0 ? (
            <Alert severity="warning">
              Nenhum rascunho encontrado para {MONTHS_PT[month]}/{year}.
            </Alert>
          ) : (
            <>
              <Typography variant="caption" fontWeight={600} color="text.secondary" textTransform="uppercase">
                {entries.length} registro{entries.length !== 1 ? 's' : ''} · {totalHours.toFixed(2)}h · {fmt(totalValue)}
              </Typography>
              <Stack spacing={0.5} sx={{ maxHeight: 240, overflowY: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                {entries.map((e) => (
                  <Typography key={e.id} variant="caption" color="text.secondary">
                    {fmtDate(e.lesson_date)} · {e.class_name} · {e.start_time} – {e.end_time}
                  </Typography>
                ))}
              </Stack>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={mutation.isPending}>Cancelar</Button>
        <Button
          variant="contained"
          disabled={mutation.isPending || entries.length === 0}
          onClick={() => mutation.mutate({ entry_ids: entries.map((e) => e.id), notes: notes || null })}
        >
          {mutation.isPending ? 'Enviando...' : 'Confirmar e enviar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Tab content ──────────────────────────────────────────────────────────────

export function PunchCardTab() {
  const qc = useQueryClient()
  const { show } = useSnackbarStore()

  const [statusFilter, setStatusFilter] = useState<HourEntryStatus | ''>('draft')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [editTarget, setEditTarget] = useState<HourEntry | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<HourEntry | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [submitNotes, setSubmitNotes] = useState('')

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['my-entries', statusFilter, dateFrom, dateTo],
    queryFn: () => hourEntriesApi.listMy({
      status_filter: (statusFilter as HourEntryStatus) || undefined,
      lesson_date_from: dateFrom || undefined,
      lesson_date_to: dateTo || undefined,
    }),
  })

  const drafts = useMemo(() => entries.filter((e) => e.status === 'draft'), [entries])

  const deleteMutation = useMutation({
    mutationFn: (id: string) => hourEntriesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-entries'] })
      setDeleteTarget(null)
      show('Registro excluído.')
    },
    onError: (e) => show(getApiError(e, 'Erro ao excluir.'), 'error'),
  })

  const submitMutation = useMutation({
    mutationFn: hourSubmissionsApi.create,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['my-entries'] })
      qc.invalidateQueries({ queryKey: ['my-hour-closings'] })
      setSelected(new Set())
      setSubmitNotes('')
      show(`Submissão criada! ${data.entries.length} registros enviados (${fmt(data.suggested_value)}).`)
    },
    onError: (e) => show(getApiError(e, 'Erro ao submeter.'), 'error'),
  })

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === drafts.length && drafts.length > 0) setSelected(new Set())
    else setSelected(new Set(drafts.map((e) => e.id)))
  }

  return (
    <Box>
      <NewEntryForm />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2} alignItems="center" justifyContent="space-between">
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <TextField
            select label="Status" size="small" value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as HourEntryStatus | ''); setSelected(new Set()) }}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="draft">Aguardando envio</MenuItem>
            <MenuItem value="pending">Em análise</MenuItem>
            <MenuItem value="approved">Aprovados</MenuItem>
            <MenuItem value="rejected">Reprovados</MenuItem>
          </TextField>
          <DatePickerField label="De" size="small" value={dateFrom || null} onChange={(v) => setDateFrom(v ?? '')} sx={{ minWidth: 150 }} />
          <DatePickerField label="Até" size="small" value={dateTo || null} onChange={(v) => setDateTo(v ?? '')} minDate={dateFrom || undefined} sx={{ minWidth: 150 }} />
        </Stack>
        <Button variant="outlined" startIcon={<EventNote />} onClick={() => setBulkOpen(true)}>
          Submeter em massa
        </Button>
      </Stack>

      {/* Multi-select submission bar */}
      {drafts.length > 0 && statusFilter === 'draft' && (
        <Card variant="outlined" sx={{ mb: 2, bgcolor: selected.size > 0 ? 'primary.50' : 'transparent' }}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} spacing={1.5} justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Checkbox
                  size="small"
                  checked={selected.size === drafts.length && drafts.length > 0}
                  indeterminate={selected.size > 0 && selected.size < drafts.length}
                  onChange={toggleAll}
                />
                <Typography variant="body2">
                  {selected.size > 0
                    ? <><strong>{selected.size}</strong> selecionado{selected.size !== 1 ? 's' : ''}</>
                    : `Selecione registros para enviar para análise`}
                </Typography>
              </Stack>
              {selected.size > 0 && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    size="small" placeholder="Observações (opcional)" value={submitNotes}
                    onChange={(e) => setSubmitNotes(e.target.value)} sx={{ minWidth: 220 }}
                  />
                  <Button
                    variant="contained" size="small" startIcon={<Send />}
                    disabled={submitMutation.isPending}
                    onClick={() => submitMutation.mutate({ entry_ids: Array.from(selected), notes: submitNotes || null })}
                  >
                    Enviar para análise
                  </Button>
                </Stack>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
      ) : entries.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
          <Typography variant="body2">Nenhum registro encontrado.</Typography>
          <Typography variant="caption">Registre uma aula no formulário acima.</Typography>
        </Box>
      ) : (
        <Stack spacing={1}>
          {entries.map((e) => {
            const isDraft = e.status === 'draft'
            const isSelected = selected.has(e.id)
            return (
              <Card key={e.id} variant="outlined" sx={{ bgcolor: isSelected ? 'primary.50' : 'transparent' }}>
                <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    {isDraft && (
                      <Checkbox size="small" checked={isSelected} onChange={() => toggle(e.id)} />
                    )}
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                        <Typography variant="body2" fontWeight={600}>
                          {fmtDate(e.lesson_date)} · {e.class_name}
                        </Typography>
                        <Chip label={STATUS_LABEL[e.status]} color={STATUS_COLOR[e.status]} size="small" />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {e.start_time} – {e.end_time} · {durationHours(e.start_time, e.end_time).toFixed(2)}h · {fmt(Number(e.hourly_rate_snapshot) * durationHours(e.start_time, e.end_time))}
                      </Typography>
                    </Box>
                    {isDraft && (
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => setEditTarget(e)}><Edit fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir">
                          <IconButton size="small" color="error" onClick={() => setDeleteTarget(e)}><Delete fontSize="small" /></IconButton>
                        </Tooltip>
                      </Stack>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            )
          })}
        </Stack>
      )}

      {editTarget && <EditEntryModal entry={editTarget} onClose={() => setEditTarget(null)} />}
      {bulkOpen && <BulkSubmitDialog onClose={() => setBulkOpen(false)} />}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir registro"
        message={deleteTarget ? `Excluir a aula de ${fmtDate(deleteTarget.lesson_date)} (${deleteTarget.class_name})?` : ''}
        loading={deleteMutation.isPending}
        confirmColor="error"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />

      <Divider sx={{ my: 2 }} />
      <Alert severity="info" icon={<InfoOutlined fontSize="small" />} sx={{ '& .MuiAlert-message': { fontSize: '0.8125rem' } }}>
        <strong>Como funciona:</strong> registre aulas conforme acontecem (ficam em <em>aguardando envio</em>).
        Quando estiver pronto, selecione os registros e clique em <em>Enviar para análise</em>, ou use
        <em> Submeter em massa</em> pra enviar tudo de um mês de uma vez.
      </Alert>
    </Box>
  )
}
