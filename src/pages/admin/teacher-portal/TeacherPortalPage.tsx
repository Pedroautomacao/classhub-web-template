import { useState } from 'react'
import { Box, Tab, Tabs } from '@mui/material'
import { Class as ClassIcon, AccessTime } from '@mui/icons-material'
import { PageHeader } from '@/components/common/PageHeader'
import { TeacherClassesTab } from './components/TeacherClassesTab'
import { HourClosingsTab } from './components/HourClosingsTab'

export function TeacherPortalPage() {
  const [tab, setTab] = useState(0)

  return (
    <Box>
      <PageHeader
        title="Portal do Professor"
        subtitle="Suas turmas e solicitações de fechamento de horas"
        helpContent={{
          what: 'O Portal do Professor é a área self-service onde professores acompanham suas turmas e submetem solicitações de fechamento de horas trabalhadas para aprovação administrativa.',
          actions: [
            'Ver todas as turmas às quais você está vinculado',
            'Editar o link de reunião online das suas turmas',
            'Submeter fechamentos de horas com período trabalhado e informações da turma',
            'Acompanhar o status das solicitações enviadas (pendente, aprovado, rejeitado)',
            'Cancelar solicitações pendentes antes da aprovação',
          ],
          tips: [
            'O valor sugerido do fechamento é calculado automaticamente com base nas aulas do período × sua taxa horária.',
            'Após aprovação, o valor final pode ser ajustado pelo administrador antes do pagamento.',
            'Mantenha o link de reunião sempre atualizado para facilitar o acesso dos alunos.',
          ],
          flow: 'Professor acessa o Portal → Vê suas Turmas → Submete Fechamento de Horas → Admin aprova/reprova em Professores.',
        }}
      />
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab icon={<ClassIcon />} iconPosition="start" label="Minhas Turmas" />
          <Tab icon={<AccessTime />} iconPosition="start" label="Fechamento de Horas" />
        </Tabs>
      </Box>
      {tab === 0 && <TeacherClassesTab />}
      {tab === 1 && <HourClosingsTab />}
    </Box>
  )
}
