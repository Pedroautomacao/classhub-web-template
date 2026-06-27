import { useLocation, Link as RouterLink } from 'react-router-dom'
import { Breadcrumbs, Link, Typography } from '@mui/material'
import { NavigateNext } from '@mui/icons-material'

const ROUTE_LABELS: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/dashboard': 'Dashboard',
  '/admin/students': 'Alunos',
  '/admin/teachers': 'Professores',
  '/admin/classes': 'Turmas',
  '/admin/contracts': 'Contratos',
  '/admin/plans': 'Planos',
  '/admin/leveling': 'Nivelamento',
  '/admin/nps': 'NPS',
  '/admin/enrollment': 'Nova Matrícula',
  '/admin/re-enrollment': 'Rematrícula',
  '/admin/users': 'Usuários',
  '/admin/settings': 'Configurações',
}

export function AdminBreadcrumbs() {
  const { pathname } = useLocation()
  const label = ROUTE_LABELS[pathname]

  if (!label || pathname === '/admin' || pathname === '/admin/dashboard') return null

  return (
    <Breadcrumbs
      separator={<NavigateNext fontSize="small" />}
      sx={{ mb: 2, fontSize: 13 }}
    >
      <Link
        component={RouterLink}
        to="/admin/dashboard"
        underline="hover"
        color="text.secondary"
        fontSize={13}
      >
        Início
      </Link>
      <Typography fontSize={13} color="text.primary" fontWeight={500}>
        {label}
      </Typography>
    </Breadcrumbs>
  )
}
