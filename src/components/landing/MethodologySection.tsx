import { Box, Container, Grid, Stack, Typography } from '@mui/material'
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver'
import AutoStoriesIcon from '@mui/icons-material/AutoStories'
import ScheduleIcon from '@mui/icons-material/Schedule'
import { luminaPalette, luminaShadows } from '@/theme/luminaAcademic'
import type { ReactNode } from 'react'

interface MethodCard {
  icon: ReactNode
  title: string
  description: string
  accent: string
  accentBg: string
}

const METHODS: MethodCard[] = [
  {
    icon: <RecordVoiceOverIcon sx={{ fontSize: 40 }} />,
    title: 'Aprendizado Prático',
    description:
      'Foco total em conversação desde o primeiro dia. Desenvolvemos sua confiança para falar em situações reais do cotidiano.',
    accent: luminaPalette.primary.main,
    accentBg: 'rgba(27, 101, 108, 0.1)',
  },
  {
    icon: <AutoStoriesIcon sx={{ fontSize: 40 }} />,
    title: 'Material Exclusivo',
    description:
      'Acesso ilimitado a materiais digitais premium, exercícios interativos e biblioteca de áudio inclusos em todos os planos.',
    accent: luminaPalette.tertiary.main,
    accentBg: 'rgba(108, 31, 243, 0.1)',
  },
  {
    icon: <ScheduleIcon sx={{ fontSize: 40 }} />,
    title: 'Flexibilidade Total',
    description:
      'Estude no seu próprio ritmo com nossa plataforma 24/7. Organize sua agenda de acordo com sua disponibilidade e objetivos.',
    accent: luminaPalette.secondary.main,
    accentBg: 'rgba(27, 109, 36, 0.1)',
  },
]

export function MethodologySection() {
  return (
    <Box
      component="section"
      id="metodologia"
      sx={{ bgcolor: luminaPalette.neutral.surfaceContainer, py: { xs: 10, md: 14 } }}
    >
      <Container maxWidth="lg">
        <Stack spacing={2} alignItems="center" sx={{ mb: 8, textAlign: 'center' }}>
          <Typography
            component="h2"
            sx={{
              fontFamily: '"Hanken Grotesk", sans-serif',
              fontWeight: 700,
              fontSize: { xs: '2rem', md: '3rem' },
            }}
          >
            Nossa Metodologia
          </Typography>
          <Box sx={{ height: 6, width: 96, bgcolor: luminaPalette.primary.main, borderRadius: 999 }} />
          <Typography sx={{ fontSize: 18, color: 'text.secondary', maxWidth: 600 }}>
            Um caminho estruturado para o seu sucesso acadêmico.
          </Typography>
        </Stack>

        <Grid container spacing={4}>
          {METHODS.map((method) => (
            <Grid key={method.title} size={{ xs: 12, md: 4 }}>
              <Stack
                spacing={3}
                alignItems="center"
                sx={{
                  bgcolor: luminaPalette.neutral.surface,
                  p: 5,
                  borderRadius: 6,
                  border: '1px solid',
                  borderColor: 'divider',
                  textAlign: 'center',
                  height: '100%',
                  boxShadow: luminaShadows.card,
                  transition: 'box-shadow 300ms ease, transform 300ms ease',
                  '&:hover': {
                    boxShadow: luminaShadows.floating,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: 3,
                    bgcolor: method.accentBg,
                    color: method.accent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {method.icon}
                </Box>
                <Typography
                  sx={{
                    fontFamily: '"Hanken Grotesk", sans-serif',
                    fontWeight: 700,
                    fontSize: 22,
                  }}
                >
                  {method.title}
                </Typography>
                <Typography sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                  {method.description}
                </Typography>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  )
}
