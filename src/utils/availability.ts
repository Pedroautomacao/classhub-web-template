import type { AvailabilityDay, Class, ClassScheduleEntry } from '@/types'

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

/** Returns true if two biweekly classes fall on strictly alternating weeks. */
function biweeklyAlternates(dateA: string | null | undefined, dateB: string | null | undefined): boolean {
  if (!dateA || !dateB) return false
  const a = new Date(dateA + 'T00:00:00')
  const b = new Date(dateB + 'T00:00:00')
  return Math.abs(Math.round((a.getTime() - b.getTime()) / 86_400_000)) % 14 === 7
}

/**
 * Returns the first conflicting class/entry if any schedule entry overlaps with an existing class.
 * Excludes `excludeClassId` (the class being edited).
 * Two biweekly classes on alternating weeks are never considered a conflict.
 */
export function findTeacherScheduleConflict(
  teacherClasses: Class[],
  newSchedule: ClassScheduleEntry[],
  newFrequency: string,
  newBiweeklyStartDate: string | null | undefined,
  excludeClassId?: string,
): { className: string; day: string; start: string; end: string } | null {
  for (const cls of teacherClasses) {
    if (cls.id === excludeClassId) continue
    if (
      newFrequency === 'biweekly' &&
      cls.frequency === 'biweekly' &&
      biweeklyAlternates(newBiweeklyStartDate, cls.biweekly_start_date)
    ) continue
    for (const ex of cls.schedule) {
      for (const ne of newSchedule) {
        if (ex.day !== ne.day || !ne.start_time || !ne.end_time) continue
        if (ne.start_time < ex.end_time && ne.end_time > ex.start_time) {
          return { className: cls.name, day: ex.day, start: ex.start_time, end: ex.end_time }
        }
      }
    }
  }
  return null
}
