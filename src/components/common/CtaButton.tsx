import { Fab, Tooltip } from '@mui/material'
import { WhatsApp } from '@mui/icons-material'

const WHATSAPP_NUMBER = import.meta.env.VITE_CTA_WHATSAPP ?? ''
const CTA_MESSAGE = encodeURIComponent(
  'Olá! Vi o sistema ClassHub e gostaria de saber mais sobre como contratá-lo para minha escola.'
)

export function CtaButton() {
  if (!WHATSAPP_NUMBER) return null

  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${CTA_MESSAGE}`

  return (
    <Tooltip title="Quero para minha escola" placement="left">
      <Fab
        color="success"
        component="a"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1300,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        <WhatsApp />
      </Fab>
    </Tooltip>
  )
}
