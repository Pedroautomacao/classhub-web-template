import {
  Box, Paper, Stack, Typography, TextField, IconButton, Tooltip, Divider, InputAdornment,
} from '@mui/material'
import { ContentCopy, Link as LinkIcon } from '@mui/icons-material'
import { PageHeader } from '@/components/common/PageHeader'
import { useSnackbarStore } from '@/store/snackbar.store'

const LINKS = [
  {
    label: 'Formulário de Matrícula',
    description: 'Envie para novos alunos que desejam se matricular.',
    path: '/enrollment',
  },
  {
    label: 'Formulário de Rematrícula',
    description: 'Envie para alunos que desejam renovar o contrato.',
    path: '/re-enrollment',
  },
  {
    label: 'Formulário de Nivelamento',
    description: 'Envie para candidatos que querem fazer o nivelamento gratuito.',
    path: '/leveling',
  },
  {
    label: 'Pesquisa de NPS',
    description: 'Pesquisa de satisfação anônima — envie para os alunos responderem.',
    path: '/nps',
  },
]

export function ShareableLinksPage() {
  const { show } = useSnackbarStore()
  const origin = window.location.origin

  const copyLink = (path: string) => {
    navigator.clipboard.writeText(`${origin}${path}`)
    show('Link copiado!')
  }

  return (
    <Box>
      <PageHeader
        title="Links Compartilháveis"
        subtitle="Compartilhe estes links com os alunos para preenchimento dos formulários sem necessidade de login"
        helpContent={{
          what: 'Esta tela centraliza todos os links públicos do sistema — formulários e landing page — prontos para serem copiados e enviados a candidatos ou alunos sem que eles precisem ter acesso ao painel administrativo.',
          actions: [
            'Copiar o link do formulário de Nivelamento para enviar a novos candidatos',
            'Copiar o link do formulário de Matrícula para novos alunos preencherem os dados',
            'Copiar o link de Rematrícula para alunos que estão renovando',
            'Acessar a landing page pública da escola',
          ],
          tips: [
            'Esses links funcionam em qualquer dispositivo, sem login — perfeito para enviar por WhatsApp.',
            'O link de Nivelamento pode ser a primeira etapa do funil: candidato preenche → você analisa → converte para matrícula.',
          ],
          flow: 'Copie o link aqui → Envie ao candidato/aluno → Formulário preenchido aparece nos respectivos módulos do admin.',
        }}
      />

      <Paper sx={{ p: { xs: 3, md: 4 }, maxWidth: 700 }}>
        <Stack spacing={3}>
          {LINKS.map(({ label, description, path }, index) => (
            <Box key={path}>
              {index > 0 && <Divider sx={{ mb: 3 }} />}
              <Stack spacing={1}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <LinkIcon fontSize="small" color="primary" />
                  <Typography variant="subtitle2" fontWeight={600}>
                    {label}
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {description}
                </Typography>
                <TextField
                  value={`${origin}${path}`}
                  fullWidth
                  size="small"
                  slotProps={{
                    input: {
                      readOnly: true,
                      sx: { fontFamily: 'monospace', fontSize: 13 },
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Copiar link">
                            <IconButton size="small" onClick={() => copyLink(path)}>
                              <ContentCopy fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Stack>
            </Box>
          ))}
        </Stack>
      </Paper>
    </Box>
  )
}
