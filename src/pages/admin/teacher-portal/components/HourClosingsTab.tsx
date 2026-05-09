import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Button, Card, CardContent, CardHeader, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle, Grid,
  IconButton, MenuItem, Stack, TextField, Tooltip,
  Typography, Divider, Alert, Paper,
} from '@mui/material'
import { Edit, Cancel, Add, Delete, InfoOutlined, CheckCircleOutline, HourglassEmpty, DoDisturbAlt } from '@mui/icons-material'
import { hourClosingsApi } from '@/api/hour-closings.api'
import { useSnackbarStore } from '@/store/snackbar.store'
import { getApiError } from '@/utils/errors'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import type { AvailableClassForClosing, HourClosing, HourClosingStatus } from '@/types'
import dayjs from 'dayjs'

const STATUS_LABEL: Record<HourClosingStatus, string> = {
  pending: 'Pendente', approved: 'Aprovado', rejected: 'Reprovado', cancelled: 'Cancelado',
}
const STATUS_COLOR: Record<HourClosingStatus, 'warning' | 'success' | 'error' | 'default'> = {
  pending: 'warning', approved: 'success', rejected: 'error', cancelled: 'default',
}
const STATUS_TOOLTIP: Record<HourClosingStatus, string> = {
  pending: 'Aguardando revisão pela equipe administrativa',
  approved: 'Aprovado — pagamento em processamento',
  rejected: 'Reprovado — entre em contato com a administração',
  cancelled: 'Cancelado pelo professor',
}

function fmt(val: number) {
  return `R$ ${Number(val).toFixed(2).replace('.', ',')}`
}

function fmtDate(d: string) {
  return dayjs(d).format('DD/MM/YYYY')
}

function computeTotalHours(sessions: SessionEntry[]): number {
  return sessions.reduce((total, s) => {
    if (!s.start_time || !s.end_time) return total
    const [sh, sm] = s.start_time.split(':').map(Number)
    const [eh, em] = s.end_time.split(':').map(Number)
    const minutes = (eh * 60 + em) - (sh * 60 + sm)
    return total + Math.max(0, minutes / 60)
  }, 0)
}

interface SessionEntry {
  class_id: string | null
  class_name: string
  lesson_date: string
  start_time: string
  end_time: string
}

function NewClosingForm() {
  const qc = useQueryClient()
  const { show } = useSnackbarStore()

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [notes, setNotes] = useState('')
  const [sessions, setSessions] = useState<SessionEntry[]>([])
  const [sessionError, setSessionError] = useState('')

  const [sessionDate, setSessionDate] = useState('')
  const [selectedClass, setSelectedClass] = useState<AvailableClassForClosing | null>(null)
  const [specialType, setSpecialType] = useState<'avulsa' | 'reuniao' | null>(null)
  const [specialName, setSpecialName] = useState('')
  const [sessionStart, setSessionStart] = useState('')
  const [sessionEnd, setSessionEnd] = useState('')

  const { data: availableClasses = [], isFetching: loadingClasses } = useQuery({
    queryKey: ['available-classes', sessionDate],
    queryFn: () => hourClosingsApi.getAvailableClasses(sessionDate),
    enabled: !!sessionDate,
  })

  const handleDateChange = (date: string) => {
    setSessionDate(date)
    setSelectedClass(null)
    setSpecialType(null)
    setSpecialName('')
    setSessionStart('')
    setSessionEnd('')
    setSessionError('')
  }

  const handleClassChange = (value: string) => {
    setSessionError('')
    if (value === '__avulsa__' || value === '__reuniao__') {
      setSpecialType(value === '__avulsa__' ? 'avulsa' : 'reuniao')
      setSelectedClass(null)
      setSpecialName('')
      setSessionStart('')
      setSessionEnd('')
    } else {
      setSpecialType(null)
      setSpecialName('')
      const cls = availableClasses.find((c) => c.class_id === value) ?? null
      setSelectedClass(cls)
      if (cls) {
        setSessionStart(cls.start_time)
        setSessionEnd(cls.end_time)
      } else {
        setSessionStart('')
        setSessionEnd('')
      }
    }
  }

  const handleAddSession = () => {
    if (!sessionDate || !sessionStart || !sessionEnd) return

    const classId = specialType ? null : (selectedClass?.class_id ?? null)
    const defaultName = specialType === 'reuniao' ? 'Reunião' : 'Aula avulsa'
    const className = specialType
      ? (specialName.trim() || defaultName)
      : (selectedClass?.class_name ?? 'Aula avulsa')

    const conflict = sessions.some((s) => {
      const sameDay = s.lesson_date === sessionDate
      const sameClass = !specialType && classId !== null && s.class_id === classId
      const overlaps = sessionStart < s.end_time && sessionEnd > s.start_time
      return sameDay && sameClass && overlaps
    })

    if (conflict) {
      setSessionError('Já existe uma aula dessa turma nesse dia com horário conflitante.')
      return
    }

    setSessionError('')
    setSessions((prev) => [
      ...prev,
      { class_id: classId, class_name: className, lesson_date: sessionDate, start_time: sessionStart, end_time: sessionEnd },
    ])
    setSessionDate('')
    setSelectedClass(null)
    setSpecialType(null)
    setSpecialName('')
    setSessionStart('')
    setSessionEnd('')
  }

  const createMutation = useMutation({
    mutationFn: hourClosingsApi.create,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['my-hour-closings'] })
      setSessions([])
      setDateFrom('')
      setDateTo('')
      setNotes('')
      setSpecialType(null)
      setSpecialName('')
      show(`Fechamento criado! Valor sugerido: ${fmt(data.suggested_value)} (${data.total_hours}h)`)
    },
    onError: (err) => show(getApiError(err, 'Erro ao criar fechamento.'), 'error'),
  })

  const totalHours = computeTotalHours(sessions)
  const canSubmit = dateFrom && dateTo && sessions.length > 0

  const handleSubmit = () => {
    if (!canSubmit) return
    createMutation.mutate({
      date_from: dateFrom,
      date_to: dateTo,
      notes: notes || null,
      entries: sessions.map((s) => ({
        class_id: s.class_id,
        class_name: s.class_name,
        lesson_date: s.lesson_date,
        start_time: s.start_time,
        end_time: s.end_time,
      })),
    })
  }

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardHeader
        title="Nova Solicitação de Fechamento"
        titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
        subheader="Registre todas as aulas do período e envie a solicitação quando estiver pronto."
        subheaderTypographyProps={{ variant: 'caption' }}
      />
      <CardContent>
        <Stack spacing={2.5}>

          {/* How it works */}
          <Alert
            severity="info"
            icon={<InfoOutlined fontSize="small" />}
            sx={{ '& .MuiAlert-message': { fontSize: '0.8125rem' } }}
          >
            <strong>Como funciona:</strong> adicione todas as aulas lecionadas no período (pode ser o mês inteiro),
            defina o intervalo de datas e clique em <em>Solicitar Fechamento</em>. A equipe administrativa irá revisar e aprovar.
            Você pode editar ou cancelar enquanto a solicitação estiver pendente.
          </Alert>

          {/* Step 1 — Period */}
          <Box>
            <Typography variant="caption" fontWeight={700} color="primary" textTransform="uppercase" letterSpacing={0.5}>
              1. Período de referência
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
              Informe o intervalo de datas que este fechamento cobre (ex.: 01/05 a 31/05).
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Início do período *" type="date" fullWidth size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Fim do período *" type="date" fullWidth size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Observações" fullWidth size="small"
                  placeholder="Ex: reposições incluídas..."
                  value={notes} onChange={(e) => setNotes(e.target.value)}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider />

          {/* Step 2 — Add sessions */}
          <Box>
            <Typography variant="caption" fontWeight={700} color="primary" textTransform="uppercase" letterSpacing={0.5}>
              2. Registrar aulas
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
              Adicione cada aula lecionada: selecione a data, a turma e os horários. Para aulas fora do grade use "Aula avulsa"; para reuniões use "Reunião".
            </Typography>
            <Grid container spacing={1.5} alignItems="flex-end">
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  label="Data da aula *" type="date" fullWidth size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={sessionDate} onChange={(e) => handleDateChange(e.target.value)}
                  helperText=" "
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  select label="Turma / Tipo" fullWidth size="small"
                  value={specialType === 'avulsa' ? '__avulsa__' : specialType === 'reuniao' ? '__reuniao__' : (selectedClass?.class_id ?? '')}
                  onChange={(e) => handleClassChange(e.target.value)}
                  disabled={!sessionDate || loadingClasses}
                  helperText={sessionDate && !loadingClasses && availableClasses.length === 0 ? 'Nenhuma turma neste dia' : ' '}
                >
                  <MenuItem value="">Selecione...</MenuItem>
                  <MenuItem value="__avulsa__">Aula avulsa</MenuItem>
                  <MenuItem value="__reuniao__">Reunião</MenuItem>
                  {availableClasses.map((c) => (
                    <MenuItem key={c.class_id} value={c.class_id}>{c.class_name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              {specialType && (
                <Grid size={{ xs: 12, sm: 2 }}>
                  <TextField
                    label="Descrição (opcional)" fullWidth size="small"
                    placeholder={specialType === 'reuniao' ? 'Ex: Reunião pedagógica...' : 'Ex: Reposição...'}
                    value={specialName}
                    onChange={(e) => setSpecialName(e.target.value)}
                    helperText=" "
                  />
                </Grid>
              )}
              <Grid size={{ xs: 6, sm: specialType ? 1 : 2 }}>
                <TextField
                  label="Início *" type="time" fullWidth size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={sessionStart} onChange={(e) => setSessionStart(e.target.value)}
                  helperText=" "
                />
              </Grid>
              <Grid size={{ xs: 6, sm: specialType ? 1 : 2 }}>
                <TextField
                  label="Término *" type="time" fullWidth size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={sessionEnd} onChange={(e) => setSessionEnd(e.target.value)}
                  helperText=" "
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 2 }}>
                <Button
                  variant="outlined" fullWidth startIcon={<Add />}
                  disabled={!sessionDate || !sessionStart || !sessionEnd}
                  onClick={handleAddSession}
                  sx={{ mb: '22px' }}
                >
                  Adicionar
                </Button>
              </Grid>
            </Grid>
            {sessionError && (
              <Typography variant="caption" color="error">{sessionError}</Typography>
            )}

            {sessions.length > 0 ? (
              <Stack spacing={0.75} mt={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" fontWeight={600} color="text.secondary" textTransform="uppercase">
                    Lançamentos adicionados ({sessions.length})
                  </Typography>
                  <Typography variant="caption" fontWeight={600} color="primary">
                    Total: {totalHours % 1 === 0 ? totalHours : totalHours.toFixed(1)}h
                  </Typography>
                </Stack>
                {sessions.map((s, i) => (
                  <Stack key={i} direction="row" alignItems="center" justifyContent="space-between"
                    sx={{ px: 1.5, py: 0.75, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2">
                      <strong>{fmtDate(s.lesson_date)}</strong>
                      {' · '}{s.class_name}
                      {' · '}{s.start_time} – {s.end_time}
                    </Typography>
                    <IconButton size="small" color="error" onClick={() => setSessions((prev) => prev.filter((_, j) => j !== i))}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Stack>
                ))}
              </Stack>
            ) : (
              <Alert severity="info" sx={{ py: 0.5, mt: 1 }}>
                Nenhuma aula adicionada ainda. Preencha os campos acima e clique em <strong>Adicionar</strong>.
              </Alert>
            )}
          </Box>

          <Divider />

          {/* Step 3 — Submit */}
          <Box>
            <Typography variant="caption" fontWeight={700} color="primary" textTransform="uppercase" letterSpacing={0.5}>
              3. Enviar solicitação
            </Typography>
            {canSubmit ? (
              <Paper variant="outlined" sx={{ p: 1.5, mt: 1, mb: 1.5, borderColor: 'primary.light', bgcolor: 'primary.50' }}>
                <Typography variant="body2" color="text.secondary">
                  Período: <strong>{fmtDate(dateFrom)} – {fmtDate(dateTo)}</strong>
                  &nbsp;·&nbsp; {sessions.length} lançamento{sessions.length !== 1 ? 's' : ''}
                  &nbsp;·&nbsp; <strong>{totalHours % 1 === 0 ? totalHours : totalHours.toFixed(1)}h</strong> no total
                </Typography>
              </Paper>
            ) : (
              <Typography variant="caption" color="text.secondary" display="block" mt={0.5} mb={1.5}>
                {!dateFrom || !dateTo ? 'Defina o período de referência.' : 'Adicione pelo menos uma aula.'}
              </Typography>
            )}
            <Button
              variant="contained" size="small"
              disabled={!canSubmit || createMutation.isPending}
              onClick={handleSubmit}
              startIcon={createMutation.isPending ? <CircularProgress size={14} color="inherit" /> : null}
            >
              {createMutation.isPending ? 'Enviando...' : 'Solicitar Fechamento'}
            </Button>
          </Box>

        </Stack>
      </CardContent>
    </Card>
  )
}

const editSchema = z.object({
  final_value: z.coerce.number().positive('Valor deve ser positivo'),
  notes: z.string().optional(),
})
type EditForm = z.infer<typeof editSchema>

function EditModal({ closing, onClose }: { closing: HourClosing; onClose: () => void }) {
  const qc = useQueryClient()
  const { show } = useSnackbarStore()
  const { register, handleSubmit, formState: { errors } } = useForm<EditForm>({
    resolver: zodResolver(editSchema) as any,
    defaultValues: { final_value: Number(closing.final_value), notes: closing.notes ?? '' },
  })

  const mutation = useMutation({
    mutationFn: (v: EditForm) => hourClosingsApi.update(closing.id, v),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-hour-closings'] }); show('Fechamento atualizado!'); onClose() },
    onError: (err) => show(getApiError(err, 'Erro ao atualizar.'), 'error'),
  })

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Editar Fechamento</DialogTitle>
      <DialogContent>
        <Stack component="form" id="edit-closing-form" onSubmit={handleSubmit((v) => mutation.mutate(v))} spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Período: {fmtDate(closing.date_from as unknown as string)} – {fmtDate(closing.date_to as unknown as string)}
            &nbsp;|&nbsp; {closing.total_hours}h
            &nbsp;|&nbsp; Sugerido: {fmt(closing.suggested_value)}
          </Typography>
          <TextField
            label="Valor final (R$) *" type="number" fullWidth
            inputProps={{ step: '0.01', min: '0' }}
            error={!!errors.final_value} helperText={errors.final_value?.message}
            {...register('final_value')}
          />
          <TextField label="Observações" fullWidth multiline rows={2} {...register('notes')} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={mutation.isPending}>Cancelar</Button>
        <Button type="submit" form="edit-closing-form" variant="contained" disabled={mutation.isPending}
          startIcon={mutation.isPending ? <CircularProgress size={14} color="inherit" /> : null}>
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const STATUS_ICON: Record<HourClosingStatus, ReactNode> = {
  pending: <HourglassEmpty fontSize="inherit" />,
  approved: <CheckCircleOutline fontSize="inherit" />,
  rejected: <DoDisturbAlt fontSize="inherit" />,
  cancelled: <Cancel fontSize="inherit" />,
}

export function HourClosingsTab() {
  const qc = useQueryClient()
  const { show } = useSnackbarStore()
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [statusFilter, setStatusFilter] = useState<HourClosingStatus | ''>('')
  const [editTarget, setEditTarget] = useState<HourClosing | null>(null)
  const [cancelTarget, setCancelTarget] = useState<HourClosing | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: closings = [], isLoading } = useQuery({
    queryKey: ['my-hour-closings', dateFrom, dateTo, statusFilter],
    queryFn: () => hourClosingsApi.listMy({
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      status_filter: (statusFilter as HourClosingStatus) || undefined,
    }),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => hourClosingsApi.cancel(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-hour-closings'] }); setCancelTarget(null); show('Fechamento cancelado.') },
    onError: (err) => show(getApiError(err, 'Erro ao cancelar.'), 'error'),
  })

  return (
    <Box>
      <NewClosingForm />

      <Typography variant="subtitle2" fontWeight={600} mb={1.5} color="text.secondary">
        Histórico de Solicitações
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2} alignItems="center">
        <TextField label="De" type="date" size="small" value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ minWidth: 150 }} />
        <TextField label="Até" type="date" size="small" value={dateTo}
          onChange={(e) => setDateTo(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ minWidth: 150 }} />
        <TextField
          select label="Status" size="small" value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as HourClosingStatus | '')}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="pending">Pendente</MenuItem>
          <MenuItem value="approved">Aprovado</MenuItem>
          <MenuItem value="rejected">Reprovado</MenuItem>
          <MenuItem value="cancelled">Cancelado</MenuItem>
        </TextField>
      </Stack>

      {isLoading ? (
        <Stack alignItems="center" py={4}><CircularProgress size={28} /></Stack>
      ) : closings.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
          <Typography variant="body2">Nenhuma solicitação encontrada.</Typography>
          <Typography variant="caption">Use o formulário acima para criar seu primeiro fechamento.</Typography>
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {closings.map((c) => (
            <Card key={c.id} variant="outlined">
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={1}>
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Typography variant="body2" fontWeight={600}>
                        {fmtDate(c.date_from as unknown as string)} – {fmtDate(c.date_to as unknown as string)}
                      </Typography>
                      <Tooltip title={STATUS_TOOLTIP[c.status]}>
                        <Chip
                          icon={STATUS_ICON[c.status] as any}
                          label={STATUS_LABEL[c.status]}
                          color={STATUS_COLOR[c.status]}
                          size="small"
                        />
                      </Tooltip>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {c.total_hours}h &nbsp;·&nbsp; Sugerido: {fmt(c.suggested_value)} &nbsp;·&nbsp; Final: {fmt(c.final_value)}
                      {c.notes && ` · ${c.notes}`}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5} alignItems="center" flexShrink={0}>
                    <Button size="small" variant="text" onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                      {expandedId === c.id ? 'Ocultar aulas' : `Ver aulas (${c.entries.length})`}
                    </Button>
                    {c.status === 'pending' && (
                      <>
                        <Tooltip title="Editar valor ou observações">
                          <IconButton size="small" onClick={() => setEditTarget(c)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancelar solicitação">
                          <IconButton size="small" color="error" onClick={() => setCancelTarget(c)}>
                            <Cancel fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Stack>
                </Stack>

                {expandedId === c.id && c.entries.length > 0 && (
                  <Stack spacing={0.5} mt={1.5} pl={0.5}>
                    <Divider sx={{ mb: 0.5 }} />
                    {c.entries.map((e) => (
                      <Typography key={e.id} variant="caption" color="text.secondary">
                        {dayjs(e.lesson_date).format('DD/MM/YYYY')} · {e.class_name} · {e.start_time} – {e.end_time}
                      </Typography>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {editTarget && <EditModal closing={editTarget} onClose={() => setEditTarget(null)} />}
      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancelar Fechamento"
        message={`Cancelar a solicitação do período ${cancelTarget ? fmtDate(cancelTarget.date_from as unknown as string) : ''} – ${cancelTarget ? fmtDate(cancelTarget.date_to as unknown as string) : ''}?`}
        loading={cancelMutation.isPending}
        onConfirm={() => cancelTarget && cancelMutation.mutate(cancelTarget.id)}
        onCancel={() => setCancelTarget(null)}
      />
    </Box>
  )
}
