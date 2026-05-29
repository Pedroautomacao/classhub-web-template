import { Box, Container, Stack, Typography, IconButton } from '@mui/material'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import InstagramIcon from '@mui/icons-material/Instagram'
import { luminaPalette } from '@/theme/luminaAcademic'

interface LandingFooterProps {
  schoolName: string
  whatsapp: string | null
  instagram: string | null
}

export function LandingFooter({ schoolName, whatsapp, instagram }: LandingFooterProps) {
  const year = new Date().getFullYear()

  return (
    <Box component="footer" sx={{ bgcolor: luminaPalette.neutral.surfaceHighest }}>
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems="center"
          justifyContent="space-between"
          spacing={4}
        >
          <Stack spacing={1} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
            <Typography
              sx={{
                fontFamily: '"Hanken Grotesk", sans-serif',
                fontWeight: 700,
                fontSize: 24,
                color: 'primary.main',
              }}
            >
              {schoolName}
            </Typography>
            <Typography sx={{ color: 'text.secondary', maxWidth: 320, lineHeight: 1.6 }}>
              © {year} {schoolName}. Excelência acadêmica em idiomas.
            </Typography>
          </Stack>

          <Stack
            direction="row"
            spacing={4}
            flexWrap="wrap"
            justifyContent="center"
            sx={{ rowGap: 1 }}
          >
            {whatsapp && (
              <Box
                component="a"
                href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'text.secondary',
                  textDecoration: 'none',
                  transition: 'color 150ms ease',
                  '&:hover': { color: luminaPalette.tertiary.main },
                }}
              >
                WhatsApp
              </Box>
            )}
            {instagram && (
              <Box
                component="a"
                href={`https://instagram.com/${instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'text.secondary',
                  textDecoration: 'none',
                  transition: 'color 150ms ease',
                  '&:hover': { color: luminaPalette.tertiary.main },
                }}
              >
                Instagram
              </Box>
            )}
          </Stack>

          {(whatsapp || instagram) && (
            <Stack direction="row" spacing={1.5}>
              {whatsapp && (
                <IconButton
                  component="a"
                  href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: luminaPalette.neutral.surfaceHigh,
                    color: 'text.primary',
                    '&:hover': { bgcolor: 'primary.main', color: 'primary.contrastText' },
                  }}
                >
                  <WhatsAppIcon />
                </IconButton>
              )}
              {instagram && (
                <IconButton
                  component="a"
                  href={`https://instagram.com/${instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: luminaPalette.neutral.surfaceHigh,
                    color: 'text.primary',
                    '&:hover': { bgcolor: 'primary.main', color: 'primary.contrastText' },
                  }}
                >
                  <InstagramIcon />
                </IconButton>
              )}
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  )
}
