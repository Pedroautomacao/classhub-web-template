import { Fab, Zoom } from '@mui/material'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'

interface WhatsAppFabProps {
  whatsapp: string | null
  schoolName: string
}

/**
 * Botão flutuante de contato via WhatsApp.
 * Visível apenas em mobile/tablet (`xs/sm/md`) — em desktop o usuário já tem
 * os CTAs dos planos com link direto pro WhatsApp.
 */
export function WhatsAppFab({ whatsapp, schoolName }: WhatsAppFabProps) {
  if (!whatsapp) return null

  const number = whatsapp.replace(/\D/g, '')
  const message = encodeURIComponent(`Olá ${schoolName}, gostaria de mais informações.`)
  const link = `https://wa.me/${number}?text=${message}`

  return (
    <Zoom in>
      <Fab
        component="a"
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        color="secondary"
        aria-label="Conversar no WhatsApp"
        sx={{
          position: 'fixed',
          bottom: { xs: 16, md: 24 },
          right: { xs: 16, md: 24 },
          display: { xs: 'inline-flex', lg: 'none' },
          width: 56,
          height: 56,
          boxShadow: '0px 12px 30px rgba(0,0,0,0.18)',
          zIndex: 40,
        }}
      >
        <WhatsAppIcon sx={{ fontSize: 28 }} />
      </Fab>
    </Zoom>
  )
}
