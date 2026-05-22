import { useState } from 'react'
import { Box, FormHelperText, MenuItem, Select, Typography } from '@mui/material'
import type { SelectChangeEvent } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { SxProps, Theme } from '@mui/material/styles'

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

interface TimePickerFieldProps {
  value: string
  onChange: (v: string) => void
  label?: string
  error?: boolean
  helperText?: string
  /** Minimum allowed time "HH:MM" — values at or before this are disabled */
  min?: string
  disabled?: boolean
  size?: 'small' | 'medium'
  sx?: SxProps<Theme>
}

export function TimePickerField({
  value, onChange, label, error = false, helperText, min,
  disabled = false, size = 'medium', sx,
}: TimePickerFieldProps) {
  const theme = useTheme()
  const [focused, setFocused] = useState(false)

  const hh = value ? value.slice(0, 2) : ''
  const mm = value && value.length >= 5 ? value.slice(3, 5) : ''
  const minH = min ? min.slice(0, 2) : ''
  const minM = min ? min.slice(3, 5) : ''

  const handleHour = (e: SelectChangeEvent<string>) => {
    const h = e.target.value
    onChange(`${h}:${mm || '00'}`)
  }

  const handleMinute = (e: SelectChangeEvent<string>) => {
    const m = e.target.value
    onChange(`${hh || '00'}:${m}`)
  }

  const hourDisabled = (h: string) => !!minH && h < minH

  const minuteDisabled = (m: string) => {
    if (!minH) return false
    if (hh > minH) return false
    if (hh === minH) return m <= minM
    return false
  }

  const borderColor = error
    ? theme.palette.error.main
    : focused
    ? theme.palette.primary.main
    : theme.palette.mode === 'light' ? 'rgba(0,0,0,0.23)' : 'rgba(255,255,255,0.23)'

  const labelColor = error
    ? theme.palette.error.main
    : focused
    ? theme.palette.primary.main
    : theme.palette.text.secondary

  const selectSx = {
    flex: 1,
    minWidth: 0,
    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
    '& .MuiSelect-select': {
      py: size === 'small' ? '8.5px' : '16.5px',
      px: 1,
      pr: '24px !important',
    },
    '& .MuiSelect-icon': { right: 2 },
    fontSize: '0.875rem',
  }

  return (
    <Box sx={sx}>
      <Box
        component="fieldset"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          height: size === 'small' ? 40 : 56,
          boxSizing: 'border-box',
          borderColor,
          borderStyle: 'solid',
          borderWidth: focused ? 2 : 1,
          borderRadius: `${theme.shape.borderRadius}px`,
          m: 0,
          py: 0,
          px: focused ? 'calc(0.25rem - 1px)' : '0.25rem',
          bgcolor: disabled ? 'action.disabledBackground' : 'transparent',
          transition: 'border-color 0.15s, border-width 0.05s',
          minWidth: 0,
          '& > legend': {
            float: 'unset',
            width: 'auto',
            padding: '0 5px',
            marginLeft: '5px',
            fontSize: '0.75rem',
            lineHeight: 1,
            color: labelColor,
            transition: 'color 0.2s',
          },
          '&:hover': !disabled && !focused
            ? { borderColor: theme.palette.text.primary }
            : {},
        }}
      >
        {label && <legend>{label}</legend>}
        <Select
          value={hh}
          onChange={handleHour}
          disabled={disabled}
          displayEmpty
          variant="outlined"
          size={size}
          renderValue={(v: string) => (
            <Typography variant="body2" color={v ? 'text.primary' : 'text.disabled'}>{v || 'HH'}</Typography>
          )}
          sx={selectSx}
          MenuProps={{ PaperProps: { sx: { maxHeight: 224 } } }}
        >
          {HOURS.map((h) => (
            <MenuItem key={h} value={h} disabled={hourDisabled(h)}>{h}</MenuItem>
          ))}
        </Select>
        <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0, lineHeight: 1 }}>:</Typography>
        <Select
          value={mm}
          onChange={handleMinute}
          disabled={disabled || !hh}
          displayEmpty
          variant="outlined"
          size={size}
          renderValue={(v: string) => (
            <Typography variant="body2" color={v ? 'text.primary' : 'text.disabled'}>{v || 'MM'}</Typography>
          )}
          sx={selectSx}
          MenuProps={{ PaperProps: { sx: { maxHeight: 224 } } }}
        >
          {MINUTES.map((m) => (
            <MenuItem key={m} value={m} disabled={minuteDisabled(m)}>{m}</MenuItem>
          ))}
        </Select>
      </Box>
      {helperText && (
        <FormHelperText error={error} sx={{ mx: '14px', mt: '3px' }}>
          {helperText}
        </FormHelperText>
      )}
    </Box>
  )
}
