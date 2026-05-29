import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material'
import { AdminPanelSettings, School } from '@mui/icons-material'
import { LoginDialog } from '@/components/auth/LoginDialog'
import { DemoBanner } from '@/components/common/DemoBanner'
import { CtaButton } from '@/components/common/CtaButton'

export function PublicLayout() {
  const [loginOpen, setLoginOpen] = useState(false)

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <DemoBanner />
      <AppBar position="sticky" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar>
          <School sx={{ fontSize: 32, mr: 1.5, color: 'white' }} />
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1, color: 'white' }}>
            ClassHub
          </Typography>
          <Button
            color="inherit"
            startIcon={<AdminPanelSettings />}
            onClick={() => setLoginOpen(true)}
            sx={{ fontWeight: 600 }}
          >
            Entrar como Administrador
          </Button>
        </Toolbar>
      </AppBar>

      <Outlet />

      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
      <CtaButton />
    </Box>
  )
}
