import { Box, Typography, Button } from '@mui/material'
import { Add } from '@mui/icons-material'
import { HelpOverlay, type HelpContent } from './HelpOverlay'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
  actionDisabled?: boolean
  helpContent?: HelpContent
}

export function PageHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  actionDisabled,
  helpContent,
}: PageHeaderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        flexDirection: 'column',
        gap: 1,
        mb: 3,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {helpContent && <HelpOverlay content={helpContent} />}
      </Box>
      {actionLabel && onAction && (
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={onAction}
          disabled={actionDisabled}
          size="small"
          sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  )
}
