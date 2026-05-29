import { useMemo, useState, type ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert, Box, Button, Card, CardContent, Checkbox, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton,
  MenuItem, Stack, TextField, Tooltip, Typography,
} from '@mui/material'
import {
  Cancel, CheckCircleOutline, DoDisturbAlt, Edit, ExpandLess, ExpandMore,
  HourglassEmpty, InfoOutlined,
} from '@mui/icons-material'
import dayjs from 'dayjs'
import { DatePickerField } from '@/components/common/DatePickerField'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import {
  hourClosingsApi, hourEntriesApi, hourSubmissionsApi,
} from '@/api/hour-closings.api'
import { useSnackbarStore } from '@/store/snackbar.store'
import { getApiError } from '@/utils/errors'
import type { HourClosing, HourClosingStatus, HourEntry } from '@/types'

const STATUS_LABEL: Record<HourClosingStatus, string> = {
  pending: 'Em análise',
  approved: 'Aprovado',
  rejected: 'Reprovado',
  cancelled: 'Cancelado',
}
const STATUS_COLOR: Record<HourClosingStatus, 'warning' | 'success' | 'error' | 'default'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  cancelled: 'default',
}
const STATUS_ICON: Record<HourClosingStatus, ReactNode> = {
  pending: <HourglassEmpty fontSize="inherit" />,
  approved: <CheckCircleOutline fontSize="inherit" />,
  rejected: <DoDisturbAlt fontSize="inherit" />,
  cancelled: <Cancel fontSize="inherit" />,
}

function fmt(val: number) {
  return `R$ ${Number(val).toFixed(2).replace('.', ',')}`
}
function fmtDate(d: string) {
  return dayjs(d).format('DD/MM/YYYY')
}

// ── Edit-entries modal (pending submissions) ─────────────────────────────────

function EditSubmissionModal({
  submission, onClose,
}: { submission: HourClosing; onClose: () => void }) {
  const qc = useQueryClient()
  const { show } = useSnackbarStore()

  const initialIds = new Set(submission.entries.map((e) => e.id))
  const [selectedIds, setSelectedIds] = useState<Set<string>>(initialIds)
  const [notes, setNotes] = useState(submission.notes ?? '')

  // Lista entries do professor: os que já estão na submissão + drafts disponíveis
  const { data: drafts = [], isLoading: loadingDrafts } = useQuery({
    queryKey: ['my-entries', 'drafts-for-edit'],
    queryFn: () => hourEntriesApi.listMy({ status_filter: 'draft' }),
  })

  // Mostra os entries atuais da submissão + os drafts disponíveis pra adicionar
  const allEntries = useMemo<HourEntry[]>(() => {
    const submissionEntries: HourEntry[] = submission.entries.map((e) => ({
      id: e.id,
      teacher_id: submission.teacher_id,
      submission_id: submission.id,
      class_id: e.class_id,
      class_name: e.class_name,
      lesson_date: e.lesson_date,
      start_time: e.start_time,
      end_time: e.end_time,
      hourly_rate_snapshot: e.hourly_rate_snapshot,
      status: 'pending',
      created_at: '',
      updated_at: '',
    }))
    return [...submissionEntries, ...drafts].sort((a, b) =>
      a.lesson_date < b.lesson_date ? 1 : -1)
  }, [submission, drafts])

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const mutation = useMutation({
    mutationFn: () => hourSubmissionsApi.update(submission.id, {
      entry_ids: Array.from(selectedIds),
      notes: notes || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-hour-closings'] })
      qc.invalidateQueries({ queryKey: ['my-entries'] })
      show('Submissão atualizada!')
      onClose()
    },
    onError: (e) => show(getApiError(e, 'Erro ao atualizar submissão.'), 'error'),
  })

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Editar submissão</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Alert severity="info" icon={<InfoOutlined fontSize="small" />}>
            Marque os registros que devem fazer parte desta submissão. Os que você desmarcar
            voltam a ser <em>rascunho</em>; rascunhos novos marcados aqui passam pra <em>em análise</em>.
          </Alert>
          <TextField
            label="Observações" fullWidth size="small" multiline rows={2}
            value={notes} onChange={(e) => setNotes(e.target.value)}
          />
          {loadingDrafts ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <Stack spacing={0.5} sx={{ maxHeight: 320, overflowY: 'auto' }}>
              {allEntries.map((e) => {
                const inSubmission = initialIds.has(e.id)
                const checked = selectedIds.has(e.id)
                return (
                  <Stack key={e.id} direction="row" alignItems="center" spacing={1} sx={{
                    px: 1, py: 0.5, borderRadius: 1,
                    border: '1px solid', borderColor: 'divider',
                    bgcolor: checked ? 'primary.50' : 'transparent',
                  }}>
                    <Checkbox size="small" checked={checked} onChange={() => toggle(e.id)} />
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      {fmtDate(e.lesson_date)} · {e.class_name} · {e.start_time}–{e.end_time}
                    </Typography>
                    {inSubmission ? (
                      <Chip label="Na submissão" size="small" color="warning" variant="outlined" />
                    ) : (
                      <Chip label="Rascunho" size="small" variant="outlined" />
                    )}
                  </Stack>
                )
              })}
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={mutation.isPending}>Cancelar</Button>
        <Button
          variant="contained"
          disabled={mutation.isPending || selectedIds.size === 0}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Tab content ──────────────────────────────────────────────────────────────

export function SubmissionsTab() {
  const qc = useQueryClient()
  const { show } = useSnackbarStore()

  const [statusFilter, setStatusFilter] = useState<HourClosingStatus | ''>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editTarget, setEditTarget] = useState<HourClosing | null>(null)
  const [cancelTarget, setCancelTarget] = useState<HourClosing | null>(null)

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['my-hour-closings', dateFrom, dateTo, statusFilter],
    queryFn: () => hourClosingsApi.listMy({
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      status_filter: (statusFilter as HourClosingStatus) || undefined,
    }),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => hourClosingsApi.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-hour-closings'] })
      qc.invalidateQueries({ queryKey: ['my-entries'] })
      setCancelTarget(null)
      show('Submissão cancelada. Os registros voltaram a ser rascunho.')
    },
    onError: (e) => show(getApiError(e, 'Erro ao cancelar.'), 'error'),
  })

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2} alignItems="center">
        <TextField
          select label="Status" size="small" value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as HourClosingStatus | '')}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="pending">Em análise</MenuItem>
          <MenuItem value="approved">Aprovados</MenuItem>
          <MenuItem value="rejected">Reprovados</MenuItem>
          <MenuItem value="cancelled">Cancelados</MenuItem>
        </TextField>
        <DatePickerField label="De" size="small" value={dateFrom || null} onChange={(v) => setDateFrom(v ?? '')} sx={{ minWidth: 150 }} />
        <DatePickerField label="Até" size="small" value={dateTo || null} onChange={(v) => setDateTo(v ?? '')} minDate={dateFrom || undefined} sx={{ minWidth: 150 }} />
      </Stack>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
      ) : submissions.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
          <Typography variant="body2">Nenhuma submissão encontrada.</Typography>
          <Typography variant="caption">Vá pra aba "Folha de ponto" pra registrar aulas e submeter pra análise.</Typography>
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {submissions.map((s) => (
            <Card key={s.id} variant="outlined">
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={1}>
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Typography variant="body2" fontWeight={600}>
                        {fmtDate(s.date_from)} – {fmtDate(s.date_to)}
                      </Typography>
                      <Chip
                        icon={STATUS_ICON[s.status] as any}
                        label={STATUS_LABEL[s.status]}
                        color={STATUS_COLOR[s.status]}
                        size="small"
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {s.total_hours}h · Sugerido: {fmt(s.suggested_value)} · Final: {fmt(s.final_value)}
                      {s.notes && ` · ${s.notes}`}
                    </Typography>
                    {s.status === 'rejected' && s.reviewer_response && (
                      <Alert severity="error" sx={{ mt: 1, py: 0.5 }}>
                        <strong>Motivo da reprovação:</strong> {s.reviewer_response}
                      </Alert>
                    )}
                  </Box>
                  <Stack direction="row" spacing={0.5} alignItems="center" flexShrink={0}>
                    <Button
                      size="small" variant="text"
                      startIcon={expandedId === s.id ? <ExpandLess /> : <ExpandMore />}
                      onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                    >
                      {s.entries.length} registro{s.entries.length !== 1 ? 's' : ''}
                    </Button>
                    {s.status === 'pending' && (
                      <>
                        <Tooltip title="Editar registros inclusos">
                          <IconButton size="small" onClick={() => setEditTarget(s)}><Edit fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Cancelar submissão">
                          <IconButton size="small" color="error" onClick={() => setCancelTarget(s)}><Cancel fontSize="small" /></IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Stack>
                </Stack>

                {expandedId === s.id && s.entries.length > 0 && (
                  <Stack spacing={0.5} mt={1.5} pl={0.5}>
                    <Divider sx={{ mb: 0.5 }} />
                    {s.entries.map((e) => (
                      <Typography key={e.id} variant="caption" color="text.secondary">
                        {fmtDate(e.lesson_date)} · {e.class_name} · {e.start_time}–{e.end_time} · {fmt(Number(e.hourly_rate_snapshot))}
                      </Typography>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {editTarget && <EditSubmissionModal submission={editTarget} onClose={() => setEditTarget(null)} />}
      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancelar submissão"
        message={cancelTarget
          ? `Cancelar a submissão de ${fmtDate(cancelTarget.date_from)} – ${fmtDate(cancelTarget.date_to)}? Os registros voltam a ser rascunho.`
          : ''}
        loading={cancelMutation.isPending}
        confirmColor="error"
        onConfirm={() => cancelTarget && cancelMutation.mutate(cancelTarget.id)}
        onCancel={() => setCancelTarget(null)}
      />
    </Box>
  )
}
