import { useRef, useState } from 'react'
import { Box, Button, InputAdornment, Popover, Stack, TextField } from '@mui/material'
import { CalendarMonth, Close } from '@mui/icons-material'
import { CalendarPicker } from './CalendarPicker'
import type { SxProps, Theme } from '@mui/material/styles'

export type DateRangeValue = [string | null, string | null]

function formatBR(v: string | null | undefined): string {
  if (!v) return ''
  const parts = v.split('-')
  if (parts.length !== 3) return v
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

function formatRange(value: DateRangeValue | null | undefined): string {
  if (!value) return ''
  const [start, end] = value
  if (!start && !end) return ''
  if (start && end && start === end) return formatBR(start)
  if (start && end) return `${formatBR(start)} — ${formatBR(end)}`
  if (start) return formatBR(start)
  return ''
}

interface Props {
  value?: DateRangeValue | null
  onChange?: (v: DateRangeValue | null) => void
  label?: string
  size?: 'small' | 'medium'
  fullWidth?: boolean
  disabled?: boolean
  placeholder?: string
  minDate?: string
  maxDate?: string
  sx?: SxProps<Theme>
}

/**
 * Campo único que aceita data exata (1 clique) ou intervalo (2 cliques).
 * Internamente usa CalendarPicker em modo range.
 */
export function DateRangePickerField({
  value,
  onChange,
  label,
  size = 'medium',
  fullWidth,
  disabled,
  placeholder,
  minDate,
  maxDate,
  sx,
}: Props) {
  const anchorRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  const handleChange = (next: DateRangeValue) => {
    onChange?.(next)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.(null)
  }

  const hasValue = !!(value && (value[0] || value[1]))

  return (
    <>
      <Box
        ref={anchorRef}
        sx={{ ...(fullWidth ? { width: '100%' } : null), ...(sx as object) }}
      >
        <TextField
          label={label}
          value={formatRange(value)}
          placeholder={placeholder ?? 'DD/MM/AAAA ou intervalo'}
          fullWidth
          size={size}
          disabled={disabled}
          slotProps={{
            inputLabel: { shrink: true },
            input: {
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  {hasValue && !disabled ? (
                    <Close
                      fontSize="small"
                      onClick={handleClear}
                      sx={{ cursor: 'pointer', color: 'action.active', mr: 0.5 }}
                    />
                  ) : null}
                  <CalendarMonth fontSize="small" color={disabled ? 'disabled' : 'action'} />
                </InputAdornment>
              ),
              sx: { cursor: disabled ? 'not-allowed' : 'pointer' },
            },
          }}
          onClick={() => !disabled && setOpen(true)}
          sx={{ '& .MuiInputBase-input': { cursor: disabled ? 'not-allowed' : 'pointer' } }}
        />
      </Box>
      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { p: 2, mt: 0.5, width: 304 } } }}
      >
        <CalendarPicker
          mode="range"
          value={value ?? [null, null]}
          onChange={handleChange}
          minDate={minDate}
          maxDate={maxDate}
        />
        <Stack direction="row" justifyContent="space-between" mt={1}>
          <Button size="small" onClick={() => { onChange?.(null) }}>Limpar</Button>
          <Button size="small" variant="contained" onClick={() => setOpen(false)}>
            Aplicar
          </Button>
        </Stack>
      </Popover>
    </>
  )
}
