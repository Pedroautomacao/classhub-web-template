import { useState } from 'react'
import { Box, Tab, Tabs } from '@mui/material'
import { Class as ClassIcon, AccessTime, AccountCircle } from '@mui/icons-material'
import { PageHeader } from '@/components/common/PageHeader'
import { TeacherClassesTab } from './components/TeacherClassesTab'
import { HourClosingsTab } from './components/HourClosingsTab'
import { TeacherProfileTab } from './components/TeacherProfileTab'

export function TeacherPortalPage() {
  const [tab, setTab] = useState(0)

  return (
    <Box>
      <PageHeader
        title="Portal do Professor"
        subtitle="Suas turmas, fechamentos de horas e perfil"
      />
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab icon={<ClassIcon />} iconPosition="start" label="Minhas Turmas" />
          <Tab icon={<AccessTime />} iconPosition="start" label="Fechamento de Horas" />
          <Tab icon={<AccountCircle />} iconPosition="start" label="Meu Perfil" />
        </Tabs>
      </Box>
      {tab === 0 && <TeacherClassesTab />}
      {tab === 1 && <HourClosingsTab />}
      {tab === 2 && <TeacherProfileTab />}
    </Box>
  )
}
