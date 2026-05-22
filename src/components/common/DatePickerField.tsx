import { useEffect, useRef, useState } from 'react'
import { Box, IconButton, InputAdornment, Popover, TextField } from '@mui/material'
import { CalendarMonth } from '@mui/icons-material'
import { CalendarPicker } from './CalendarPicker'
import type { SxProps, Theme } from '@mui/material/styles'

function isoToBR(v: string | null | undefined): string {
  if (!v) return ''
  const parts = v.split('-')
  if (parts.length !== 3) return v
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

/** Normaliza o input do usuário: mantém só dígitos e injeta as barras na ordem DD/MM/AAAA. */
function applyMask(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`
}

interface ParseResult {
  /** Data completa e válida (ISO `YYYY-MM-DD`) — só preenchida quando passou em todas as validações. */
  iso: string | null
  /** Mensagem de erro se o texto está malformado, ou null. Texto vazio = null (sem erro). */
  error: string | null
  /** True quando o texto não é uma data completa (8 dígitos), ainda em digitação. */
  partial: boolean
}

function parseBR(text: string, minDate?: string, maxDate?: string): ParseResult {
  if (!text) return { iso: null, error: null, partial: false }
  const m = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return { iso: null, error: null, partial: true }
  const day = Number(m[1])
  const month = Number(m[2])
  const year = Number(m[3])
  if (month < 1 || month > 12) return { iso: null, error: 'Mês inválido', partial: false }
  if (day < 1 || day > 31) return { iso: null, error: 'Dia inválido', partial: false }
  const maxYear = new Date().getFullYear() + 50
  if (year < 1900 || year > maxYear) return { iso: null, error: 'Ano inválido', partial: false }
  const d = new Date(year, month - 1, day)
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return { iso: null, error: 'Data inválida', partial: false }
  }
  const iso = `${m[3]}-${m[2]}-${m[1]}`
  if (minDate && iso < minDate) return { iso: null, error: 'Data anterior à mínima', partial: false }
  if (maxDate && iso > maxDate) return { iso: null, error: 'Data posterior à máxima', partial: false }
  return { iso, error: null, partial: false }
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
  const [text, setText] = useState<string>(isoToBR(value))
  const [localError, setLocalError] = useState<string | null>(null)

  // Quando o `value` muda externamente (ex: picker seleciona) e diverge do texto local,
  // sobrescreve o texto. Evita sobrescrever no meio de uma digitação válida.
  useEffect(() => {
    const expected = isoToBR(value)
    if (expected !== text) {
      // Não sobrescreve se o usuário ainda está digitando uma versão parcial
      const parsed = parseBR(text, minDate, maxDate)
      if (!parsed.partial) setText(expected)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const handleTextChange = (raw: string) => {
    const masked = applyMask(raw)
    setText(masked)
    const parsed = parseBR(masked, minDate, maxDate)
    setLocalError(parsed.error)
    if (parsed.iso) {
      onChange?.(parsed.iso)
    } else if (!masked) {
      onChange?.(null)
    }
  }

  const handlePickerSelect = (v: string | null) => {
    setText(isoToBR(v))
    setLocalError(null)
    onChange?.(v)
    setOpen(false)
  }

  const handleBlur = () => {
    // No blur, se o texto está vazio garante onChange(null); se está incompleto/inválido mostra erro.
    if (!text) {
      onChange?.(null)
      setLocalError(null)
      return
    }
    const parsed = parseBR(text, minDate, maxDate)
    if (parsed.partial) {
      setLocalError('Data incompleta')
    } else {
      setLocalError(parsed.error)
    }
  }

  const showError = error || !!localError
  const showHelperText = localError || helperText

  return (
    <>
      <Box ref={anchorRef} sx={sx}>
        <TextField
          label={label}
          value={text}
          placeholder={placeholder ?? 'DD/MM/AAAA'}
          fullWidth={fullWidth}
          size={size}
          disabled={disabled}
          error={showError}
          helperText={showHelperText}
          onChange={(e) => handleTextChange(e.target.value)}
          onBlur={handleBlur}
          inputProps={{ inputMode: 'numeric', maxLength: 10 }}
          slotProps={{
            inputLabel: { shrink: true },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    edge="end"
                    disabled={disabled}
                    onClick={() => setOpen(true)}
                    aria-label="Abrir calendário"
                  >
                    <CalendarMonth fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
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
          onChange={handlePickerSelect}
          minDate={minDate}
          maxDate={maxDate}
        />
      </Popover>
    </>
  )
}
