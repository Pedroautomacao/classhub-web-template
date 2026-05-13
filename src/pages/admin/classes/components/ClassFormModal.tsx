import { useEffect } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, TextField, Grid, MenuItem, CircularProgress,
  useMediaQuery, useTheme, Alert, Autocomplete, Tooltip,
  Typography, IconButton, Box, Divider, Chip,
} from '@mui/material'
import { Warning, Add, Delete, Error, Lock } from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import { teachersApi } from '@/api/teachers.api'
import { studentsApi } from '@/api/students.api'
import { settingsApi } from '@/api/settings.api'
import { studentMatchesClass, teacherMatchesClass, findTeacherScheduleConflict, DAYS } from '@/utils/availability'
import { classesApi } from '@/api/classes.api'
import type { Class, Teacher, Student } from '@/types'


const scheduleEntrySchema = z.object({
  day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  start_time: z.string().min(1, 'Obrigatório'),
  end_time: z.string().min(1, 'Obrigatório'),
}).refine(
  (d) => !d.start_time || !d.end_time || d.end_time > d.start_time,
  { message: 'Término deve ser após o início', path: ['end_time'] },
)

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  teacher_id: z.string().optional(),
  schedule: z.array(scheduleEntrySchema).min(1, 'Adicione pelo menos um horário'),
  class_type: z.enum(['grammar', 'conversation', 'private_lesson']),
  frequency: z.enum(['weekly', 'biweekly']),
  biweekly_start_date: z.string().optional(),
  student_ids: z.array(z.string()).optional(),
  meeting_link: z.string().url('URL inválida').optional().or(z.literal('')),
  levels: z.array(z.string()).optional(),
})
type FormValues = z.infer<typeof schema>

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
type DayValue = typeof DAY_NAMES[number]

function getDayFromDate(dateStr: string): DayValue {
  const [y, m, d] = dateStr.split('-').map(Number)
  return DAY_NAMES[new Date(y, m - 1, d).getDay()]
}

interface Props {
  open: boolean
  cls?: Class | null
  loading?: boolean
  onClose: () => void
  onSubmit: (v: FormValues) => void
}

export function ClassFormModal({ open, cls, loading = false, onClose, onSubmit }: Props) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'))

  const isEdit = !!cls
  const { data: teachers = [] } = useQuery<Teacher[]>({ queryKey: ['teachers'], queryFn: () => teachersApi.list() })
  const { data: students = [] } = useQuery<Student[]>({ queryKey: ['students'], queryFn: () => studentsApi.list() })

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
  })
  const availableLevels = settingsData?.level_options ?? []

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { schedule: [{ day: 'monday', start_time: '', end_time: '' }], levels: [] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'schedule' })

  const watchedTeacherId = watch('teacher_id')
  const watchedSchedule = watch('schedule') ?? []
  const watchedStudentIds = watch('student_ids') ?? []
  const watchedLevels = watch('levels') ?? []
  const watchedFrequency = watch('frequency')
  const watchedBiweeklyStartDate = watch('biweekly_start_date')
  const selectedTeacher = teachers.find((t: Teacher) => t.id === watchedTeacherId)

  // Derived day of week from the biweekly start date
  const biweeklyDay: DayValue | null =
    watchedFrequency === 'biweekly' && watchedBiweeklyStartDate
      ? getDayFromDate(watchedBiweeklyStartDate)
      : null

  const biweeklyDayLabel = biweeklyDay
    ? (DAYS.find((d) => d.value === biweeklyDay)?.label ?? '')
    : ''

  // When biweekly start date changes, lock all schedule entries to the derived day
  useEffect(() => {
    if (biweeklyDay) {
      watchedSchedule.forEach((_: unknown, i: number) => {
        setValue(`schedule.${i}.day`, biweeklyDay, { shouldValidate: false })
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biweeklyDay])

  const { data: allClasses = [] } = useQuery<Class[]>({
    queryKey: ['classes', 'all-for-conflict'],
    queryFn: () => classesApi.list(),
    staleTime: 30_000,
  })
  const teacherClasses = watchedTeacherId
    ? allClasses.filter((c: Class) => c.teacher_id === watchedTeacherId)
    : []

  const classInfoReady = watchedSchedule.length > 0 && watchedSchedule.some((e: { start_time: string }) => e.start_time)

  const teacherScheduleConflict = classInfoReady && teacherClasses.length > 0
    ? findTeacherScheduleConflict(
        teacherClasses, watchedSchedule,
        watchedFrequency ?? 'weekly',
        watchedBiweeklyStartDate || null,
        cls?.id,
      )
    : null

  const conflictingStudents = classInfoReady
    ? students.filter(
        (s: Student) => watchedStudentIds.includes(s.id) && !studentMatchesClass(s.availability, watchedSchedule),
      )
    : []

  const levelMismatchStudents = watchedLevels.length > 0
    ? students.filter(
        (s: Student) => watchedStudentIds.includes(s.id) && !!s.level && !watchedLevels.includes(s.level),
      )
    : []

  useEffect(() => {
    if (open) {
      reset(cls
        ? {
            name: cls.name,
            teacher_id: cls.teacher_id ?? '',
            schedule: cls.schedule.map((e) => ({ day: e.day, start_time: e.start_time, end_time: e.end_time })),
            class_type: cls.class_type,
            frequency: cls.frequency,
            biweekly_start_date: cls.biweekly_start_date ?? '',
            student_ids: cls.students.map((s) => s.id),
            meeting_link: cls.meeting_link ?? '',
            levels: cls.levels ?? [],
          }
        : {
            name: '',
            teacher_id: '',
            schedule: [{ day: 'monday', start_time: '', end_time: '' }],
            class_type: 'grammar',
            frequency: 'weekly',
            biweekly_start_date: '',
            student_ids: [],
            meeting_link: '',
            levels: [],
          }
      )
    }
  }, [open, cls, reset])

  const isBiweekly = watchedFrequency === 'biweekly'

  const handleAddSlot = () => {
    append({ day: biweeklyDay ?? 'monday', start_time: '', end_time: '' })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={fullScreen}>
      <DialogTitle>{isEdit ? 'Editar Turma' : 'Nova Turma'}</DialogTitle>
      <DialogContent sx={{ overflowX: 'hidden' }}>
        <Stack component="form" id="class-form" onSubmit={handleSubmit(onSubmit)} spacing={2} sx={{ pt: 1 }}>
          <TextField label="Nome *" fullWidth error={!!errors.name} helperText={errors.name?.message} {...register('name')} />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="teacher_id"
                control={control}
                render={({ field }) => (
                  <TextField select label="Professor" fullWidth {...field} value={field.value ?? ''}>
                    <MenuItem value="">Sem professor</MenuItem>
                    {teachers.map((t: Teacher) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                  </TextField>
                )}
              />
              {selectedTeacher?.is_training && (
                <Alert severity="warning" sx={{ mt: 1 }}>Este professor está em treinamento.</Alert>
              )}
              {selectedTeacher && classInfoReady && !teacherMatchesClass(selectedTeacher.availability, watchedSchedule) && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  O professor não tem disponibilidade cadastrada para este dia/horário.
                </Alert>
              )}
              {teacherScheduleConflict && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  Conflito de horário: o professor já possui a turma "{teacherScheduleConflict.className}" neste dia ({teacherScheduleConflict.day}) das {teacherScheduleConflict.start} às {teacherScheduleConflict.end}.
                </Alert>
              )}
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField select label="Tipo *" fullWidth {...register('class_type')} defaultValue="grammar">
                <MenuItem value="grammar">Gramática</MenuItem>
                <MenuItem value="conversation">Conversação</MenuItem>
                <MenuItem value="private_lesson">Aula particular</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="frequency"
                control={control}
                render={({ field }) => (
                  <TextField select label="Frequência *" fullWidth {...field} value={field.value ?? 'weekly'}>
                    <MenuItem value="weekly">Semanal</MenuItem>
                    <MenuItem value="biweekly">Quinzenal</MenuItem>
                  </TextField>
                )}
              />
            </Grid>
            {isBiweekly && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Data da 1ª aula *"
                  type="date"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  helperText={biweeklyDayLabel ? `Dia da semana: ${biweeklyDayLabel}` : 'O dia da semana será definido por esta data.'}
                  error={!!errors.biweekly_start_date}
                  {...register('biweekly_start_date')}
                />
              </Grid>
            )}
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Link da chamada (Meet, Zoom…)"
                fullWidth
                placeholder="https://meet.google.com/..."
                error={!!errors.meeting_link}
                helperText={errors.meeting_link?.message}
                {...register('meeting_link')}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Controller
                name="levels"
                control={control}
                defaultValue={[]}
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    options={availableLevels}
                    value={field.value ?? []}
                    onChange={(_, v) => field.onChange(v)}
                    renderInput={(params) => (
                      <TextField {...params} label="Níveis da turma" placeholder="Selecionar níveis..." helperText="Deixe em branco para aceitar qualquer nível" />
                    )}
                  />
                )}
              />
            </Grid>
          </Grid>

          <Divider />

          {/* Schedule section */}
          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {isBiweekly ? 'Horários *' : 'Dias e Horários *'}
                </Typography>
                {isBiweekly && biweeklyDayLabel && (
                  <Chip
                    icon={<Lock sx={{ fontSize: '14px !important' }} />}
                    label={biweeklyDayLabel}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
              </Stack>
              {(!isBiweekly || biweeklyDay) && (
                <Button size="small" startIcon={<Add />} onClick={handleAddSlot}>
                  {isBiweekly ? 'Adicionar Horário' : 'Adicionar Dia'}
                </Button>
              )}
            </Stack>

            {errors.schedule?.root && (
              <Typography variant="caption" color="error">{errors.schedule.root.message}</Typography>
            )}
            {errors.schedule && !Array.isArray(errors.schedule) && (errors.schedule as { message?: string }).message && (
              <Typography variant="caption" color="error">{(errors.schedule as { message?: string }).message}</Typography>
            )}

            {/* Biweekly without date: prompt user to pick date first */}
            {isBiweekly && !biweeklyDay ? (
              <Alert severity="info" sx={{ mt: 1 }}>
                Selecione a data da 1ª aula acima para definir o dia da semana e cadastrar os horários.
              </Alert>
            ) : (
              <Stack spacing={1.5}>
                {fields.map((field, index) => (
                  <Stack key={field.id} direction="row" spacing={1} alignItems="flex-start">
                    {isBiweekly ? (
                      /* Locked day display for biweekly */
                      <Box sx={{
                        minWidth: 150,
                        height: 40,
                        border: 1,
                        borderColor: 'action.disabled',
                        borderRadius: 1,
                        px: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        bgcolor: 'action.disabledBackground',
                        flexShrink: 0,
                      }}>
                        <Typography variant="body2" color="text.disabled" noWrap>
                          {biweeklyDayLabel}
                        </Typography>
                      </Box>
                    ) : (
                      /* Editable day dropdown for weekly */
                      <Controller
                        name={`schedule.${index}.day`}
                        control={control}
                        render={({ field: f }) => (
                          <TextField
                            select
                            label="Dia"
                            size="small"
                            value={f.value}
                            onChange={f.onChange}
                            error={!!errors.schedule?.[index]?.day}
                            sx={{ minWidth: 150 }}
                          >
                            {DAYS.map((d) => (
                              <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                            ))}
                          </TextField>
                        )}
                      />
                    )}
                    <TextField
                      label="Início"
                      type="time"
                      size="small"
                      slotProps={{ inputLabel: { shrink: true } }}
                      error={!!errors.schedule?.[index]?.start_time}
                      {...register(`schedule.${index}.start_time`)}
                      sx={{ width: 120 }}
                    />
                    <TextField
                      label="Término"
                      type="time"
                      size="small"
                      slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: watchedSchedule[index]?.start_time || '' } }}
                      error={!!errors.schedule?.[index]?.end_time}
                      helperText={(errors.schedule?.[index]?.end_time as { message?: string } | undefined)?.message}
                      {...register(`schedule.${index}.end_time`)}
                      sx={{ width: 120 }}
                    />
                    {fields.length > 1 && (
                      <IconButton size="small" color="error" onClick={() => remove(index)} sx={{ mt: 0.5 }}>
                        <Delete fontSize="small" />
                      </IconButton>
                    )}
                  </Stack>
                ))}
              </Stack>
            )}
          </Box>

          <Divider />

          {/* Students */}
          <Controller
            name="student_ids"
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <Autocomplete
                multiple
                options={students}
                getOptionLabel={(o: Student) => o.full_name}
                isOptionEqualToValue={(o: Student, v: Student) => o.id === v.id}
                value={students.filter((s: Student) => (field.value ?? []).includes(s.id))}
                onChange={(_, newValue) => field.onChange((newValue as Student[]).map((s) => s.id))}
                renderOption={(props, option: Student) => {
                  const conflict = classInfoReady && !studentMatchesClass(option.availability, watchedSchedule)
                  return (
                    <Box component="li" {...props} key={option.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ flex: 1 }}>{option.full_name}</Typography>
                      {conflict && (
                        <Tooltip title="Sem disponibilidade neste turno">
                          <Warning fontSize="small" color="warning" />
                        </Tooltip>
                      )}
                      {watchedLevels.length > 0 && option.level && !watchedLevels.includes(option.level) && (
                        <Tooltip title={`Nível do aluno (${option.level}) não corresponde ao(s) nível(is) da turma`}>
                          <Error fontSize="small" color="error" />
                        </Tooltip>
                      )}
                    </Box>
                  )
                }}
                renderInput={(params) => <TextField {...params} label="Alunos" placeholder="Buscar aluno..." />}
              />
            )}
          />
          {conflictingStudents.length > 0 && (
            <Alert severity="warning">
              {conflictingStudents.length === 1
                ? `${conflictingStudents[0].full_name} não marcou disponibilidade neste turno.`
                : `${conflictingStudents.map((s: Student) => s.full_name).join(', ')} não marcaram disponibilidade neste turno.`}
            </Alert>
          )}
          {levelMismatchStudents.length > 0 && (
            <Alert severity="warning">
              {levelMismatchStudents.length === 1
                ? `${levelMismatchStudents[0].full_name} tem nível ${levelMismatchStudents[0].level}, diferente do(s) nível(is) da turma.`
                : `${levelMismatchStudents.map((s: Student) => s.full_name).join(', ')} têm níveis diferentes dos desta turma.`}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button type="submit" form="class-form" variant="contained" disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}>
          {isEdit ? 'Salvar' : 'Criar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
