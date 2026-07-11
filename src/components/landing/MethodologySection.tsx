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
      'Foco em conversação desde o primeiro dia (inclusive nas aulas de gramática). Vamos destravar o seu inglês com situações reais do dia a dia — nada de frases decoradas e material engessado!',
    accent: luminaPalette.primary.main,
    accentBg: 'rgba(27, 101, 108, 0.1)',
  },
  {
    icon: <AutoStoriesIcon sx={{ fontSize: 40 }} />,
    title: 'Material Exclusivo',
    description:
      'Acesso ilimitado aos materiais exclusivos, com textos, jogos e exercícios interativos de prática, fixação e revisão, além de um Planner de vocabulário para todos os níveis.',
    accent: luminaPalette.tertiary.main,
    accentBg: 'rgba(108, 31, 243, 0.1)',
  },
  {
    icon: <ScheduleIcon sx={{ fontSize: 40 }} />,
    title: 'Flexibilidade Total',
    description:
      'Estude no seu próprio ritmo. Aulas com horários flexíveis — manhã, tarde e noite — e turmas niveladas para o seu perfil!',
    accent: luminaPalette.secondary.main,
    accentBg: 'rgba(27, 109, 36, 0.1)',
  },
]

export function MethodologySection() {
  return (
    <Box
      component="section"
      id="metodologia"
      sx={{ bgcolor: luminaPalette.neutral.surfaceContainer, py: { xs: 8, md: 14 } }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, md: 3 } }}>
        <Stack spacing={2} alignItems="center" sx={{ mb: { xs: 6, md: 8 }, textAlign: 'center' }}>
          <Typography
            component="h2"
            sx={{
              fontFamily: '"Hanken Grotesk", sans-serif',
              fontWeight: 700,
              fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' },
            }}
          >
            Nossa Metodologia
          </Typography>
          <Box sx={{ height: 6, width: 96, bgcolor: luminaPalette.primary.main, borderRadius: 999 }} />
          <Typography sx={{ fontSize: { xs: 16, md: 18 }, color: 'text.secondary', maxWidth: 600 }}>
            Um caminho estruturado para o seu sucesso acadêmico.
          </Typography>
        </Stack>

        <Grid container spacing={{ xs: 3, md: 4 }}>
          {METHODS.map((method) => (
            <Grid key={method.title} size={{ xs: 12, md: 4 }}>
              <Stack
                spacing={{ xs: 2, md: 3 }}
                alignItems={{ xs: 'flex-start', md: 'center' }}
                sx={{
                  bgcolor: luminaPalette.neutral.surface,
                  p: { xs: 3, md: 5 },
                  borderRadius: { xs: 4, md: 6 },
                  border: '1px solid',
                  borderColor: 'divider',
                  textAlign: { xs: 'left', md: 'center' },
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
                    width: { xs: 56, md: 80 },
                    height: { xs: 56, md: 80 },
                    borderRadius: 3,
                    bgcolor: method.accentBg,
                    color: method.accent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '& svg': { fontSize: { xs: 28, md: 40 } },
                  }}
                >
                  {method.icon}
                </Box>
                <Typography
                  sx={{
                    fontFamily: '"Hanken Grotesk", sans-serif',
                    fontWeight: 700,
                    fontSize: { xs: 20, md: 22 },
                    color: luminaPalette.neutral.text,
                  }}
                >
                  {method.title}
                </Typography>
                <Typography sx={{ color: 'text.secondary', lineHeight: 1.6, fontSize: { xs: 15, md: 16 } }}>
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
