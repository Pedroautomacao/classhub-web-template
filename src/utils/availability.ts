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

const DAY_INDEX_TO_NAME: Record<number, string> = {
  0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
  4: 'thursday', 5: 'friday', 6: 'saturday',
}

function parseTimeHHMM(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

/** Returns true if a biweekly class is active this week (relative to São Paulo time). */
export function isBiweeklyActive(startDate: string | null | undefined): boolean {
  if (!startDate) return true
  const ref = new Date(startDate + 'T00:00:00')
  const spNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const spToday = new Date(spNow.getFullYear(), spNow.getMonth(), spNow.getDate())
  const daysDiff = Math.floor((spToday.getTime() - ref.getTime()) / 86_400_000)
  if (daysDiff < 0) return false
  return Math.floor(daysDiff / 7) % 2 === 0
}

/**
 * Returns classes that are happening right now (matching day + time window),
 * skipping biweekly classes that are in their off week.
 */
export function getLiveClasses(
  classes: Class[],
  now: { dayIndex: number; totalMinutes: number },
): { cls: Class; entry: ClassScheduleEntry }[] {
  const day = DAY_INDEX_TO_NAME[now.dayIndex]
  if (!day) return []
  return classes
    .filter((c) => c.frequency === 'weekly' || isBiweeklyActive(c.biweekly_start_date))
    .map((c) => {
      const entry = c.schedule.find(
        (s) => s.day === day
          && now.totalMinutes >= parseTimeHHMM(s.start_time)
          && now.totalMinutes < parseTimeHHMM(s.end_time),
      )
      return entry ? { cls: c, entry } : null
    })
    .filter((x): x is { cls: Class; entry: ClassScheduleEntry } => x !== null)
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
