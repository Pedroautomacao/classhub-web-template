import { useState, useEffect } from 'react'
import { Alert, AlertTitle, Button, CircularProgress, Collapse, Typography } from '@mui/material'
import { RestartAlt } from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import { demoApi } from '@/api/demo.api'

const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true'

function useCountdown(target: string | null) {
  const [label, setLabel] = useState<string | null>(null)

  useEffect(() => {
    if (!target) return
    const tick = () => {
      const diff = new Date(target).getTime() - Date.now()
      if (diff <= 0) { setLabel('em breve'); return }
      const h = Math.floor(diff / 3_600_000)
      const m = Math.floor((diff % 3_600_000) / 60_000)
      const s = Math.floor((diff % 60_000) / 1_000)
      setLabel(`${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`)
    }
    tick()
    const id = setInterval(tick, 1_000)
    return () => clearInterval(id)
  }, [target])

  return label
}

export function DemoBanner() {
  const [resetting, setResetting] = useState(false)

  const { data: status, refetch } = useQuery({
    queryKey: ['demo-status'],
    queryFn: () => demoApi.status().then((r) => r.data),
    enabled: IS_DEMO,
    refetchInterval: 60_000,
  })

  const countdown = useCountdown(status?.next_reset_at ?? null)

  if (!IS_DEMO) return null

  const handleReset = async () => {
    if (!confirm('Isso vai apagar todas as alterações e restaurar os dados de demonstração. Confirmar?')) return
    setResetting(true)
    try {
      await demoApi.reset()
      await refetch()
      window.location.reload()
    } catch {
      alert('Erro ao resetar os dados. Verifique o token de reset.')
    } finally {
      setResetting(false)
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
          '& .MuiAlert-message': {
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
          },
        }}
        action={
          <Button
            size="small"
            variant="outlined"
            color="warning"
            startIcon={resetting ? <CircularProgress size={14} color="inherit" /> : <RestartAlt />}
            onClick={handleReset}
            disabled={resetting}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Resetar dados
          </Button>
        }
      >
        <div>
          <AlertTitle sx={{ mb: 0, fontSize: 13 }}>Ambiente de Demonstração</AlertTitle>
          <Typography variant="caption" color="text.secondary">
            Explore à vontade — todos os dados podem ser alterados e restaurados.
            {countdown && (
              <> &nbsp;·&nbsp; Reset automático em: <strong>{countdown}</strong></>
            )}
          </Typography>
        </div>
      </Alert>
    </Collapse>
  )
}
