import { useFieldArray, Controller } from 'react-hook-form'
import { z } from 'zod'
import {
  Box, Stack, Typography, Button, IconButton,
  Tooltip, Select, MenuItem, InputLabel, FormControl,
} from '@mui/material'
import { Add, Delete as DeleteIcon } from '@mui/icons-material'
import { DAYS } from '@/utils/availability'
import { TimePickerField } from './TimePickerField'

export const availabilitySlotSchema = z.object({
  start: z.string().min(1, 'Obrigatório'),
  end: z.string().min(1, 'Obrigatório'),
}).refine(
  (d) => !d.start || !d.end || d.end > d.start,
  { message: 'Fim deve ser após o início', path: ['end'] },
)

export const availabilityDaySchema = z.object({
  day: z.string().min(1, 'Selecione um dia'),
  slots: z.array(availabilitySlotSchema).min(1, 'Adicione ao menos um horário'),
})

interface AvailabilityEditorProps {
  control: any
  register: any
  watch: any
  errors: any
}

export function AvailabilityEditor({ control, register, watch, errors }: AvailabilityEditorProps) {
  const { fields: dayFields, append: appendDay, remove: removeDay } = useFieldArray({
    control,
    name: 'availability',
  })

  const usedDays = watch('availability')?.map((d: any) => d.day) ?? []

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="body2" fontWeight={500}>Disponibilidade de Horários</Typography>
        <Button
          size="small"
          startIcon={<Add />}
          onClick={() => appendDay({ day: '', slots: [{ start: '', end: '' }] })}
          disabled={usedDays.length >= DAYS.length}
        >
          Adicionar dia
        </Button>
      </Stack>
      <Stack spacing={2}>
        {dayFields.map((dayField, dayIndex) => (
          <AvailabilityDayRow
            key={dayField.id}
            dayIndex={dayIndex}
            control={control}
            register={register}
            watch={watch}
            errors={errors}
            usedDays={usedDays}
            onRemoveDay={() => removeDay(dayIndex)}
          />
        ))}
        {dayFields.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            Nenhuma disponibilidade cadastrada.
          </Typography>
        )}
      </Stack>
    </Box>
  )
}

interface DayRowProps {
  dayIndex: number
  control: any
  register: any
  watch: any
  errors: any
  usedDays: string[]
  onRemoveDay: () => void
}

function AvailabilityDayRow({ dayIndex, control, register: _register, watch, errors, usedDays, onRemoveDay }: DayRowProps) {
  const { fields: slotFields, append: appendSlot, remove: removeSlot } = useFieldArray({
    control,
    name: `availability.${dayIndex}.slots`,
  })

  const currentDay = watch(`availability.${dayIndex}.day`)

  return (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
        <Controller
          name={`availability.${dayIndex}.day`}
          control={control}
          render={({ field }) => (
            <FormControl size="small" sx={{ minWidth: 160 }} error={!!errors.availability?.[dayIndex]?.day}>
              <InputLabel>Dia da semana</InputLabel>
              <Select {...field} label="Dia da semana">
                {DAYS.map((d) => (
                  <MenuItem
                    key={d.value}
                    value={d.value}
                    disabled={usedDays.includes(d.value) && d.value !== currentDay}
                  >
                    {d.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        />
        <Box flex={1} />
        <Tooltip title="Remover dia">
          <IconButton size="small" color="error" onClick={onRemoveDay}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      <Stack spacing={1}>
        {slotFields.map((slotField, slotIndex) => {
          const slotStart = watch(`availability.${dayIndex}.slots.${slotIndex}.start`)
          return (
          <Stack key={slotField.id} direction="row" spacing={1} alignItems="flex-start">
            <Controller
              name={`availability.${dayIndex}.slots.${slotIndex}.start`}
              control={control}
              render={({ field }) => (
                <TimePickerField
                  label="Início"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  error={!!errors.availability?.[dayIndex]?.slots?.[slotIndex]?.start}
                  size="small"
                  sx={{ width: 130 }}
                />
              )}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>até</Typography>
            <Controller
              name={`availability.${dayIndex}.slots.${slotIndex}.end`}
              control={control}
              render={({ field }) => (
                <TimePickerField
                  label="Fim"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  min={slotStart || undefined}
                  error={!!errors.availability?.[dayIndex]?.slots?.[slotIndex]?.end}
                  helperText={(errors.availability?.[dayIndex]?.slots?.[slotIndex]?.end as any)?.message}
                  size="small"
                  sx={{ width: 130 }}
                />
              )}
            />
            {slotFields.length > 1 && (
              <Tooltip title="Remover horário">
                <IconButton size="small" onClick={() => removeSlot(slotIndex)} sx={{ mt: 2.75 }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
          )
        })}
        <Button
          size="small"
          startIcon={<Add />}
          onClick={() => appendSlot({ start: '', end: '' })}
          sx={{ alignSelf: 'flex-start' }}
        >
          Adicionar horário
        </Button>
      </Stack>
    </Box>
  )
}
