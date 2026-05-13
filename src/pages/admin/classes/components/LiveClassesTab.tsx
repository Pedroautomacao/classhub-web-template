import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Box, Button, Card, CardContent, Chip, Divider, Grid, LinearProgress,
  Stack, Typography,
} from '@mui/material'
import { AccessTime, Person, School, FiberManualRecord, VideoCall } from '@mui/icons-material'
import { classesApi } from '@/api/classes.api'
import { teachersApi } from '@/api/teachers.api'
import type { Class } from '@/types'

const DAY_MAP: Record<number, string> = {
  0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
  4: 'thursday', 5: 'friday', 6: 'saturday',
}

const CLASS_TYPE_LABEL: Record<string, string> = {
  grammar: 'Gramática',
  conversation: 'Conversação',
  private_lesson: 'Aula particular',
}

/** Current time in America/Sao_Paulo as { hours, minutes, dayIndex } */
function getSPTime() {
  const now = new Date()
  const sp = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  return {
    hours: sp.getHours(),
    minutes: sp.getMinutes(),
    seconds: sp.getSeconds(),
    dayIndex: sp.getDay(),
    totalMinutes: sp.getHours() * 60 + sp.getMinutes(),
  }
}

function parseTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

/** Returns true if a biweekly class is active in the current São Paulo week. */
function isBiweeklyActive(startDate: string | null | undefined): boolean {
  if (!startDate) return true
  const ref = new Date(startDate + 'T00:00:00')
  const spNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const spToday = new Date(spNow.getFullYear(), spNow.getMonth(), spNow.getDate())
  const daysDiff = Math.floor((spToday.getTime() - ref.getTime()) / 86_400_000)
  if (daysDiff < 0) return false
  return Math.floor(daysDiff / 7) % 2 === 0
}


function ElapsedTimer({ startTime }: { startTime: string }) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const { totalMinutes, seconds } = getSPTime()
  const startMin = parseTime(startTime)
  const elapsedSec = (totalMinutes - startMin) * 60 + seconds
  const h = Math.floor(elapsedSec / 3600)
  const m = Math.floor((elapsedSec % 3600) / 60)
  const s = elapsedSec % 60

  // suppress unused warning
  void tick

  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    <Typography variant="h5" fontWeight={700} fontFamily="monospace" color="primary">
      {h > 0 ? `${pad(h)}:` : ''}{pad(m)}:{pad(s)}
    </Typography>
  )
}

function LiveClassCard({ cls, teacherName, liveEntry }: { cls: Class; teacherName: string; liveEntry: { start_time: string; end_time: string } }) {
  const meetingLink = cls.meeting_link || null
  const startMin = parseTime(liveEntry.start_time)
  const endMin = parseTime(liveEntry.end_time)
  const duration = endMin - startMin

  const [progress, setProgress] = useState(0)

  useEffect(() => {
    function update() {
      const { totalMinutes, seconds } = getSPTime()
      const elapsedMin = totalMinutes - startMin
      const elapsedSec = elapsedMin * 60 + seconds
      const totalSec = duration * 60
      setProgress(Math.min(100, (elapsedSec / totalSec) * 100))
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [startMin, duration])

  const remaining = endMin - getSPTime().totalMinutes

  return (
    <Card
      sx={{
        height: '100%',
        border: '2px solid',
        borderColor: 'primary.light',
        position: 'relative',
        overflow: 'visible',
      }}
    >
      {/* Live badge */}
      <Box
        sx={{
          position: 'absolute',
          top: -10,
          left: 16,
          bgcolor: 'error.main',
          color: 'white',
          px: 1,
          py: 0.25,
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        <FiberManualRecord sx={{ fontSize: 10 }} />
        <Typography variant="caption" fontWeight={700} fontSize={11}>
          AO VIVO
        </Typography>
      </Box>

      <CardContent sx={{ pt: 2.5 }}>
        <Stack spacing={1.5}>
          {/* Header */}
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={1}>
            <Box>
              <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                {cls.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {liveEntry.start_time} – {liveEntry.end_time}
              </Typography>
            </Box>
            <Chip
              label={CLASS_TYPE_LABEL[cls.class_type] ?? cls.class_type}
              color={cls.class_type === 'grammar' ? 'primary' : cls.class_type === 'conversation' ? 'secondary' : 'default'}
              size="small"
            />
          </Stack>

          {/* Progress bar */}
          <Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 6, borderRadius: 3, mb: 0.5 }}
            />
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">
                {Math.round(progress)}% concluído
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {remaining} min restantes
              </Typography>
            </Stack>
          </Box>

          {/* Timer */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <AccessTime color="action" fontSize="small" />
            <ElapsedTimer startTime={liveEntry.start_time} />
            <Typography variant="caption" color="text.secondary" alignSelf="flex-end" mb={0.5}>
              em andamento
            </Typography>
          </Stack>

          <Divider />

          {/* Teacher */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <Person fontSize="small" color="action" />
            <Typography variant="body2" fontWeight={500}>
              {teacherName || 'Professor não definido'}
            </Typography>
          </Stack>

          {/* Meeting link */}
          {meetingLink && (
            <Button
              component="a"
              href={meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              variant="contained"
              startIcon={<VideoCall />}
              fullWidth
              sx={{ fontWeight: 600 }}
            >
              Entrar na chamada
            </Button>
          )}

          {/* Students */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
              <School fontSize="small" color="action" />
              <Typography variant="body2" fontWeight={600}>
                Alunos ({cls.students.length})
              </Typography>
            </Stack>
            {cls.students.length === 0 ? (
              <Typography variant="caption" color="text.secondary" pl={3.5}>
                Nenhum aluno matriculado
              </Typography>
            ) : (
              <Stack spacing={0.25} pl={3.5}>
                {cls.students.map((s) => (
                  <Typography key={s.id} variant="body2" color="text.secondary">
                    • {s.full_name}
                  </Typography>
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

export function LiveClassesTab() {
  const { data: classes = [], isLoading: loadingClasses } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesApi.list(),
  })

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => teachersApi.list(),
  })

  const [now, setNow] = useState(getSPTime)

  useEffect(() => {
    const id = setInterval(() => setNow(getSPTime()), 60_000)
    return () => clearInterval(id)
  }, [])

  const teacherMap = Object.fromEntries(teachers.map((t) => [t.id, t.name]))

  const day = DAY_MAP[now.dayIndex]
  const liveClasses = classes
    .filter((c) => c.frequency === 'weekly' || isBiweeklyActive(c.biweekly_start_date))
    .map((c) => {
      const entry = c.schedule.find(
        (s) => s.day === day && now.totalMinutes >= parseTime(s.start_time) && now.totalMinutes < parseTime(s.end_time)
      )
      return entry ? { cls: c, entry } : null
    })
    .filter(Boolean) as { cls: Class; entry: { start_time: string; end_time: string } }[]

  if (loadingClasses) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography color="text.secondary">Carregando turmas...</Typography>
      </Box>
    )
  }

  if (liveClasses.length === 0 || !day) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <School sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" fontWeight={500}>
          Nenhuma aula acontecendo agora
        </Typography>
        <Typography variant="body2" color="text.disabled" mt={0.5}>
          Horário de Brasília: {String(now.hours).padStart(2, '0')}:{String(now.minutes).padStart(2, '0')}
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} mb={3}>
        <FiberManualRecord color="error" sx={{ fontSize: 14 }} />
        <Typography variant="body2" fontWeight={600} color="error.main">
          {liveClasses.length} {liveClasses.length === 1 ? 'aula acontecendo' : 'aulas acontecendo'} agora
        </Typography>
        <Typography variant="caption" color="text.secondary">
          · Horário de Brasília: {String(now.hours).padStart(2, '0')}:{String(now.minutes).padStart(2, '0')}
        </Typography>
      </Stack>
      <Grid container spacing={3}>
        {liveClasses.map(({ cls, entry }) => (
          <Grid key={cls.id} size={{ xs: 12, sm: 6, lg: 4 }}>
            <LiveClassCard cls={cls} teacherName={teacherMap[cls.teacher_id ?? ''] ?? ''} liveEntry={entry} />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
