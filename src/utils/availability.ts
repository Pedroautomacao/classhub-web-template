import type { AvailabilityDay, ClassScheduleEntry } from '@/types'

export const DAYS = [
  { value: 'monday', label: 'Segunda-feira' },
  { value: 'tuesday', label: 'Terça-feira' },
  { value: 'wednesday', label: 'Quarta-feira' },
  { value: 'thursday', label: 'Quinta-feira' },
  { value: 'friday', label: 'Sexta-feira' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' },
]

/**
 * Returns true if the student has availability for at least one schedule entry.
 */
export function studentMatchesClass(
  availability: AvailabilityDay[] | null | undefined,
  schedule: ClassScheduleEntry[],
): boolean {
  if (!availability?.length || !schedule.length) return true
  return schedule.some(({ day, start_time }) => {
    const dayAvail = availability.find((a) => a.day === day)
    if (!dayAvail) return false
    return dayAvail.slots.some((slot) => slot.start <= start_time && start_time <= slot.end)
  })
}

/**
 * Returns true if the teacher has availability for at least one schedule entry.
 */
export function teacherMatchesClass(
  availability: AvailabilityDay[] | null | undefined,
  schedule: ClassScheduleEntry[],
): boolean {
  if (!availability?.length || !schedule.length) return true
  return schedule.some(({ day, start_time }) => {
    const dayAvail = availability.find((a) => a.day === day)
    if (!dayAvail) return false
    return dayAvail.slots.some((slot) => slot.start <= start_time && start_time <= slot.end)
  })
}
