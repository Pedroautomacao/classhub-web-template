import { Box, Container, Paper, Stack, Typography } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import type { ReactNode } from 'react'
import { buildTheme } from '@/theme'
import { luminaGradients, luminaPalette, luminaShadows } from '@/theme/luminaAcademic'

interface AuthShellProps {
  title: string
  subtitle?: ReactNode
  /** Conteúdo do card central (formulário, código, etc) */
  children: ReactNode
  /** Conteúdo opcional após o card (links auxiliares, voltar pra login, etc) */
  footer?: ReactNode
  /** Ícone exibido no topo do card (ex: <LockResetIcon />) */
  icon?: ReactNode
}

// Rotas /auth/* rodam sempre em light mode — não devem herdar o toggle de
// tema do admin. Calculado fora do componente pra não recriar a cada render.
const authTheme = buildTheme('light')

/**
 * Layout compartilhado pelas rotas /auth/* (recuperação, validação, redefinição).
 * Fundo com gradiente "Lumina Academic", card central com sombra elevada.
 * O LoginDialog é um modal — NÃO usa este shell.
 */
export function AuthShell({ title, subtitle, children, footer, icon }: AuthShellProps) {
  return (
    <ThemeProvider theme={authTheme}>
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: luminaGradients.authShell,
        py: { xs: 4, md: 8 },
        px: 2,
      }}
    >
      <Container maxWidth="sm" sx={{ px: { xs: 0, sm: 2 } }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: { xs: 4, md: 6 },
            p: { xs: 4, md: 6 },
            bgcolor: luminaPalette.neutral.surface,
            boxShadow: luminaShadows.floating,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack spacing={1.5} alignItems="center" sx={{ mb: 4, textAlign: 'center' }}>
            {icon && (
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 4,
                  bgcolor: luminaPalette.primary.container,
                  color: luminaPalette.primary.onContainer,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1,
                  '& svg': { fontSize: 32 },
                }}
              >
                {icon}
              </Box>
            )}
            <Typography
              component="h1"
              sx={{
                fontFamily: '"Hanken Grotesk", sans-serif',
                fontWeight: 700,
                fontSize: { xs: 24, md: 28 },
                letterSpacing: '-0.01em',
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography sx={{ color: 'text.secondary', fontSize: { xs: 14, md: 16 }, lineHeight: 1.6 }}>
                {subtitle}
              </Typography>
            )}
          </Stack>

          {children}
        </Paper>

        {footer && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>{footer}</Box>
        )}
      </Container>
    </Box>
    </ThemeProvider>
  )
}
