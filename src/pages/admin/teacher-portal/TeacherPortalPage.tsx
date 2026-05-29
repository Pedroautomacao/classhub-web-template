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
        subtitle="Suas turmas, folha de ponto e perfil"
        helpContent={{
          what: 'O Portal do Professor é o espaço exclusivo para que cada professor acompanhe suas turmas, registre as aulas realizadas e mantenha seu perfil atualizado. O fluxo de fechamento de horas é dividido em duas sub-abas: "Folha de ponto" (registros individuais de aulas que viram rascunhos) e "Envios" (lotes submetidos para aprovação da administração). O acesso ao portal exige que o usuário logado esteja vinculado a um cadastro de professor.',
          actions: [
            'Visualizar suas turmas no calendário semanal ou em cards',
            'Clicar em uma turma para ver detalhes: alunos, horários e link da aula',
            'Salvar ou remover o link de videoconferência (Meet, Zoom…) de cada turma',
            'Registrar cada aula lecionada como um item da Folha de ponto (rascunho)',
            'Editar ou apagar rascunhos individualmente antes de submetê-los',
            'Selecionar vários rascunhos e enviá-los de uma vez via "Submeter em massa"',
            'Filtrar a submissão em massa por mês/ano (com base na data da aula)',
            'Acompanhar cada envio na aba "Envios" (pendente, aprovado, rejeitado, cancelado)',
            'Editar um envio enquanto ele estiver pendente (trocar registros incluídos / notas)',
            'Cancelar envios pendentes — os registros voltam a ser rascunhos',
            'Ler a justificativa da administração quando um envio for rejeitado',
            'Editar seu e-mail, telefone e disponibilidade semanal no Meu Perfil',
          ],
          tips: [
            'O calendário abre automaticamente no horário atual — role para cima ou para baixo para ver outros horários.',
            'A linha vermelha indica o horário atual; o dia de hoje aparece destacado.',
            'Ao editar o e-mail no Meu Perfil, o vínculo com seu usuário é mantido automaticamente.',
            'A taxa horária do envio é "congelada" (snapshot) no momento em que cada registro é criado — se a administração reajustar sua taxa depois, envios anteriores mantêm o valor original.',
            'Envios só podem ser editados ou cancelados enquanto estiverem com status "Pendente". Depois de aprovados ou rejeitados ficam imutáveis.',
            'Se um envio for rejeitado, os registros voltam para a Folha de ponto como rascunhos — corrija e submeta de novo.',
            'Se aparecer o aviso "usuário não vinculado", entre em contato com a administração para associar seu usuário ao cadastro de professor.',
          ],
          flow: 'Acesso ao portal → Minhas Turmas (visualizar calendário e links) → Folha de ponto (registrar aulas como rascunho) → Submeter em massa (agrupar rascunhos em um envio) → Envios (acompanhar status / ler resposta da administração) → Meu Perfil (manter dados atualizados)',
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
