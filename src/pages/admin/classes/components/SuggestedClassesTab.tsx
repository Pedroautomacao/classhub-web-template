import { useMemo, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Box, Stack, Typography, TextField, Button, Chip, Divider, Card, CardContent,
  Checkbox, FormControlLabel, CircularProgress, Tooltip, IconButton,
} from '@mui/material'
import { Refresh, Warning, Groups, AddCircleOutline, Edit } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { classesApi, type ClassPayload } from '@/api/classes.api'
import { ClassFormModal, type ClassFormValues } from './ClassFormModal'
import { DAYS } from '@/utils/availability'
import { useSnackbarStore } from '@/store/snackbar.store'
import { getApiError } from '@/utils/errors'
import type { SuggestedClass, ExistingClassMatch } from '@/types'

const DAY_LABELS: Record<string, string> = Object.fromEntries(DAYS.map((d) => [d.value, d.label]))
const TYPE_LABELS: Record<string, string> = {
  grammar: 'Gramática',
  conversation: 'Conversação',
  private_lesson: 'Aula particular',
}
const FREQ_LABELS: Record<string, string> = { weekly: 'Semanal', biweekly: 'Quinzenal' }

function hhmm(t: string) {
  return t.slice(0, 5)
}

export function SuggestedClassesTab() {
  const { show } = useSnackbarStore()
  const navigate = useNavigate()
  const [maxInput, setMaxInput] = useState(6)
  const [maxPerClass, setMaxPerClass] = useState(6)
  // Seleção por turma existente (class_id -> set de student_ids marcados)
  const [selectedByClass, setSelectedByClass] = useState<Record<string, Set<string>>>({})
  // Modal de criação pré-preenchido a partir de uma sugestão
  const [createInitial, setCreateInitial] = useState<Partial<ClassFormValues> | null>(null)

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['allocation-suggestions', maxPerClass],
    queryFn: () => classesApi.allocationSuggestions(maxPerClass),
  })

  const createMutation = useMutation({
    mutationFn: (payload: ClassPayload) => classesApi.create(payload),
    onSuccess: () => { show('Turma criada!'); setCreateInitial(null); refetch() },
    onError: (e) => show(getApiError(e, 'Erro ao criar turma.'), 'error'),
  })

  const addStudentsMutation = useMutation({
    mutationFn: async ({ classId, studentIds }: { classId: string; studentIds: string[] }) => {
      await Promise.all(studentIds.map((sid) => classesApi.addStudent(classId, sid)))
    },
    onSuccess: () => { show('Alunos adicionados à turma!'); refetch() },
    onError: (e) => show(getApiError(e, 'Erro ao adicionar alunos.'), 'error'),
  })

  const toggleStudent = (classId: string, studentId: string) => {
    setSelectedByClass((prev) => {
      const set = new Set(prev[classId] ?? [])
      set.has(studentId) ? set.delete(studentId) : set.add(studentId)
      return { ...prev, [classId]: set }
    })
  }

  const selectedCount = (classId: string) => selectedByClass[classId]?.size ?? 0

  const applyMax = () => setMaxPerClass(Math.max(1, Math.min(50, Math.round(maxInput) || 1)))

  const openCreateFromSuggestion = (s: SuggestedClass) => {
    setCreateInitial({
      class_type: s.class_type,
      frequency: s.frequency,
      levels: [s.level],
      schedule: [{ day: s.day as ClassFormValues['schedule'][number]['day'], start_time: hhmm(s.start_time), end_time: hhmm(s.end_time) }],
      student_ids: s.students.map((st) => st.id),
    })
  }

  const handleAddExisting = (m: ExistingClassMatch) => {
    const ids = [...(selectedByClass[m.class_id] ?? [])]
    if (ids.length === 0) return
    addStudentsMutation.mutate({ classId: m.class_id, studentIds: ids })
  }

  const summary = useMemo(() => {
    if (!data) return null
    return { analyzed: data.analyzed_count, ready: data.ready_count, pending: data.pending_count }
  }, [data])

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2} alignItems={{ sm: 'center' }} flexWrap="wrap">
        {summary && (
          <Typography variant="body2" color="text.secondary">
            Analisando <strong>{summary.analyzed}</strong> alunos ativos ·{' '}
            <strong>{summary.ready}</strong> prontos p/ alocação ·{' '}
            <strong>{summary.pending}</strong> com pendências
          </Typography>
        )}
        <Box flex={1} />
        <TextField
          label="Máx. por turma"
          type="number"
          size="small"
          value={maxInput}
          onChange={(e) => setMaxInput(Number(e.target.value))}
          sx={{ width: 130 }}
          inputProps={{ min: 1, max: 50 }}
        />
        <Button
          variant="outlined"
          size="small"
          startIcon={isFetching ? <CircularProgress size={16} /> : <Refresh />}
          onClick={() => { applyMax(); refetch() }}
        >
          Recalcular
        </Button>
      </Stack>

      {isLoading ? (
        <Stack alignItems="center" py={6}><CircularProgress /></Stack>
      ) : (
        <Stack spacing={3}>
          {/* SEÇÃO 1 — encaixam em turmas existentes */}
          <Box>
            <Typography variant="subtitle1" fontWeight={700} color="primary" gutterBottom>
              Encaixam em turmas existentes
            </Typography>
            {data?.existing_matches.length ? (
              <Stack spacing={2}>
                {data.existing_matches.map((m) => (
                  <Card key={m.class_id} variant="outlined">
                    <CardContent>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" mb={1}>
                        <Typography fontWeight={600}>{m.class_name}</Typography>
                        <Chip size="small" label={TYPE_LABELS[m.class_type] ?? m.class_type} />
                        <Chip size="small" variant="outlined" label={FREQ_LABELS[m.frequency] ?? m.frequency} />
                        {m.levels?.map((lv) => <Chip key={lv} size="small" variant="outlined" label={lv} />)}
                        <Typography variant="caption" color="text.secondary">
                          {m.schedule.map((e) => `${DAY_LABELS[e.day] ?? e.day} ${hhmm(e.start_time)}`).join(' · ')}
                        </Typography>
                      </Stack>
                      <Stack>
                        {m.students.map((st) => (
                          <FormControlLabel
                            key={st.id}
                            control={
                              <Checkbox
                                size="small"
                                checked={selectedByClass[m.class_id]?.has(st.id) ?? false}
                                onChange={() => toggleStudent(m.class_id, st.id)}
                              />
                            }
                            label={
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="body2">{st.full_name}</Typography>
                                {st.level && <Chip size="small" variant="outlined" label={st.level} />}
                              </Stack>
                            }
                          />
                        ))}
                      </Stack>
                      <Box mt={1}>
                        <Button
                          size="small"
                          variant="contained"
                          disabled={selectedCount(m.class_id) === 0 || addStudentsMutation.isPending}
                          onClick={() => handleAddExisting(m)}
                        >
                          Adicionar {selectedCount(m.class_id)} selecionado(s) à turma
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">Nenhum aluno encaixa em turmas já existentes.</Typography>
            )}
          </Box>

          <Divider />

          {/* SEÇÃO 2 — turmas sugeridas para criar */}
          <Box>
            <Typography variant="subtitle1" fontWeight={700} color="primary" gutterBottom>
              Turmas sugeridas para criar
            </Typography>
            {data?.suggested_classes.length ? (
              <Stack spacing={2}>
                {data.suggested_classes.map((s, i) => (
                  <Card key={i} variant="outlined" sx={{ borderColor: 'primary.light' }}>
                    <CardContent>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" mb={1}>
                        <Groups color="primary" fontSize="small" />
                        <Chip size="small" color="primary" label={TYPE_LABELS[s.class_type] ?? s.class_type} />
                        <Chip size="small" variant="outlined" label={s.level} />
                        <Chip size="small" variant="outlined" label={FREQ_LABELS[s.frequency] ?? s.frequency} />
                        <Typography variant="body2" fontWeight={600}>
                          {DAY_LABELS[s.day] ?? s.day} · {hhmm(s.start_time)}–{hhmm(s.end_time)}
                        </Typography>
                        <Chip size="small" label={`${s.students.length} aluno(s)`} />
                      </Stack>
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        {s.students.map((st) => st.full_name).join(', ')}
                      </Typography>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<AddCircleOutline />}
                        onClick={() => openCreateFromSuggestion(s)}
                      >
                        Criar turma com estes alunos
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">Nenhuma turma nova sugerida no momento.</Typography>
            )}
          </Box>

          <Divider />

          {/* SEÇÃO 3 — pendências */}
          <Box>
            <Typography variant="subtitle1" fontWeight={700} color="warning.main" gutterBottom>
              <Warning fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
              Pendências (fora do fluxo automático)
            </Typography>
            {data?.pending.length ? (
              <Stack spacing={1}>
                {data.pending.map((p) => (
                  <Card key={p.id} variant="outlined">
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                        <Typography variant="body2" fontWeight={600}>{p.full_name}</Typography>
                        {p.reasons.map((r) => (
                          <Chip key={r} size="small" color="warning" variant="outlined" label={r} />
                        ))}
                        <Box flex={1} />
                        <Tooltip title="Abrir aluno para ajustar">
                          <IconButton size="small" onClick={() => navigate('/admin/students')}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">Nenhuma pendência — todos os alunos têm plano, nível e disponibilidade.</Typography>
            )}
          </Box>
        </Stack>
      )}

      <ClassFormModal
        open={!!createInitial}
        initialValues={createInitial ?? undefined}
        loading={createMutation.isPending}
        onClose={() => setCreateInitial(null)}
        onSubmit={(v) => createMutation.mutate(v as ClassPayload)}
      />
    </Box>
  )
}
