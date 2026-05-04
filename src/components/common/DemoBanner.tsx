import { useState } from 'react'
import { Alert, AlertTitle, Button, CircularProgress, Collapse } from '@mui/material'
import { RestartAlt } from '@mui/icons-material'
import { demoApi } from '@/api/demo.api'

const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true'

export function DemoBanner() {
  const [loading, setLoading] = useState(false)
  const [lastReset, setLastReset] = useState<string | null>(null)

  if (!IS_DEMO) return null

  const handleReset = async () => {
    if (!confirm('Isso vai apagar todas as alterações e restaurar os dados de demonstração. Confirmar?')) return
    setLoading(true)
    try {
      const { data } = await demoApi.reset()
      setLastReset(new Date(data.reset_at).toLocaleTimeString('pt-BR'))
      window.location.reload()
    } catch {
      alert('Erro ao resetar os dados. Verifique o token de reset.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Collapse in>
      <Alert
        severity="warning"
        icon={false}
        sx={{
          borderRadius: 0,
          py: 0.5,
          px: 2,
          '& .MuiAlert-message': { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
        }}
        action={
          <Button
            size="small"
            variant="outlined"
            color="warning"
            startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <RestartAlt />}
            onClick={handleReset}
            disabled={loading}
            sx={{ whiteSpace: 'nowrap', ml: 2 }}
          >
            Resetar dados
          </Button>
        }
      >
        <AlertTitle sx={{ mb: 0, fontSize: 13 }}>
          Ambiente de Demonstração
          {lastReset && ` — último reset: ${lastReset}`}
        </AlertTitle>
        Você pode explorar todas as funcionalidades. Dados podem ser alterados e restaurados a qualquer momento.
      </Alert>
    </Collapse>
  )
}
