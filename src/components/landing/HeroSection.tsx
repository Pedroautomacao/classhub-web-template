import { Box, Container, Typography, Button, Skeleton } from '@mui/material'
import { luminaGradients, luminaPalette } from '@/theme/luminaAcademic'

interface HeroSectionProps {
  schoolName: string
  welcomeText: string
  /**
   * URL opcional de imagem dinâmica que vem do backend (campo `hero_bg_url`
   * em Settings). Quando presente, é aplicada como background com um overlay
   * teal por cima para preservar legibilidade. Quando ausente, o gradiente
   * Lumina Academic é o fallback.
   */
  dynamicBg?: string | null
  loading?: boolean
}

export function HeroSection({
  schoolName,
  welcomeText,
  dynamicBg,
  loading,
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
        // Margem superior mais generosa pra dar respiro entre a navbar sticky
        // e o título do hero.
        pt: { xs: 12, md: 22 },
        pb: { xs: 10, md: 18 },
        px: { xs: 2, md: 0 },
        textAlign: 'center',
        background,
        backgroundSize: 'cover',
        // 'center top' em vez de 'center' — em telas ultra-wide a imagem é
        // cortada vertical. Ancorando no topo, o corte cai na parte inferior
        // (onde tipicamente há menos conteúdo importante), preservando rostos.
        backgroundPosition: 'center top',
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
                fontSize: { xs: '2rem', sm: '2.5rem', md: '4rem' },
                lineHeight: { xs: 1.15, md: 1.05 },
                letterSpacing: '-0.02em',
                color: luminaPalette.primary.container,
                mb: { xs: 2, md: 3 },
              }}
            >
              {schoolName}
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '1rem', md: '1.25rem' },
                color: 'rgba(244, 254, 255, 0.8)',
                maxWidth: 720,
                mx: 'auto',
                mb: { xs: 4, md: 5 },
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
          component="a"
          href="/leveling"
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            bgcolor: luminaPalette.primary.container,
            color: luminaPalette.primary.onContainer,
            fontWeight: 700,
            fontSize: { xs: 14, md: 16 },
            px: { xs: 4, md: 5 },
            py: { xs: 1.5, md: 1.75 },
            width: { xs: '100%', sm: 'auto' },
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
