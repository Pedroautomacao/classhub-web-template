import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from 'react'
import { Box, TextField } from '@mui/material'
import { luminaPalette } from '@/theme/luminaAcademic'

interface CodeInputProps {
  value: string
  onChange: (value: string) => void
  length?: number
  /** Quando o usuário completa todos os dígitos, dispara este callback. */
  onComplete?: (value: string) => void
  disabled?: boolean
  autoFocus?: boolean
  error?: boolean
}

/**
 * Input segmentado de N dígitos (default 6) com:
 * - navegação automática entre campos ao digitar
 * - backspace volta pro anterior
 * - colar (paste) preenche em massa
 * - autofocus opcional
 */
export function CodeInput({
  value,
  onChange,
  length = 6,
  onComplete,
  disabled,
  autoFocus,
  error,
}: CodeInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus()
  }, [autoFocus])

  const setDigit = (i: number, digit: string) => {
    const next = value.padEnd(length, ' ').split('')
    next[i] = digit
    const normalized = next.join('').replaceAll(' ', '').slice(0, length)
    onChange(normalized)
    if (normalized.length === length) onComplete?.(normalized)
  }

  const handleChange = (i: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1)
    if (!digit) {
      setDigit(i, '')
      return
    }
    setDigit(i, digit)
    if (i < length - 1) refs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) {
      refs.current[i - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus()
    if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus()
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    e.preventDefault()
    onChange(pasted)
    if (pasted.length === length) {
      refs.current[length - 1]?.focus()
      onComplete?.(pasted)
    } else {
      refs.current[pasted.length]?.focus()
    }
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 1, sm: 1.5 } }} onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <TextField
          key={i}
          inputRef={(el: HTMLInputElement | null) => {
            refs.current[i] = el
          }}
          value={value[i] ?? ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          disabled={disabled}
          error={error}
          inputMode="numeric"
          slotProps={{
            htmlInput: {
              maxLength: 1,
              'aria-label': `Dígito ${i + 1} de ${length}`,
              style: {
                textAlign: 'center',
                fontFamily: '"Hanken Grotesk", sans-serif',
                fontWeight: 700,
                fontSize: 24,
                padding: 0,
              },
            },
          }}
          sx={{
            width: { xs: 44, sm: 56 },
            '& .MuiOutlinedInput-root': {
              height: { xs: 56, sm: 64 },
              borderRadius: 2,
              bgcolor: 'background.paper',
              '& fieldset': { borderWidth: 2 },
              '&.Mui-focused fieldset': {
                borderColor: error ? 'error.main' : luminaPalette.tertiary.main,
                borderWidth: 2,
              },
            },
          }}
        />
      ))}
    </Box>
  )
}
