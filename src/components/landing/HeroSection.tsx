import { Box, Container, Typography, Button, Skeleton } from '@mui/material'
import { luminaGradients, luminaPalette } from '@/theme/luminaAcademic'

interface HeroSectionProps {
  schoolName: string
  welcomeText: string
  /**
   * URL opcional de imagem dinâmica que vem do backend (campo `welcome_image`
   * em Settings; futuramente `hero_bg_url`). Quando presente, é aplicada como
   * background com um overlay teal por cima para preservar legibilidade.
   * Quando ausente, o gradiente Lumina Academic é o fallback.
   */
  dynamicBg?: string | null
  loading?: boolean
  onLevelingClick: () => void
}

export function HeroSection({
  schoolName,
  welcomeText,
  dynamicBg,
  loading,
  onLevelingClick,
}: HeroSectionProps) {
  const hasDynamicBg = !!dynamicBg
  const background = hasDynamicBg
    ? `linear-gradient(rgba(27, 101, 108, 0.85), rgba(0, 32, 35, 0.95)), url('${dynamicBg}')`
    : luminaGradients.hero

  return (
    <Box
      component="section"
      id="hero"
      data-dynamic-bg={hasDynamicBg ? 'true' : 'false'}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        py: { xs: 12, md: 16 },
        textAlign: 'center',
        background,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: '#ffffff',
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: 0.1,
          pointerEvents: 'none',
          backgroundImage: `radial-gradient(${luminaPalette.primary.container} 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        {loading ? (
          <>
            <Skeleton
              variant="text"
              width="60%"
              height={80}
              sx={{ mx: 'auto', bgcolor: 'rgba(255,255,255,0.2)' }}
            />
            <Skeleton
              variant="text"
              width="80%"
              height={32}
              sx={{ mx: 'auto', mt: 2, bgcolor: 'rgba(255,255,255,0.2)' }}
            />
          </>
        ) : (
          <>
            <Typography
              component="h1"
              sx={{
                fontFamily: '"Hanken Grotesk", sans-serif',
                fontWeight: 800,
                fontSize: { xs: '2.5rem', md: '4rem' },
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
                color: luminaPalette.primary.container,
                mb: 3,
              }}
            >
              {schoolName}
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '1.05rem', md: '1.25rem' },
                color: 'rgba(244, 254, 255, 0.8)',
                maxWidth: 720,
                mx: 'auto',
                mb: 5,
                lineHeight: 1.6,
              }}
            >
              {welcomeText}
            </Typography>
          </>
        )}
        <Button
          variant="contained"
          size="large"
          onClick={onLevelingClick}
          sx={{
            bgcolor: luminaPalette.primary.container,
            color: luminaPalette.primary.onContainer,
            fontWeight: 700,
            fontSize: 16,
            px: 5,
            py: 1.75,
            borderRadius: 2,
            boxShadow: '0px 8px 24px rgba(0,0,0,0.18)',
            '&:hover': {
              bgcolor: luminaPalette.primary.container,
              filter: 'brightness(1.05)',
              boxShadow: '0px 12px 32px rgba(0,0,0,0.22)',
            },
          }}
        >
          Fazer teste de nivelamento
        </Button>
      </Container>
    </Box>
  )
}
