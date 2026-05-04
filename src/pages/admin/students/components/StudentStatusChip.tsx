import { Chip } from '@mui/material'
import type { StudentStatus } from '@/types'

interface Props {
  status: StudentStatus
}

export function StudentStatusChip({ status }: Props) {
  return (
    <Chip
      label={status === 'active' ? 'Ativo' : 'Inativo'}
      color={status === 'active' ? 'success' : 'default'}
      size="small"
      variant="outlined"
    />
  )
}
