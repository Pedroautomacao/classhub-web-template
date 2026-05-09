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
        helpContent={{
          what: 'O Portal do Professor é o espaço exclusivo para que cada professor acompanhe suas turmas, registre as aulas realizadas e mantenha seu perfil atualizado. O acesso às funcionalidades exige que o usuário logado esteja vinculado a um cadastro de professor.',
          actions: [
            'Visualizar suas turmas no calendário semanal ou em cards',
            'Clicar em uma turma para ver detalhes: alunos, horários e link da aula',
            'Salvar ou remover o link de videoconferência (Meet, Zoom…) de cada turma',
            'Registrar fechamentos de horas com as aulas lecionadas no período',
            'Incluir aulas avulsas e reuniões no fechamento de horas',
            'Acompanhar o status dos fechamentos (pendente, aprovado, rejeitado)',
            'Cancelar fechamentos pendentes antes da revisão da administração',
            'Editar seu e-mail, telefone e disponibilidade semanal no Meu Perfil',
          ],
          tips: [
            'O calendário abre automaticamente no horário atual — role para cima ou para baixo para ver outros horários.',
            'A linha vermelha indica o horário atual; o dia de hoje aparece destacado.',
            'Ao editar o e-mail no Meu Perfil, o vínculo com seu usuário é mantido automaticamente.',
            'Fechamentos só podem ser editados ou cancelados enquanto estiverem com status "Pendente".',
            'Se aparecer o aviso "usuário não vinculado", entre em contato com a administração para associar seu usuário ao cadastro de professor.',
          ],
          flow: 'Acesso ao portal → Minhas Turmas (visualizar calendário e links) → Fechamento de Horas (registrar aulas do período) → Aguardar aprovação da administração → Meu Perfil (manter dados atualizados)',
        }}
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
