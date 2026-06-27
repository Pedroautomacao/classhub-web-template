import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Box, Tab, Tabs } from '@mui/material'
import { LevelingListPage } from './LevelingListPage'
import { LevelingTemplatesPage } from '../leveling-templates/LevelingTemplatesPage'

export function LevelingPage() {
  const location = useLocation()
  const initialTab = (location.state as { tab?: number } | null)?.tab
  const [tab, setTab] = useState(initialTab ?? 0)

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Respostas" />
          <Tab label="Templates" />
        </Tabs>
      </Box>

      {tab === 0 && <LevelingListPage />}
      {tab === 1 && <LevelingTemplatesPage />}
    </Box>
  )
}
