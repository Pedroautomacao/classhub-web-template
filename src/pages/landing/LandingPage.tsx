import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Skeleton,
  Stack,
  IconButton,
  Button,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material'
import { Schedule, AttachMoney, CheckCircleOutline, Assignment } from '@mui/icons-material'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import InstagramIcon from '@mui/icons-material/Instagram'
import { settingsApi } from '@/api/settings.api'
import { plansApi } from '@/api/plans.api'
import type { Plan } from '@/types'

function PlanCard({ plan, whatsapp }: { plan: Plan; whatsapp: string | null }) {
  const [expanded, setExpanded] = useState(false)

  const price = parseFloat(plan.price).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  const waNumber = whatsapp?.replace(/\D/g, '') ?? ''
  const waMessage = encodeURIComponent(`Olá Fluent, tenho interesse no plano ${plan.name}.`)
  const waLink = `https://wa.me/${waNumber}?text=${waMessage}`

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 },
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          {plan.name}
        </Typography>
        {plan.description && (
          <Typography variant="body2" color="text.secondary" mb={2}>
            {plan.description}
          </Typography>
        )}
        <Stack spacing={1} mt="auto">
          <Stack direction="row" alignItems="center" spacing={1}>
            <Schedule fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {plan.duration_months} {plan.duration_months === 1 ? 'mês' : 'meses'}
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <AttachMoney fontSize="small" color="secondary" />
            <Typography variant="h6" color="secondary.main" fontWeight={700}>
              {price}
            </Typography>
          </Stack>
        </Stack>

        {plan.benefits && plan.benefits.length > 0 && (
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Divider sx={{ my: 2 }} />
            <List dense disablePadding>
              {plan.benefits.map((benefit, i) => (
                <ListItem key={i} disableGutters sx={{ py: 0.25 }}>
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <CheckCircleOutline fontSize="small" color="success" />
                  </ListItemIcon>
                  <ListItemText primary={benefit} primaryTypographyProps={{ variant: 'body2' }} />
                </ListItem>
              ))}
            </List>
          </Collapse>
        )}
      </CardContent>

      <CardActions sx={{ px: 3, pb: 2, pt: 0, flexDirection: 'column', gap: 1 }}>
        {plan.benefits && plan.benefits.length > 0 && (
          <Button
            fullWidth
            size="small"
            variant="outlined"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'Ocultar detalhes' : 'Ver detalhes'}
          </Button>
        )}
        {whatsapp && (
          <Button
            fullWidth
            size="small"
            variant="contained"
            color="success"
            startIcon={<WhatsAppIcon />}
            component="a"
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            Tenho interesse
          </Button>
        )}
      </CardActions>
    </Card>
  )
}

function PlansSkeleton() {
  return (
    <Grid container spacing={3}>
      {[1, 2, 3].map((i) => (
        <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
          <Skeleton variant="rounded" height={200} />
        </Grid>
      ))}
    </Grid>
  )
}

export function LandingPage() {
  const navigate = useNavigate()

  const { data: landing, isLoading: loadingLanding } = useQuery({
    queryKey: ['landing'],
    queryFn: settingsApi.getLanding,
  })

  const { data: plans, isLoading: loadingPlans } = useQuery({
    queryKey: ['public-plans'],
    queryFn: plansApi.listPublic,
  })

  const schoolName = landing?.school_name ?? 'Fluent Flow'
  const welcomeText =
    landing?.welcome_text ??
    'Aprenda inglês com qualidade, praticidade e foco nos seus objetivos.'
  const welcomeImage = landing?.welcome_image ?? null
  const whatsapp = landing?.whatsapp ?? null
  const instagram = landing?.instagram ?? null

  return (
    <Box>
      {/* Hero */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1f1b34 0%, #357e8c 60%, #76c5d5 100%)',
          color: 'white',
          py: { xs: 8, md: 14 },
          px: 2,
        }}
      >
        <Container maxWidth="lg">
          {welcomeImage ? (
            <Grid container spacing={6} alignItems="center" justifyContent="center">
              <Grid size={{ xs: 12, md: 6 }} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                {loadingLanding ? (
                  <>
                    <Skeleton variant="text" width="70%" sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} height={60} />
                    <Skeleton variant="text" width="90%" sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} height={40} />
                  </>
                ) : (
                  <>
                    <Typography variant="h2" fontWeight={700} gutterBottom sx={{ fontSize: { xs: '2rem', md: '3rem' } }}>
                      {schoolName}
                    </Typography>
                    <Typography variant="h5" sx={{ opacity: 0.9, fontSize: { xs: '1.1rem', md: '1.4rem' } }}>
                      {welcomeText}
                    </Typography>
                  </>
                )}
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box
                  component="img"
                  src={welcomeImage}
                  alt={schoolName}
                  sx={{
                    width: '100%',
                    maxHeight: 380,
                    objectFit: 'cover',
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  }}
                />
              </Grid>
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center' }}>
              {loadingLanding ? (
                <>
                  <Skeleton variant="text" width="60%" sx={{ mx: 'auto', bgcolor: 'rgba(255,255,255,0.2)' }} height={60} />
                  <Skeleton variant="text" width="80%" sx={{ mx: 'auto', bgcolor: 'rgba(255,255,255,0.2)' }} height={40} />
                </>
              ) : (
                <>
                  <Typography variant="h2" fontWeight={700} gutterBottom sx={{ fontSize: { xs: '2rem', md: '3rem' } }}>
                    {schoolName}
                  </Typography>
                  <Typography variant="h5" sx={{ opacity: 0.9, maxWidth: 600, mx: 'auto', fontSize: { xs: '1.1rem', md: '1.4rem' } }}>
                    {welcomeText}
                  </Typography>
                </>
              )}
            </Box>
          )}
        </Container>
      </Box>

      {/* CTA — Nivelamento */}
      <Box sx={{ bgcolor: 'primary.main', py: { xs: 5, md: 7 }, px: 2 }}>
        <Container maxWidth="md">
          <Stack alignItems="center" spacing={2} textAlign="center">
            <Assignment sx={{ fontSize: 48, color: 'white' }} />
            <Typography variant="h4" fontWeight={700} color="white" sx={{ fontSize: { xs: '1.6rem', md: '2rem' } }}>
              Descubra seu nível de inglês
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)', maxWidth: 520 }}>
              Faça nosso teste de nivelamento gratuito e saiba qual turma é a ideal para você.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/leveling')}
              sx={{
                mt: 1,
                bgcolor: 'white',
                color: 'primary.main',
                fontWeight: 700,
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                '&:hover': { bgcolor: 'grey.100' },
              }}
            >
              Fazer teste de nivelamento
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Planos */}
      <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <Typography variant="h4" fontWeight={700} textAlign="center" mb={1} color="primary">
            Nossos Planos
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center" mb={5}>
            Escolha o plano ideal para a sua jornada no inglês
          </Typography>

          {loadingPlans ? (
            <PlansSkeleton />
          ) : !plans?.length ? (
            <Typography textAlign="center" color="text.secondary">
              Em breve novos planos disponíveis.
            </Typography>
          ) : (
            <Grid container spacing={3} justifyContent="center">
              {plans.map((plan) => (
                <Grid key={plan.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <PlanCard plan={plan} whatsapp={whatsapp} />
                </Grid>
              ))}
            </Grid>
          )}
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{ bgcolor: 'primary.main', color: 'white', py: 4, textAlign: 'center' }}
      >
        <Container maxWidth="lg">
          {(whatsapp || instagram) && (
            <Stack direction="row" justifyContent="center" spacing={2} mb={2}>
              {whatsapp && (
                <IconButton
                  component="a"
                  href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    bgcolor: '#25D366',
                    color: 'white',
                    '&:hover': { bgcolor: '#1ebe5d' },
                  }}
                >
                  <WhatsAppIcon />
                </IconButton>
              )}
              {instagram && (
                <IconButton
                  component="a"
                  href={`https://instagram.com/${instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    bgcolor: '#E1306C',
                    color: 'white',
                    '&:hover': { bgcolor: '#c1255a' },
                  }}
                >
                  <InstagramIcon />
                </IconButton>
              )}
            </Stack>
          )}
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            © {new Date().getFullYear()} {schoolName}. Todos os direitos reservados.
          </Typography>
        </Container>
      </Box>
    </Box>
  )
}
