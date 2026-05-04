import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Card, CardContent, CardHeader, Chip, Stack, TextField,
  IconButton, Typography, Tooltip, Skeleton, Grid,
} from '@mui/material'
import { Save, LinkOff } from '@mui/icons-material'
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

export function TeacherClassesTab() {
  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['my-classes'],
    queryFn: teachersApi.myClasses,
  })

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
    <Grid container spacing={2}>
      {classes.map((cls) => (
        <Grid key={cls.id} size={{ xs: 12, md: 6 }}>
          <ClassCard cls={cls} />
        </Grid>
      ))}
    </Grid>
  )
}
