import { useState } from 'react'
import { Box, Tab, Tabs } from '@mui/material'
import { PageHeader } from '@/components/common/PageHeader'
import { ReEnrollmentSubmissionsTab } from './components/ReEnrollmentSubmissionsTab'
import { ReEnrollmentFormTab } from './components/ReEnrollmentFormTab'

export function ReEnrollmentPage() {
  const [tab, setTab] = useState(0)

  return (
    <Box>
      <PageHeader
        title="Rematrícula"
        subtitle="Acompanhe as renovações e rematricule alunos"
        helpContent={{
          what: 'A tela de Rematrícula tem duas abas. "Respostas" lista os alunos que responderam ao formulário de rematrícula, mostrando quem renovou (✓) e quem marcou que não vai renovar (✗), a data/hora e se a nova disponibilidade gera conflito com as turmas atuais do aluno. "Formulário" reativa um aluno e cria um novo contrato.',
          actions: [
            'Ver quem renovou e quem optou por não renovar a matrícula',
            'Filtrar por intervalo de datas, por nome/CPF e por status (rematricularam ou não)',
            'Abrir os detalhes (ícone de olho) para ver as turmas atuais do aluno com dia/horário e a nova disponibilidade registrada',
            'Identificar rapidamente conflitos entre a nova disponibilidade e as turmas em que o aluno já está',
            'Rematricular um aluno pela aba Formulário',
          ],
          tips: [
            'A coluna "Conflitos" marca "Conflito" quando alguma turma atual do aluno não cabe mais na nova disponibilidade que ele enviou — reavalie a alocação dele.',
            'Quem marca "Não quero renovar" no formulário público é inativado e removido das turmas automaticamente, e aparece aqui com ✗.',
            'O card "Rematrículas hoje" no Dashboard contabiliza as respostas do dia.',
          ],
          flow: 'Aluno responde o formulário de rematrícula (público) → aparece na aba Respostas (com status e conflitos) → Admin reavalia turmas se houver conflito.',
        }}
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Respostas" />
          <Tab label="Formulário" />
        </Tabs>
      </Box>

      {tab === 0 && <ReEnrollmentSubmissionsTab />}
      {tab === 1 && <ReEnrollmentFormTab />}
    </Box>
  )
}
