import { useState, useMemo } from 'react'
import { Box, IconButton, Stack, Typography } from '@mui/material'
import { ChevronLeft, ChevronRight } from '@mui/icons-material'
import { alpha, useTheme } from '@mui/material/styles'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function toStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function weekStart(s: string): string {
  const [y, m, d] = s.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() - date.getDay())
  return toStr(date)
}

function buildGrid(year: number, month: number): (string | null)[] {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const grid: (string | null)[] = Array(first.getDay()).fill(null)
  for (let d = 1; d <= last.getDate(); d++) grid.push(toStr(new Date(year, month, d)))
  while (grid.length % 7 !== 0) grid.push(null)
  return grid
}

// ── Types ──────────────────────────────────────────────────────────────────

interface BaseProps { minDate?: string; maxDate?: string }

interface SingleProps extends BaseProps {
  mode?: 'single'
  value?: string | null
  onChange?: (v: string | null) => void
}

interface RangeProps extends BaseProps {
  mode: 'range'
  value?: [string | null, string | null]
  onChange?: (v: [string | null, string | null]) => void
}

/**
 * week-dates: multi-select, but all selected dates must belong to the same
 * calendar week. Clicking a date in a different week resets the selection.
 */
interface WeekDatesProps extends BaseProps {
  mode: 'week-dates'
  value?: string[]
  onChange?: (v: string[]) => void
}

export type CalendarPickerProps = SingleProps | RangeProps | WeekDatesProps

// ── Component ──────────────────────────────────────────────────────────────

export function CalendarPicker(props: CalendarPickerProps) {
  const { minDate, maxDate } = props
  const mode = props.mode ?? 'single'
  const theme = useTheme()
  const today = toStr(new Date())

  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth())
  const [hoverDate, setHoverDate] = useState<string | null>(null)
  const [hoverWeek, setHoverWeek] = useState<string | null>(null)

  const grid = useMemo(() => buildGrid(year, month), [year, month])

  const goMonth = (delta: number) => {
    setMonth((m) => {
      const nm = m + delta
      if (nm < 0) { setYear((y) => y - 1); return 11 }
      if (nm > 11) { setYear((y) => y + 1); return 0 }
      return nm
    })
  }

  const isDisabled = (s: string) => (!!minDate && s < minDate) || (!!maxDate && s > maxDate)

  const handleClick = (s: string) => {
    if (isDisabled(s)) return

    if (mode === 'single') {
      const p = props as SingleProps
      p.onChange?.(p.value === s ? null : s)
    } else if (mode === 'range') {
      const p = props as RangeProps
      const [start, end] = p.value ?? [null, null]
      if (!start || (start && end)) {
        p.onChange?.([s, null])
      } else {
        p.onChange?.(s <= start ? [s, start] : [start, s])
      }
    } else {
      const p = props as WeekDatesProps
      const cur = p.value ?? []
      const ws = weekStart(s)
      const curWs = cur.length > 0 ? weekStart(cur[0]) : null
      if (!curWs || ws !== curWs) {
        p.onChange?.([s])
      } else if (cur.includes(s)) {
        p.onChange?.(cur.filter((d) => d !== s))
      } else {
        p.onChange?.([...cur, s].sort())
      }
    }
  }

  const getCellFlags = (s: string) => {
    let selected = false
    let inRange = false
    let weekHighlight = false

    if (mode === 'single') {
      const p = props as SingleProps
      selected = p.value === s
    } else if (mode === 'range') {
      const p = props as RangeProps
      const [start, end] = p.value ?? [null, null]
      selected = s === start || s === end

      // Show range preview while hovering for second click
      let effectiveStart = start
      let effectiveEnd = end
      if (start && !end && hoverDate) {
        if (hoverDate >= start) effectiveEnd = hoverDate
        else { effectiveStart = hoverDate; effectiveEnd = start }
        selected = s === start || s === hoverDate
      }
      if (effectiveStart && effectiveEnd) {
        inRange = s > effectiveStart && s < effectiveEnd
      }
    } else {
      const p = props as WeekDatesProps
      const cur = p.value ?? []
      selected = cur.includes(s)
      const ws = weekStart(s)
      const curWs = cur.length > 0 ? weekStart(cur[0]) : null
      weekHighlight = (!!curWs && ws === curWs) || (!!hoverWeek && ws === hoverWeek)
    }

    return { selected, inRange, weekHighlight }
  }

  const primary = theme.palette.primary.main

  return (
    <Box sx={{ userSelect: 'none' }}>
      {/* Month navigation */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
        <IconButton size="small" onClick={() => goMonth(-1)}>
          <ChevronLeft fontSize="small" />
        </IconButton>
        <Typography variant="subtitle2" fontWeight={600}>
          {MONTHS[month]} {year}
        </Typography>
        <IconButton size="small" onClick={() => goMonth(1)}>
          <ChevronRight fontSize="small" />
        </IconButton>
      </Stack>

      {/* Weekday headers */}
      <Box display="grid" gridTemplateColumns="repeat(7, 1fr)">
        {WEEKDAYS.map((w) => (
          <Typography key={w} variant="caption" color="text.secondary"
            textAlign="center" fontWeight={600} lineHeight={2.2}>
            {w}
          </Typography>
        ))}
      </Box>

      {/* Day grid */}
      <Box display="grid" gridTemplateColumns="repeat(7, 1fr)">
        {grid.map((s, i) => {
          if (!s) return <Box key={`pad-${i}`} sx={{ aspectRatio: '1' }} />

          const { selected, inRange, weekHighlight } = getCellFlags(s)
          const disabled = isDisabled(s)
          const isToday = s === today
          const ws = weekStart(s)

          return (
            <Box
              key={s}
              onClick={() => handleClick(s)}
              onMouseEnter={() => { setHoverDate(s); setHoverWeek(ws) }}
              onMouseLeave={() => { setHoverDate(null); setHoverWeek(null) }}
              sx={{
                aspectRatio: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: disabled ? 'not-allowed' : 'pointer',
                bgcolor: inRange
                  ? alpha(primary, 0.12)
                  : weekHighlight
                  ? alpha(primary, 0.06)
                  : 'transparent',
                '&:hover .cal-day': !disabled
                  ? { bgcolor: selected ? alpha(primary, 0.82) : alpha(primary, 0.18) }
                  : {},
              }}
            >
              <Box
                className="cal-day"
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: selected ? primary : 'transparent',
                  outline: isToday && !selected ? `2px solid ${primary}` : 'none',
                  outlineOffset: -2,
                  transition: 'background-color 0.12s',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.8125rem',
                    lineHeight: 1,
                    fontWeight: selected || isToday ? 600 : 400,
                    color: selected
                      ? 'primary.contrastText'
                      : disabled
                      ? 'text.disabled'
                      : isToday
                      ? 'primary.main'
                      : 'text.primary',
                  }}
                >
                  {Number(s.slice(8))}
                </Typography>
              </Box>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
