import { useState } from 'react'
import { Box, Tab, Tabs } from '@mui/material'
import { PageHeader } from '@/components/common/PageHeader'
import { EnrollmentSubmissionsTab } from './components/EnrollmentSubmissionsTab'
import { EnrollmentFormTab } from './components/EnrollmentFormTab'

export function EnrollmentPage() {
  const [tab, setTab] = useState(0)

  return (
    <Box>
      <PageHeader
        title="Matrícula"
        subtitle="Acompanhe as respostas e cadastre novas matrículas"
        helpContent={{
          what: 'A tela de Matrícula tem duas abas. "Respostas" lista todos os alunos que preencheram o formulário de matrícula (público ou interno), com nome, CPF e a data/hora do envio. "Formulário" é o cadastro completo para matricular um aluno e gerar o contrato.',
          actions: [
            'Ver na aba Respostas quem enviou uma solicitação de matrícula e quando',
            'Filtrar as respostas por intervalo de datas e por nome/CPF do aluno',
            'Cadastrar uma nova matrícula pela aba Formulário (dados, plano, contrato)',
            'Anexar o contrato assinado em PDF ao matricular',
          ],
          tips: [
            'Cada resposta de matrícula (pública ou interna) gera automaticamente um registro na aba Respostas.',
            'Após matricular, aloque o aluno em uma turma na tela de Turmas.',
            'O card "Matrículas hoje" no Dashboard contabiliza as respostas do dia.',
          ],
          flow: 'Aluno preenche o formulário (público) → aparece na aba Respostas → Admin confirma / cadastra na aba Formulário → Contrato criado → Alocação em Turma.',
        }}
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Respostas" />
          <Tab label="Formulário" />
        </Tabs>
      </Box>

      {tab === 0 && <EnrollmentSubmissionsTab />}
      {tab === 1 && <EnrollmentFormTab />}
    </Box>
  )
}
