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
            'Filtrar por intervalo de datas, por nome/CPF, por status (rematricularam ou não) e por "Só com conflito"',
            'Abrir os detalhes (ícone de olho) para ver as turmas atuais do aluno com dia/horário e a nova disponibilidade registrada',
            'Identificar conflitos entre a nova disponibilidade e as turmas em que o aluno já está',
            'Gerenciar as turmas do aluno direto no modal de detalhes: remover das turmas atuais (inclusive a que gera conflito) e adicioná-lo em uma ou mais turmas sugeridas de uma vez',
            'Rematricular um aluno pela aba Formulário',
          ],
          tips: [
            'A coluna "Conflitos" mostra "Conflito" quando alguma turma atual do aluno não cabe na nova disponibilidade. Ela é recalculada ao vivo: ao realocar o aluno para uma turma compatível, o selo muda para "Resolvido".',
            'Use o filtro "Só com conflito" para focar nos alunos que ainda precisam de realocação.',
            'No modal de detalhes, a lista de turmas sugere as compatíveis com a disponibilidade do aluno — e também com o nível dele, quando houver nivelamento registrado (sem nivelamento, sugere só por horário).',
            'Quem marca "Não quero renovar" no formulário público é inativado e removido das turmas automaticamente, e aparece aqui com ✗.',
            'O card "Rematrículas hoje" no Dashboard contabiliza as respostas do dia.',
          ],
          flow: 'Aluno responde o formulário (público) → aparece na aba Respostas com status e conflito → Admin abre o modal e aloca em uma turma sugerida → o conflito passa a "Resolvido".',
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
