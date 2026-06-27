import { useState } from 'react'
import { Box, Tab, Tabs } from '@mui/material'
import { PageHeader } from '@/components/common/PageHeader'
import { NpsResponsesTab } from './NpsResponsesTab'
import { NpsAnalyticsTab } from './NpsAnalyticsTab'
import { NpsTemplatesTab } from './NpsTemplatesTab'

export function NpsPage() {
  const [tab, setTab] = useState(0)

  return (
    <Box>
      <PageHeader
        title="NPS"
        subtitle="Pesquisa de satisfação anônima dos alunos"
        helpContent={{
          what: 'A tela de NPS gerencia pesquisas de satisfação anônimas. Você monta um questionário (template), divulga o link público e acompanha tanto as respostas individuais quanto a análise consolidada dos dados — tudo em uma só tela, dividida em abas.',
          actions: [
            'Aba "Respostas": ver cada resposta anônima, filtrando por campanha e por intervalo de data',
            'Aba "Análise": acompanhar o NPS consolidado, gráficos por pergunta, nuvem de palavras, sentimento e a evolução do NPS ao longo do tempo',
            'Aba "Template": criar e editar questionários com vários tipos de pergunta (NPS 0–10, estrelas, escala, escolha única/múltipla, texto) e ativar o que vai para o link público',
          ],
          tips: [
            'Só um template fica ativo por vez — é ele que aparece no link público (/nps).',
            'NPS = % de Promotores (notas 9–10) − % de Detratores (notas 0–6). Os Neutros (7–8) não entram na conta.',
            'Use "Mostrar só conforme a nota" para perguntar o motivo apenas a quem deu nota baixa (follow-up condicional).',
            'As respostas são 100% anônimas — nenhum dado pessoal é coletado do aluno.',
          ],
          flow: 'Crie um template (aba Template) → Ative-o → Compartilhe o link /nps (tela de Links) → Acompanhe em Respostas e Análise.',
        }}
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Respostas" />
          <Tab label="Análise" />
          <Tab label="Template" />
        </Tabs>
      </Box>

      {tab === 0 && <NpsResponsesTab />}
      {tab === 1 && <NpsAnalyticsTab />}
      {tab === 2 && <NpsTemplatesTab />}
    </Box>
  )
}
