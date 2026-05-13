import { useRef, useState } from 'react'
import { Box, InputAdornment, Popover, TextField } from '@mui/material'
import { CalendarMonth } from '@mui/icons-material'
import { CalendarPicker } from './CalendarPicker'
import type { SxProps, Theme } from '@mui/material/styles'

function formatBR(v: string | null | undefined): string {
  if (!v) return ''
  const parts = v.split('-')
  if (parts.length !== 3) return v
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

interface DatePickerFieldProps {
  value?: string | null
  onChange?: (v: string | null) => void
  label?: string
  error?: boolean
  helperText?: string
  fullWidth?: boolean
  size?: 'small' | 'medium'
  disabled?: boolean
  minDate?: string
  maxDate?: string
  placeholder?: string
  sx?: SxProps<Theme>
}

export function DatePickerField({
  value, onChange, label, error, helperText, fullWidth,
  size = 'medium', disabled, minDate, maxDate, placeholder, sx,
}: DatePickerFieldProps) {
  const anchorRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  const handleSelect = (v: string | null) => {
    onChange?.(v)
    setOpen(false)
  }

  return (
    <>
      <Box ref={anchorRef} sx={sx}>
        <TextField
          label={label}
          value={formatBR(value)}
          placeholder={placeholder ?? 'DD/MM/AAAA'}
          fullWidth={fullWidth}
          size={size}
          disabled={disabled}
          error={error}
          helperText={helperText}
          slotProps={{
            inputLabel: { shrink: true },
            input: {
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
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
        slotProps={{ paper: { sx: { p: 2, mt: 0.5, width: 288 } } }}
      >
        <CalendarPicker
          mode="single"
          value={value}
          onChange={handleSelect}
          minDate={minDate}
          maxDate={maxDate}
        />
      </Popover>
    </>
  )
}
