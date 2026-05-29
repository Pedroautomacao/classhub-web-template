import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Box, Container } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { AdminBreadcrumbs } from '@/components/layout/AdminBreadcrumbs'
import { AppSnackbar } from '@/components/common/AppSnackbar'
import { DemoBanner } from '@/components/common/DemoBanner'
import { CtaButton } from '@/components/common/CtaButton'
import { settingsApi } from '@/api/settings.api'

const DRAWER_WIDTH = 240

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopOpen, setDesktopOpen] = useState(true)

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
    staleTime: 5 * 60 * 1000,
  })

  const schoolName = settings?.school_name

  const handleMenuClick = () => {
    setMobileOpen((v) => !v)
    setDesktopOpen((v) => !v)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <DemoBanner />
      <Box sx={{ display: 'flex', flex: 1 }}>
      <Topbar onMenuClick={handleMenuClick} title={schoolName} />
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        desktopOpen={desktopOpen}
        schoolName={schoolName}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          // Fundo do admin propositalmente um tom levemente colorido pra
          // contrastar com o Paper/Card (#ffffff) das tabelas — antes era
          // 'background.default' (cinza quase branco) e os cabeçalhos das
          // tabelas sumiam contra o fundo.
          bgcolor: (theme) => theme.palette.mode === 'dark' ? '#14111f' : '#f0f7f9',
          minHeight: '100vh',
          ml: { md: desktopOpen ? `${DRAWER_WIDTH}px` : 0 },
          mt: '64px',
          transition: 'margin 0.2s ease',
        }}
      >
        <Container maxWidth="xl" sx={{ py: 3 }}>
          <AdminBreadcrumbs />
          <Outlet />
        </Container>
      </Box>
      <AppSnackbar />
      <CtaButton />
      </Box>
    </Box>
  )
}
