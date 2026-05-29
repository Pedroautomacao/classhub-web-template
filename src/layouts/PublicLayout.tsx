import { Outlet } from 'react-router-dom'
import { Box } from '@mui/material'
import { DemoBanner } from '@/components/common/DemoBanner'

export function PublicLayout() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <DemoBanner />
      <Outlet />
    </Box>
  )
}
