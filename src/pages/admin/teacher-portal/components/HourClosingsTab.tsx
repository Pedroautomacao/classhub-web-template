import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Alert, Box, CircularProgress, Tab, Tabs } from '@mui/material'
import { EventNote, Send, InfoOutlined } from '@mui/icons-material'
import { teachersApi } from '@/api/teachers.api'
import { PunchCardTab } from './PunchCardTab'
import { SubmissionsTab } from './SubmissionsTab'

export function HourClosingsTab() {
  const [subTab, setSubTab] = useState(0)

  const { isLoading: checkingTeacher, isError: notTeacher } = useQuery({
    queryKey: ['my-profile'],
    queryFn: teachersApi.getMe,
    retry: false,
  })

  if (checkingTeacher) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>
  }

  if (notTeacher) {
    return (
      <Alert severity="info" icon={<InfoOutlined />} sx={{ maxWidth: 520 }}>
        Seu usuário não está vinculado a um cadastro de professor. Entre em contato com a administração
        para ter acesso a esta funcionalidade.
      </Alert>
    )
  }

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={subTab} onChange={(_, v) => setSubTab(v)}>
          <Tab icon={<EventNote fontSize="small" />} iconPosition="start" label="Folha de ponto" />
          <Tab icon={<Send fontSize="small" />} iconPosition="start" label="Envios" />
        </Tabs>
      </Box>
      {subTab === 0 && <PunchCardTab />}
      {subTab === 1 && <SubmissionsTab />}
    </Box>
  )
}
