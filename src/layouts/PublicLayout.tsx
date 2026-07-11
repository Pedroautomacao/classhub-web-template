import { Outlet } from 'react-router-dom'
import { Box } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import { buildTheme } from '@/theme'
import { DemoBanner } from '@/components/common/DemoBanner'
import { CtaButton } from '@/components/common/CtaButton'

const publicTheme = buildTheme('light')

export function PublicLayout() {
  return (
    <ThemeProvider theme={publicTheme}>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <DemoBanner />
        <Outlet />
        <CtaButton />
      </Box>
    </ThemeProvider>
  )
}
