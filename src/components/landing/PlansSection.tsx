import { Box, Container, Typography, Grid, Card, Stack, Button, Skeleton } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import type { Plan } from '@/types'
import { luminaPalette, luminaShadows } from '@/theme/luminaAcademic'

interface PlansSectionProps {
  plans: Plan[] | undefined
  loading: boolean
  whatsapp: string | null
  schoolName: string
}

const ACCENT_COLORS = [
  luminaPalette.primary.main,
  luminaPalette.tertiary.main,
  luminaPalette.neutral.outline,
] as const

function formatPrice(value: string) {
  return parseFloat(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })
}

function PlanCard({
  plan,
  accent,
  whatsapp,
  schoolName,
}: {
  plan: Plan
  accent: string
  whatsapp: string | null
  schoolName: string
}) {
  const monthly = plan.duration_months > 0
    ? parseFloat(plan.price) / plan.duration_months
    : parseFloat(plan.price)
  const monthlyFmt = monthly.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })

  const waNumber = whatsapp?.replace(/\D/g, '') ?? ''
  const waMessage = encodeURIComponent(`Olá ${schoolName}, tenho interesse no plano ${plan.name}.`)
  const waLink = `https://wa.me/${waNumber}?text=${waMessage}`

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        bgcolor: luminaPalette.neutral.surface,
        boxShadow: luminaShadows.card,
        transition: 'transform 300ms ease, box-shadow 300ms ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: luminaShadows.floating,
        },
      }}
    >
      <Box sx={{ height: 6, width: '100%', bgcolor: accent }} />
      <Stack spacing={3} sx={{ p: { xs: 3, md: 4 }, flexGrow: 1 }}>
        <Typography
          sx={{
            fontFamily: '"Hanken Grotesk", sans-serif',
            fontWeight: 700,
            fontSize: 24,
            color: 'text.primary',
          }}
        >
          {plan.name}
        </Typography>

        <Stack direction="row" alignItems="baseline" spacing={0.5}>
          <Typography sx={{ fontFamily: '"Hanken Grotesk", sans-serif', fontWeight: 700, fontSize: 36, color: 'text.primary' }}>
            {monthlyFmt}
          </Typography>
          <Typography sx={{ fontSize: 14, color: 'text.secondary', fontWeight: 500 }}>/mês</Typography>
        </Stack>

        {plan.description && (
          <Typography sx={{ color: 'text.secondary', lineHeight: 1.6 }}>{plan.description}</Typography>
        )}

        {plan.benefits && plan.benefits.length > 0 && (
          <Stack spacing={2} sx={{ pt: 1 }}>
            {plan.benefits.map((benefit, i) => (
              <Stack key={i} direction="row" spacing={1.5} alignItems="center">
                <CheckCircleIcon sx={{ color: accent, fontSize: 20 }} />
                <Typography sx={{ fontSize: 15, color: 'text.secondary' }}>{benefit}</Typography>
              </Stack>
            ))}
          </Stack>
        )}

        <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 'auto' }}>
          Total do plano: <strong>{formatPrice(plan.price)}</strong> em {plan.duration_months}{' '}
          {plan.duration_months === 1 ? 'mês' : 'meses'}
        </Typography>
      </Stack>

      <Box sx={{ px: { xs: 3, md: 4 }, pb: { xs: 3, md: 4 } }}>
        <Button
          fullWidth
          variant="contained"
          color="secondary"
          startIcon={<WhatsAppIcon />}
          component="a"
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          disabled={!whatsapp}
          sx={{
            borderRadius: 2,
            py: { xs: 1.5, md: 1.75 },
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          Tenho interesse
        </Button>
      </Box>
    </Card>
  )
}

function PlansSkeleton() {
  return (
    <Grid container spacing={4}>
      {[0, 1, 2].map((i) => (
        <Grid key={i} size={{ xs: 12, md: 4 }}>
          <Skeleton variant="rounded" height={420} sx={{ borderRadius: 4 }} />
        </Grid>
      ))}
    </Grid>
  )
}

export function PlansSection({ plans, loading, whatsapp, schoolName }: PlansSectionProps) {
  return (
    <Box component="section" id="planos" sx={{ py: { xs: 8, md: 14 } }}>
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
            Nossos Planos
          </Typography>
          <Box sx={{ height: 6, width: 96, bgcolor: luminaPalette.tertiary.main, borderRadius: 999 }} />
          <Typography sx={{ fontSize: { xs: 16, md: 18 }, color: 'text.secondary', maxWidth: 600 }}>
            Escolha o investimento ideal para a sua jornada de fluência.
          </Typography>
        </Stack>

        {loading ? (
          <PlansSkeleton />
        ) : !plans?.length ? (
          <Typography textAlign="center" color="text.secondary">
            Em breve novos planos disponíveis.
          </Typography>
        ) : (
          <Grid container spacing={4} justifyContent="center">
            {plans.map((plan, i) => (
              <Grid key={plan.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <PlanCard
                  plan={plan}
                  accent={ACCENT_COLORS[i % ACCENT_COLORS.length]}
                  whatsapp={whatsapp}
                  schoolName={schoolName}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  )
}
