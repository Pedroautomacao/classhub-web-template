import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert, Autocomplete, Box, Button, Card, CardContent, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl,
  Grid, IconButton, InputLabel, MenuItem, Select, Stack, TextField, Tooltip,
  Typography,
} from '@mui/material'
import {
  Cancel, CheckCircleOutline, DoDisturbAlt, ExpandLess, ExpandMore,
  HourglassEmpty, InfoOutlined,
} from '@mui/icons-material'
import dayjs from 'dayjs'
import { hourClosingsApi } from '@/api/hour-closings.api'
import { teachersApi } from '@/api/teachers.api'
import { DatePickerField } from '@/components/common/DatePickerField'
import { useSnackbarStore } from '@/store/snackbar.store'
import { getApiError } from '@/utils/errors'
import type { HourClosing, HourClosingStatus, Teacher } from '@/types'

const STATUS_LABEL: Record<HourClosingStatus, string> = {
  pending: 'Em análise',
  approved: 'Aprovada',
  rejected: 'Reprovada',
  cancelled: 'Cancelada',
}
const STATUS_COLOR: Record<HourClosingStatus, 'warning' | 'success' | 'error' | 'default'> = {
  pending: 'warning', approved: 'success', rejected: 'error', cancelled: 'default',
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

const reviewSchema = z.object({
  final_value: z.coerce.number().positive('Valor deve ser positivo'),
  reviewer_response: z.string().optional(),
})
type ReviewForm = z.infer<typeof reviewSchema>

const SUGGESTION_TOOLTIP =
  'Soma dos snapshots de valor/hora de cada aula × duração. Os snapshots são congelados ' +
  'no momento em que o professor registrou cada aula — reajustes posteriores no valor/hora ' +
  'não afetam submissões antigas.'

interface ReviewModalProps {
  submission: HourClosing
  onClose: () => void
}

function ReviewModal({ submission, onClose }: ReviewModalProps) {
  const qc = useQueryClient()
  const { show } = useSnackbarStore()
  const { register, handleSubmit, getValues, formState: { errors } } = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema) as any,
    defaultValues: {
      final_value: Number(submission.final_value),
      reviewer_response: submission.reviewer_response ?? '',
    },
  })

  const mutation = useMutation({
    mutationFn: (v: { status: 'approved' | 'rejected'; final_value: number; reviewer_response?: string | null }) =>
      hourClosingsApi.review(submission.id, v),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-hour-closings'] })
      show(vars.status === 'approved' ? 'Submissão aprovada!' : 'Submissão reprovada.')
      onClose()
    },
    onError: (err) => show(getApiError(err, 'Erro ao revisar submissão.'), 'error'),
  })

  const handleApprove = handleSubmit((v) => {
    mutation.mutate({
      status: 'approved',
      final_value: v.final_value,
      reviewer_response: v.reviewer_response || null,
    })
  })

  const handleReject = () => {
    // Reprovação exige motivo
    const response = getValues('reviewer_response')
    if (!response || !response.trim()) {
      show('Informe o motivo da reprovação no campo "Resposta ao professor".', 'error')
      return
    }
    handleSubmit((v) => mutation.mutate({
      status: 'rejected',
      final_value: v.final_value,
      reviewer_response: v.reviewer_response || null,
    }))()
  }

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Revisar Submissão</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Grid container spacing={1}>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" color="text.secondary">Professor</Typography>
              <Typography variant="body2" fontWeight={600}>{submission.teacher.name}</Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" color="text.secondary">Valor/hora atual</Typography>
              <Typography variant="body2">{fmt(submission.teacher.hourly_rate)}</Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" color="text.secondary">Período coberto</Typography>
              <Typography variant="body2">{fmtDate(submission.date_from)} – {fmtDate(submission.date_to)}</Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" color="text.secondary">Horas calculadas</Typography>
              <Typography variant="body2">{submission.total_hours}h</Typography>
            </Grid>
          </Grid>

          <Stack direction="row" alignItems="center" spacing={1}>
            <TextField
              label="Valor final (R$)"
              type="number"
              size="small"
              fullWidth
              inputProps={{ step: '0.01', min: '0' }}
              error={!!errors.final_value}
              helperText={errors.final_value?.message}
              {...register('final_value')}
            />
            <Tooltip title={SUGGESTION_TOOLTIP} placement="top">
              <InfoOutlined fontSize="small" color="action" sx={{ cursor: 'help', flexShrink: 0 }} />
            </Tooltip>
          </Stack>

          <Alert severity="info" sx={{ fontSize: 12 }}>
            Valor sugerido (snapshots): <strong>{fmt(submission.suggested_value)}</strong>
            {submission.notes && <> &nbsp;·&nbsp; Obs do professor: {submission.notes}</>}
          </Alert>

          <TextField
            label="Resposta ao professor (obrigatório se reprovar)"
            multiline rows={3} fullWidth size="small"
            placeholder="Explique o motivo da reprovação ou deixe um comentário na aprovação."
            {...register('reviewer_response')}
          />

          {submission.entries.length > 0 && (
            <>
              <Divider />
              <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase">
                Aulas ({submission.entries.length})
              </Typography>
              <Stack spacing={0.5} sx={{ maxHeight: 200, overflowY: 'auto' }}>
                {submission.entries.map((e) => (
                  <Typography key={e.id} variant="caption" color="text.secondary">
                    {fmtDate(e.lesson_date)} · {e.class_name} · {e.start_time} – {e.end_time} · {fmt(Number(e.hourly_rate_snapshot))}
                  </Typography>
                ))}
              </Stack>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={mutation.isPending}>Fechar</Button>
        <Button
          variant="outlined" color="error"
          disabled={mutation.isPending}
          startIcon={mutation.isPending ? <CircularProgress size={14} color="inherit" /> : null}
          onClick={handleReject}
        >
          Reprovar
        </Button>
        <Button
          variant="contained" color="success"
          disabled={mutation.isPending}
          startIcon={mutation.isPending ? <CircularProgress size={14} color="inherit" /> : null}
          onClick={handleApprove}
        >
          Aprovar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export function HourClosingsAdminTab() {
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [statusFilter, setStatusFilter] = useState<HourClosingStatus | ''>('pending')
  const [reviewTarget, setReviewTarget] = useState<HourClosing | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: teachers = [] } = useQuery({ queryKey: ['teachers'], queryFn: () => teachersApi.list() })

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['admin-hour-closings', selectedTeacher?.id, dateFrom, dateTo, statusFilter],
    queryFn: () => hourClosingsApi.listAdmin({
      teacher_id: selectedTeacher?.id,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      status_filter: (statusFilter as HourClosingStatus) || undefined,
    }),
  })

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3} alignItems={{ sm: 'center' }} flexWrap="wrap">
        <Autocomplete
          options={teachers}
          getOptionLabel={(t) => t.name}
          value={selectedTeacher}
          onChange={(_, v) => setSelectedTeacher(v)}
          renderInput={(params) => <TextField {...params} label="Professor" size="small" />}
          sx={{ minWidth: 200 }}
        />
        <DatePickerField label="De" size="small" value={dateFrom || null} onChange={(v) => setDateFrom(v ?? '')} sx={{ minWidth: 150 }} />
        <DatePickerField label="Até" size="small" value={dateTo || null} onChange={(v) => setDateTo(v ?? '')} sx={{ minWidth: 150 }} />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value as any)}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="pending">Em análise</MenuItem>
            <MenuItem value="approved">Aprovadas</MenuItem>
            <MenuItem value="rejected">Reprovadas</MenuItem>
            <MenuItem value="cancelled">Canceladas</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
      ) : submissions.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography color="text.secondary">Nenhuma submissão encontrada.</Typography>
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {submissions.map((s) => (
            <Card key={s.id} variant="outlined">
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={1}>
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Typography variant="body2" fontWeight={600}>{s.teacher.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
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
                      {s.notes && ` · Obs prof: ${s.notes}`}
                    </Typography>
                    {s.reviewer_response && (s.status === 'approved' || s.status === 'rejected') && (
                      <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                        <strong>Resposta enviada:</strong> {s.reviewer_response}
                      </Typography>
                    )}
                  </Box>
                  <Stack direction="row" spacing={0.5} alignItems="center" flexShrink={0}>
                    <IconButton size="small" onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}>
                      {expandedId === s.id ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                    {s.status === 'pending' && (
                      <Button size="small" variant="contained" onClick={() => setReviewTarget(s)}>
                        Revisar
                      </Button>
                    )}
                  </Stack>
                </Stack>

                {expandedId === s.id && s.entries.length > 0 && (
                  <Stack spacing={0.5} mt={1.5} pl={0.5}>
                    <Divider sx={{ mb: 0.5 }} />
                    {s.entries.map((e) => (
                      <Typography key={e.id} variant="caption" color="text.secondary">
                        {fmtDate(e.lesson_date)} · {e.class_name} · {e.start_time} – {e.end_time} · {fmt(Number(e.hourly_rate_snapshot))}
                      </Typography>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {reviewTarget && <ReviewModal submission={reviewTarget} onClose={() => setReviewTarget(null)} />}
    </Box>
  )
}
