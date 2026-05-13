import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert, Autocomplete, Box, Button, Card, CardContent, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl,
  Grid, InputLabel, MenuItem, Select, Stack, TextField, Tooltip, Typography,
} from '@mui/material'
import { InfoOutlined } from '@mui/icons-material'
import dayjs from 'dayjs'
import { hourClosingsApi } from '@/api/hour-closings.api'
import { teachersApi } from '@/api/teachers.api'
import { DatePickerField } from '@/components/common/DatePickerField'
import { useSnackbarStore } from '@/store/snackbar.store'
import { getApiError } from '@/utils/errors'
import type { HourClosing, HourClosingStatus, Teacher } from '@/types'

const STATUS_LABEL: Record<HourClosingStatus, string> = {
  pending: 'Pendente', approved: 'Aprovado', rejected: 'Reprovado', cancelled: 'Cancelado',
}
const STATUS_COLOR: Record<HourClosingStatus, 'warning' | 'success' | 'error' | 'default'> = {
  pending: 'warning', approved: 'success', rejected: 'error', cancelled: 'default',
}

function fmt(val: number) {
  return `R$ ${Number(val).toFixed(2).replace('.', ',')}`
}

const reviewSchema = z.object({
  final_value: z.coerce.number().positive('Valor deve ser positivo'),
})
type ReviewForm = z.infer<typeof reviewSchema>

const SUGGESTION_TOOLTIP =
  'Valor calculado automaticamente com base nas turmas do professor no período informado ' +
  '(nº de aulas × duração × valor/hora cadastrado no perfil do professor).'

interface ReviewModalProps {
  closing: HourClosing
  onClose: () => void
}

function ReviewModal({ closing, onClose }: ReviewModalProps) {
  const qc = useQueryClient()
  const { show } = useSnackbarStore()
  const { register, handleSubmit, formState: { errors } } = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema) as any,
    defaultValues: { final_value: Number(closing.final_value) },
  })

  const mutation = useMutation({
    mutationFn: (v: { status: 'approved' | 'rejected'; final_value: number }) =>
      hourClosingsApi.review(closing.id, v),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-hour-closings'] })
      show(vars.status === 'approved' ? 'Fechamento aprovado!' : 'Fechamento reprovado.')
      onClose()
    },
    onError: (err) => show(getApiError(err, 'Erro ao revisar fechamento.'), 'error'),
  })

  const handleAction = (action: 'approved' | 'rejected') => {
    handleSubmit((v) => mutation.mutate({ status: action, final_value: v.final_value }))()
  }

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Revisar Fechamento</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Grid container spacing={1}>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" color="text.secondary">Professor</Typography>
              <Typography variant="body2" fontWeight={600}>{closing.teacher.name}</Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" color="text.secondary">Valor/hora</Typography>
              <Typography variant="body2">{fmt(closing.teacher.hourly_rate)}</Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" color="text.secondary">Período</Typography>
              <Typography variant="body2">{closing.date_from} – {closing.date_to}</Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" color="text.secondary">Horas calculadas</Typography>
              <Typography variant="body2">{closing.total_hours}h</Typography>
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
            Valor sugerido: <strong>{fmt(closing.suggested_value)}</strong>
            {closing.notes && <> &nbsp;·&nbsp; Obs: {closing.notes}</>}
          </Alert>

          {closing.entries.length > 0 && (
            <>
              <Divider />
              <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase">
                Aulas ({closing.entries.length})
              </Typography>
              <Stack spacing={0.5}>
                {closing.entries.map((e) => (
                  <Typography key={e.id} variant="caption" color="text.secondary">
                    {dayjs(e.lesson_date).format('DD/MM/YYYY')} · {e.class_name} · {e.start_time} – {e.end_time}
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
          onClick={() => handleAction('rejected')}
        >
          Reprovar
        </Button>
        <Button
          variant="contained" color="success"
          disabled={mutation.isPending}
          startIcon={mutation.isPending ? <CircularProgress size={14} color="inherit" /> : null}
          onClick={() => handleAction('approved')}
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
  const [statusFilter, setStatusFilter] = useState<HourClosingStatus | ''>('')
  const [reviewTarget, setReviewTarget] = useState<HourClosing | null>(null)

  const { data: teachers = [] } = useQuery({ queryKey: ['teachers'], queryFn: () => teachersApi.list() })

  const { data: closings = [], isLoading } = useQuery({
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
        <DatePickerField
          label="De"
          size="small"
          value={dateFrom || null}
          onChange={(v) => setDateFrom(v ?? '')}
          sx={{ minWidth: 150 }}
        />
        <DatePickerField
          label="Até"
          size="small"
          value={dateTo || null}
          onChange={(v) => setDateTo(v ?? '')}
          sx={{ minWidth: 150 }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value as any)}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="pending">Pendente</MenuItem>
            <MenuItem value="approved">Aprovado</MenuItem>
            <MenuItem value="rejected">Reprovado</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {isLoading ? (
        <Typography color="text.secondary">Carregando...</Typography>
      ) : closings.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography color="text.secondary">Nenhuma solicitação encontrada.</Typography>
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {closings.map((c) => (
            <Card key={c.id} variant="outlined">
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={1}>
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Typography variant="body2" fontWeight={600}>{c.teacher.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{c.date_from} – {c.date_to}</Typography>
                      <Chip label={STATUS_LABEL[c.status]} color={STATUS_COLOR[c.status]} size="small" />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {c.total_hours}h &nbsp;·&nbsp; Sugerido: {fmt(c.suggested_value)} &nbsp;·&nbsp; Final: {fmt(c.final_value)}
                      {c.notes && ` · ${c.notes}`}
                    </Typography>
                  </Box>
                  {c.status === 'pending' && (
                    <Button size="small" variant="outlined" onClick={() => setReviewTarget(c)}>
                      Revisar
                    </Button>
                  )}
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {reviewTarget && <ReviewModal closing={reviewTarget} onClose={() => setReviewTarget(null)} />}
    </Box>
  )
}
