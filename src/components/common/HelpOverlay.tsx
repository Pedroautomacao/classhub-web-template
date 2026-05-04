import { useState } from 'react'
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  Button,
} from '@mui/material'
import {
  Close,
  HelpOutline,
  CheckCircleOutline,
  TipsAndUpdates,
  AccountTree,
} from '@mui/icons-material'

export interface HelpContent {
  what: string
  actions: string[]
  tips?: string[]
  flow?: string
}

interface HelpOverlayProps {
  content: HelpContent
}

export function HelpOverlay({ content }: HelpOverlayProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        size="small"
        variant="outlined"
        color="info"
        startIcon={<HelpOutline fontSize="small" />}
        onClick={() => setOpen(true)}
        sx={{ whiteSpace: 'nowrap', fontSize: 12 }}
      >
        Mais detalhes
      </Button>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 400 }, p: 0 } }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            py: 2,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HelpOutline />
            <Typography variant="subtitle1" fontWeight={700}>
              Sobre esta tela
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'inherit' }}>
            <Close />
          </IconButton>
        </Box>

        <Box sx={{ p: 3, overflow: 'auto', flex: 1 }}>
          <Box mb={3}>
            <Chip label="O que é esta tela" size="small" color="primary" variant="outlined" sx={{ mb: 1 }} />
            <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
              {content.what}
            </Typography>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Box mb={3}>
            <Chip label="O que você pode fazer aqui" size="small" color="success" variant="outlined" sx={{ mb: 1 }} />
            <List dense disablePadding>
              {content.actions.map((action, i) => (
                <ListItem key={i} disableGutters sx={{ alignItems: 'flex-start', py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 28, mt: 0.3 }}>
                    <CheckCircleOutline fontSize="small" color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary={action}
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary', lineHeight: 1.6 }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          {content.tips && content.tips.length > 0 && (
            <>
              <Divider sx={{ mb: 3 }} />
              <Box mb={3}>
                <Chip label="Dicas de uso" size="small" color="warning" variant="outlined" sx={{ mb: 1 }} />
                <List dense disablePadding>
                  {content.tips.map((tip, i) => (
                    <ListItem key={i} disableGutters sx={{ alignItems: 'flex-start', py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 28, mt: 0.3 }}>
                        <TipsAndUpdates fontSize="small" color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={tip}
                        primaryTypographyProps={{ variant: 'body2', color: 'text.secondary', lineHeight: 1.6 }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </>
          )}

          {content.flow && (
            <>
              <Divider sx={{ mb: 3 }} />
              <Box>
                <Chip label="Fluxo sugerido" size="small" color="info" variant="outlined" sx={{ mb: 1 }} />
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <AccountTree fontSize="small" color="info" sx={{ mt: 0.3, flexShrink: 0 }} />
                  <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
                    {content.flow}
                  </Typography>
                </Box>
              </Box>
            </>
          )}
        </Box>
      </Drawer>
    </>
  )
}
