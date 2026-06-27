import { Box, Tooltip, Typography } from '@mui/material'
import type { WordFreq } from './textAnalysis'

const PALETTE = ['#1b656c', '#2e9e6b', '#f5a623', '#5b8def', '#9b59b6', '#e5484d', '#e07b39']

interface WordCloudProps {
  words: WordFreq[]
  minFont?: number
  maxFont?: number
}

/**
 * Nuvem de palavras sem dependência externa: o tamanho da fonte escala com a
 * frequência (entre minFont e maxFont) e a cor vem de uma paleta fixa.
 */
export function WordCloud({ words, minFont = 14, maxFont = 44 }: WordCloudProps) {
  if (words.length === 0) {
    return <Typography variant="body2" color="text.secondary">Sem texto suficiente para a nuvem de palavras.</Typography>
  }

  const max = Math.max(...words.map((w) => w.value))
  const min = Math.min(...words.map((w) => w.value))
  const range = Math.max(1, max - min)

  return (
    <Box
      sx={{
        display: 'flex', flexWrap: 'wrap', gap: 1.2, alignItems: 'center',
        justifyContent: 'center', py: 2,
      }}
    >
      {words.map((w, i) => {
        const size = minFont + ((w.value - min) / range) * (maxFont - minFont)
        return (
          <Tooltip key={w.text} title={`${w.value} menç${w.value === 1 ? 'ão' : 'ões'}`}>
            <Typography
              component="span"
              sx={{
                fontSize: size, lineHeight: 1, fontWeight: 600,
                color: PALETTE[i % PALETTE.length], cursor: 'default',
                transition: 'transform .15s', '&:hover': { transform: 'scale(1.1)' },
              }}
            >
              {w.text}
            </Typography>
          </Tooltip>
        )
      })}
    </Box>
  )
}
