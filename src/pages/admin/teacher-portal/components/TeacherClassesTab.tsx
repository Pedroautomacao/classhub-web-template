import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert, Box, Button, Card, CardContent, CardHeader, Chip, Dialog,
  DialogContent, DialogTitle, Divider, Stack, TextField,
  IconButton, Typography, Tooltip, Skeleton, Grid, ToggleButtonGroup,
  ToggleButton,
} from '@mui/material'
import { Save, LinkOff, ViewModule, CalendarViewWeek, InfoOutlined, VideoCall } from '@mui/icons-material'
import { teachersApi } from '@/api/teachers.api'
import { classesApi } from '@/api/classes.api'
import { useSnackbarStore } from '@/store/snackbar.store'
import { getApiError } from '@/utils/errors'
import type { Class } from '@/types'

const DAY_LABEL: Record<string, string> = {
  monday: 'Seg', tuesday: 'Ter', wednesday: 'Qua',
  thursday: 'Qui', friday: 'Sex', saturday: 'Sáb', sunday: 'Dom',
}

const TYPE_LABEL: Record<string, string> = {
  grammar: 'Gramática', conversation: 'Conversação', private_lesson: 'Aula particular',
}

const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const CLASS_COLORS = [
  { bg: 'primary.main', text: 'primary.contrastText' },
  { bg: 'secondary.main', text: 'secondary.contrastText' },
  { bg: 'success.main', text: 'success.contrastText' },
  { bg: 'warning.main', text: 'warning.contrastText' },
  { bg: 'error.main', text: 'error.contrastText' },
  { bg: 'info.main', text: 'info.contrastText' },
]

function toMin(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + (m ?? 0)
}

function fmtMin(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
}

// ─── Card view ───────────────────────────────────────────────────────────────

function ClassCard({ cls }: { cls: Class }) {
  const qc = useQueryClient()
  const { show } = useSnackbarStore()
  const [link, setLink] = useState(cls.meeting_link ?? '')

  const linkMutation = useMutation({
    mutationFn: (val: string | null) => classesApi.updateMeetingLink(cls.id, val),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-classes'] }); show('Link salvo!') },
    onError: (err) => show(getApiError(err, 'Erro ao salvar link.'), 'error'),
  })

  const hasChanged = link !== (cls.meeting_link ?? '')

  return (
    <Card variant="outlined">
      <CardHeader
        title={cls.name}
        titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
        subheader={
          <Stack direction="row" spacing={0.5} flexWrap="wrap" mt={0.5}>
            {cls.schedule.map((s) => (
              <Chip key={s.day} label={`${DAY_LABEL[s.day] ?? s.day} ${s.start_time}–${s.end_time}`} size="small" variant="outlined" />
            ))}
            <Chip label={TYPE_LABEL[cls.class_type] ?? cls.class_type} size="small" color="primary" variant="outlined" />
          </Stack>
        }
        sx={{ pb: 0 }}
      />
      <CardContent>
        {cls.students.length > 0 ? (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" mb={1.5}>
            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center', mr: 0.5 }}>
              Alunos:
            </Typography>
            {cls.students.slice(0, 5).map((s) => (
              <Chip key={s.id} label={s.full_name} size="small" />
            ))}
            {cls.students.length > 5 && (
              <Chip label={`+${cls.students.length - 5}`} size="small" variant="outlined" />
            )}
          </Stack>
        ) : (
          <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
            Nenhum aluno nesta turma.
          </Typography>
        )}

        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            label="Link da aula (Meet, Zoom…)"
            size="small"
            fullWidth
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://meet.google.com/..."
          />
          {hasChanged && (
            <Tooltip title="Salvar link">
              <IconButton
                color="primary"
                size="small"
                disabled={linkMutation.isPending}
                onClick={() => linkMutation.mutate(link || null)}
              >
                <Save fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {!hasChanged && cls.meeting_link && (
            <Tooltip title="Remover link">
              <IconButton size="small" onClick={() => { setLink(''); linkMutation.mutate(null) }}>
                <LinkOff fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}

// ─── Class detail modal ───────────────────────────────────────────────────────

function ClassDetailModal({ cls, onClose }: { cls: Class; onClose: () => void }) {
  const qc = useQueryClient()
  const { show } = useSnackbarStore()
  const [link, setLink] = useState(cls.meeting_link ?? '')

  const linkMutation = useMutation({
    mutationFn: (val: string | null) => classesApi.updateMeetingLink(cls.id, val),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-classes'] }); show('Link salvo!') },
    onError: (err) => show(getApiError(err, 'Erro ao salvar link.'), 'error'),
  })

  const hasChanged = link !== (cls.meeting_link ?? '')

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" fontWeight={700}>{cls.name}</Typography>
        <Stack direction="row" spacing={0.5} flexWrap="wrap" mt={0.5}>
          <Chip label={TYPE_LABEL[cls.class_type] ?? cls.class_type} size="small" color="primary" />
          <Chip label={cls.frequency === 'weekly' ? 'Semanal' : 'Quinzenal'} size="small" variant="outlined" />
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ pt: 0 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
              Horários
            </Typography>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" mt={0.5}>
              {cls.schedule.map((s) => (
                <Chip
                  key={s.day}
                  label={`${DAY_LABEL[s.day] ?? s.day}  ${s.start_time}–${s.end_time}`}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Stack>
          </Box>

          <Divider />

          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
              Alunos ({cls.students.length})
            </Typography>
            {cls.students.length > 0 ? (
              <Stack direction="row" spacing={0.5} flexWrap="wrap" mt={0.5}>
                {cls.students.map((s) => (
                  <Chip key={s.id} label={s.full_name} size="small" />
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                Nenhum aluno nesta turma.
              </Typography>
            )}
          </Box>

          <Divider />

          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" display="block" mb={1}>
              Link da aula
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                size="small"
                fullWidth
                placeholder="https://meet.google.com/..."
                value={link}
                onChange={(e) => setLink(e.target.value)}
                slotProps={{ input: { startAdornment: <VideoCall sx={{ mr: 0.5, color: 'text.secondary', fontSize: 20 }} /> } }}
              />
              {hasChanged && (
                <Tooltip title="Salvar link">
                  <IconButton color="primary" size="small" disabled={linkMutation.isPending}
                    onClick={() => linkMutation.mutate(link || null)}>
                    <Save fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {!hasChanged && cls.meeting_link && (
                <Tooltip title="Remover link">
                  <IconButton size="small" onClick={() => { setLink(''); linkMutation.mutate(null) }}>
                    <LinkOff fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
            {cls.meeting_link && !hasChanged && (
              <Button
                size="small"
                href={cls.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ mt: 1 }}
                startIcon={<VideoCall fontSize="small" />}
              >
                Entrar na aula
              </Button>
            )}
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}

// ─── Calendar view ────────────────────────────────────────────────────────────

const HOUR_PX = 64
const TIME_W = 52

function CalendarView({ classes, onClassClick }: { classes: Class[]; onClassClick: (cls: Class) => void }) {
  type Entry = { cls: Class; colorIdx: number; startMin: number; endMin: number }
  const byDay: Record<string, Entry[]> = {}

  classes.forEach((cls, colorIdx) => {
    cls.schedule.forEach((s) => {
      if (!byDay[s.day]) byDay[s.day] = []
      byDay[s.day].push({ cls, colorIdx, startMin: toMin(s.start_time), endMin: toMin(s.end_time) })
    })
  })

  const activeDays = DAYS_ORDER.filter((d) => byDay[d]?.length)
  const allEntries = Object.values(byDay).flat()

  if (activeDays.length === 0) {
    return (
      <Typography color="text.secondary" textAlign="center" py={4}>
        Nenhuma turma com horário definido.
      </Typography>
    )
  }

  const minHour = Math.floor(Math.min(...allEntries.map((e) => e.startMin)) / 60)
  const maxHour = Math.ceil(Math.max(...allEntries.map((e) => e.endMin)) / 60)
  const hours = Array.from({ length: maxHour - minHour }, (_, i) => minHour + i)
  const totalH = hours.length * HOUR_PX

  return (
    <Box sx={{ overflowX: 'auto', border: 1, borderColor: 'divider', borderRadius: 2 }}>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        position: 'sticky',
        top: 0,
        zIndex: 1,
      }}>
        <Box sx={{ width: TIME_W, flexShrink: 0 }} />
        {activeDays.map((day) => (
          <Box key={day} sx={{
            flex: 1,
            minWidth: 130,
            textAlign: 'center',
            py: 1.5,
            fontWeight: 700,
            typography: 'body2',
            borderLeft: 1,
            borderColor: 'divider',
          }}>
            {DAY_LABEL[day]}
          </Box>
        ))}
      </Box>

      {/* Body */}
      <Box sx={{ display: 'flex', height: totalH, position: 'relative' }}>
        {/* Time axis */}
        <Box sx={{ width: TIME_W, flexShrink: 0, position: 'relative', borderRight: 1, borderColor: 'divider' }}>
          {hours.map((h) => (
            <Box key={h} sx={{
              position: 'absolute',
              top: (h - minHour) * HOUR_PX,
              left: 0,
              right: 0,
              ...(h > minHour ? { borderTop: 1, borderColor: 'divider' } : {}),
            }}>
              <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5, lineHeight: 1.2 }}>
                {String(h).padStart(2, '0')}:00
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Day columns */}
        {activeDays.map((day) => (
          <Box key={day} sx={{ flex: 1, minWidth: 130, position: 'relative', borderLeft: 1, borderColor: 'divider' }}>
            {/* Hour grid lines */}
            {hours.map((h) => (
              <Box key={h} sx={{
                position: 'absolute',
                top: (h - minHour) * HOUR_PX,
                left: 0,
                right: 0,
                height: HOUR_PX,
                ...(h > minHour ? { borderTop: 1, borderColor: 'divider' } : {}),
              }} />
            ))}

            {/* Class blocks */}
            {(byDay[day] ?? []).map(({ cls, colorIdx, startMin, endMin }) => {
              const top = (startMin - minHour * 60) * (HOUR_PX / 60) + 2
              const height = Math.max((endMin - startMin) * (HOUR_PX / 60) - 4, 24)
              const color = CLASS_COLORS[colorIdx % CLASS_COLORS.length]
              return (
                  <Box key={`${cls.id}-${startMin}`} sx={{
                    position: 'absolute',
                    top,
                    height,
                    left: 4,
                    right: 4,
                    bgcolor: color.bg,
                    color: color.text,
                    borderRadius: 1,
                    px: 1,
                    py: 0.25,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    '&:hover': { filter: 'brightness(0.9)' },
                  }}
                  onClick={() => onClassClick(cls)}>
                    <Typography variant="caption" fontWeight={700} noWrap>
                      {cls.name}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.65rem' }}>
                      {fmtMin(startMin)}–{fmtMin(endMin)}
                    </Typography>
                    {height >= 56 && (
                      <Typography variant="caption" sx={{ opacity: 0.85, fontSize: '0.65rem' }}>
                        {cls.students.length} aluno{cls.students.length !== 1 ? 's' : ''}
                      </Typography>
                    )}
                  </Box>
              )
            })}
          </Box>
        ))}
      </Box>
    </Box>
  )
}

// ─── Main tab ────────────────────────────────────────────────────────────────

const NOT_TEACHER_ALERT = (
  <Alert severity="info" icon={<InfoOutlined />} sx={{ maxWidth: 520 }}>
    Seu usuário não está vinculado a um cadastro de professor. Entre em contato com a administração para ter acesso a esta funcionalidade.
  </Alert>
)

export function TeacherClassesTab() {
  const [viewMode, setViewMode] = useState<'cards' | 'calendar'>('cards')
  const [detailClass, setDetailClass] = useState<Class | null>(null)

  const { data: classes = [], isLoading, isError } = useQuery({
    queryKey: ['my-classes'],
    queryFn: teachersApi.myClasses,
    retry: false,
  })

  if (isError) return NOT_TEACHER_ALERT

  if (isLoading) {
    return (
      <Grid container spacing={2}>
        {[1, 2, 3].map((n) => (
          <Grid key={n} size={{ xs: 12, md: 6 }}>
            <Skeleton variant="rounded" height={160} />
          </Grid>
        ))}
      </Grid>
    )
  }

  if (classes.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography color="text.secondary">Nenhuma turma atribuída a você.</Typography>
      </Box>
    )
  }

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <ToggleButtonGroup
          size="small"
          value={viewMode}
          exclusive
          onChange={(_, v) => v && setViewMode(v)}
        >
          <ToggleButton value="cards">
            <Tooltip title="Visualização em cards">
              <ViewModule fontSize="small" />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="calendar">
            <Tooltip title="Calendário semanal">
              <CalendarViewWeek fontSize="small" />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {viewMode === 'cards' ? (
        <Grid container spacing={2}>
          {classes.map((cls) => (
            <Grid key={cls.id} size={{ xs: 12, md: 6 }}>
              <ClassCard cls={cls} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <CalendarView classes={classes} onClassClick={setDetailClass} />
      )}

      {detailClass && (
        <ClassDetailModal cls={detailClass} onClose={() => setDetailClass(null)} />
      )}
    </Stack>
  )
}
