import { AppBar, Toolbar, Box, Stack, Button, Typography, useScrollTrigger } from '@mui/material'

interface LandingNavbarProps {
  schoolName: string
  onLoginClick: () => void
}

const NAV_LINKS = [
  { label: 'Metodologia', href: '#metodologia' },
  { label: 'Planos', href: '#planos' },
  { label: 'Nivelamento', href: '#hero' },
]

export function LandingNavbar({ schoolName, onLoginClick }: LandingNavbarProps) {
  const elevated = useScrollTrigger({ disableHysteresis: true, threshold: 24 })

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundImage: 'none',
        bgcolor: elevated ? 'rgba(248, 249, 250, 0.92)' : 'rgba(248, 249, 250, 0.78)',
        color: 'text.primary',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid',
        borderColor: 'divider',
        transition: 'background-color 200ms ease, box-shadow 200ms ease',
        boxShadow: elevated ? '0px 4px 20px rgba(0,0,0,0.04)' : 'none',
      }}
    >
      <Toolbar disableGutters sx={{ height: 80, px: { xs: 2, md: 5 }, maxWidth: 1200, mx: 'auto', width: '100%' }}>
        <Typography
          variant="h6"
          sx={{
            flexGrow: 0,
            fontFamily: '"Hanken Grotesk", sans-serif',
            fontWeight: 700,
            fontSize: 24,
            color: 'primary.main',
            letterSpacing: '-0.02em',
          }}
        >
          {schoolName}
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        <Stack
          direction="row"
          spacing={4}
          sx={{ display: { xs: 'none', md: 'flex' }, mr: 4 }}
          alignItems="center"
        >
          {NAV_LINKS.map((link) => (
            <Box
              key={link.href}
              component="a"
              href={link.href}
              sx={{
                fontSize: 14,
                fontWeight: 600,
                color: 'text.secondary',
                textDecoration: 'none',
                transition: 'color 150ms ease',
                '&:hover': { color: 'primary.main' },
              }}
            >
              {link.label}
            </Box>
          ))}
        </Stack>

        <Button
          variant="contained"
          onClick={onLoginClick}
          sx={{
            borderRadius: 999,
            px: 3,
            py: 1.25,
            fontWeight: 700,
            fontSize: 14,
            boxShadow: '0px 2px 8px rgba(27, 101, 108, 0.18)',
          }}
        >
          Entrar
        </Button>
      </Toolbar>
    </AppBar>
  )
}
