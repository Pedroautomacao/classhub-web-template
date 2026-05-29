import { useState } from 'react'
import {
  AppBar,
  Toolbar,
  Box,
  Stack,
  Button,
  Typography,
  IconButton,
  Drawer,
  useScrollTrigger,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import { luminaPalette } from '@/theme/luminaAcademic'

interface LandingNavbarProps {
  schoolName: string
  onLoginClick: () => void
}

const NAV_LINKS = [
  { label: 'Cursos', href: '#planos' },
  { label: 'Metodologia', href: '#metodologia' },
  { label: 'Planos', href: '#planos' },
  { label: 'Contato', href: '#contato' },
]

export function LandingNavbar({ schoolName, onLoginClick }: LandingNavbarProps) {
  const elevated = useScrollTrigger({ disableHysteresis: true, threshold: 24 })
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleNavClick = (href: string) => {
    setDrawerOpen(false)
    // Pequeno delay pra fechar o drawer antes do scroll
    setTimeout(() => {
      const el = document.querySelector(href)
      el?.scrollIntoView({ behavior: 'smooth' })
    }, 200)
  }

  const handleLoginClick = () => {
    setDrawerOpen(false)
    onLoginClick()
  }

  return (
    <>
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
        <Toolbar
          disableGutters
          sx={{
            height: { xs: 64, md: 80 },
            px: { xs: 2, md: 5, lg: 8 },
            width: '100%',
          }}
        >
          {/* 3 áreas equally weighted: brand esquerda / menus centro / CTA direita.
              Em mobile (xs/sm) o brand fica colado na esquerda e o hamburger
              substitui menus+CTA. */}
          <Box sx={{ flex: { xs: '0 0 auto', md: 1 }, display: 'flex', justifyContent: 'flex-start' }}>
            <Typography
              variant="h6"
              sx={{
                fontFamily: '"Hanken Grotesk", sans-serif',
                fontWeight: 700,
                fontSize: { xs: 22, md: 24 },
                color: 'primary.main',
                letterSpacing: '-0.02em',
              }}
            >
              {schoolName}
            </Typography>
          </Box>

          <Stack
            direction="row"
            spacing={4}
            sx={{ flex: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}
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

          <Box sx={{ flex: { xs: 1, md: 1 }, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={onLoginClick}
              sx={{
                display: { xs: 'none', md: 'inline-flex' },
                borderRadius: 999,
                px: 3,
                py: 1.25,
                fontWeight: 700,
                fontSize: 14,
                boxShadow: '0px 2px 8px rgba(27, 101, 108, 0.18)',
                whiteSpace: 'nowrap',
              }}
            >
              Entrar como Administrador
            </Button>

            <IconButton
              aria-label="Abrir menu"
              edge="end"
              onClick={() => setDrawerOpen(true)}
              sx={{ display: { xs: 'inline-flex', md: 'none' }, color: 'primary.main' }}
            >
              <MenuIcon sx={{ fontSize: 32 }} />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{ paper: { sx: { width: '100%', bgcolor: luminaPalette.neutral.bg, p: 2 } } }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 6 }}>
          <Typography
            sx={{
              fontFamily: '"Hanken Grotesk", sans-serif',
              fontWeight: 700,
              fontSize: 24,
              color: 'primary.main',
            }}
          >
            {schoolName}
          </Typography>
          <IconButton aria-label="Fechar menu" onClick={() => setDrawerOpen(false)}>
            <CloseIcon sx={{ fontSize: 32 }} />
          </IconButton>
        </Stack>

        <Stack spacing={4} sx={{ flexGrow: 1 }}>
          {NAV_LINKS.map((link) => (
            <Box
              key={link.href}
              component="button"
              onClick={() => handleNavClick(link.href)}
              sx={{
                appearance: 'none',
                background: 'none',
                border: 'none',
                p: 0,
                textAlign: 'left',
                cursor: 'pointer',
                fontFamily: '"Hanken Grotesk", sans-serif',
                fontWeight: 600,
                fontSize: 24,
                color: 'text.secondary',
                transition: 'color 150ms ease',
                '&:hover': { color: 'primary.main' },
                '&:active': { color: 'primary.main' },
              }}
            >
              {link.label}
            </Box>
          ))}
        </Stack>

        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={handleLoginClick}
          sx={{ mt: 'auto', mb: 4, borderRadius: 2, py: 1.75, fontWeight: 700 }}
        >
          Entrar como Administrador
        </Button>
      </Drawer>
    </>
  )
}
