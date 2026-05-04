import { useLocation, useNavigate } from 'react-router-dom'
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
} from '@mui/material'
import {
  Dashboard,
  People,
  School,
  Class,
  Description,
  CardMembership,
  Assignment,
  HowToReg,
  ManageAccounts,
  Settings,
  Link as LinkIcon,
  AccountCircle,
  LibraryBooks,
} from '@mui/icons-material'
import { usePermission } from '@/hooks/usePermission'
import { Permission } from '@/utils/permissions'
import { useAuthStore } from '@/store/auth.store'

const DRAWER_WIDTH = 240

interface NavItem {
  label: string
  icon: React.ReactNode
  path: string
  permission?: string
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/admin/dashboard', permission: Permission.DASHBOARD_READ },
  { label: 'Alunos', icon: <People />, path: '/admin/students', permission: Permission.STUDENTS_READ },
  { label: 'Nova Matrícula', icon: <HowToReg />, path: '/admin/enrollment', permission: Permission.ENROLLMENT_WRITE },
  { label: 'Rematrícula', icon: <HowToReg />, path: '/admin/re-enrollment', permission: Permission.ENROLLMENT_WRITE },
  { label: 'Contratos', icon: <Description />, path: '/admin/contracts', permission: Permission.CONTRACTS_READ },
  { label: 'Turmas', icon: <Class />, path: '/admin/classes', permission: Permission.CLASSES_READ },
  { label: 'Professores', icon: <School />, path: '/admin/teachers', permission: Permission.TEACHERS_READ },
  { label: 'Planos', icon: <CardMembership />, path: '/admin/plans', permission: Permission.PLANS_READ },
  { label: 'Nivelamento', icon: <Assignment />, path: '/admin/leveling', permission: Permission.LEVELING_READ },
  { label: 'Templates de Nivelamento', icon: <LibraryBooks />, path: '/admin/leveling-templates', permission: Permission.LEVELING_READ },
  { label: 'Portal do Professor', icon: <AccountCircle />, path: '/admin/teacher-portal', permission: Permission.HOUR_CLOSINGS_READ },
  { label: 'Links', icon: <LinkIcon />, path: '/admin/links', permission: Permission.ENROLLMENT_WRITE },
]

const adminItems: NavItem[] = [
  { label: 'Usuários', icon: <ManageAccounts />, path: '/admin/users', permission: Permission.USERS_READ },
  { label: 'Configurações', icon: <Settings />, path: '/admin/settings', permission: Permission.SETTINGS_READ },
]

interface SidebarProps {
  mobileOpen: boolean
  onMobileClose: () => void
  desktopOpen?: boolean
  schoolName?: string
}

export function Sidebar({ mobileOpen, onMobileClose, desktopOpen = true }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { hasPermission } = usePermission()
  const user = useAuthStore((s) => s.user)

  const handleNav = (path: string) => {
    navigate(path)
    onMobileClose()
  }

  const content = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          px: 2,
          py: 2.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <School sx={{ color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h6" fontWeight={700} color="primary.main">
            ClassHub
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
          {user?.full_name}
        </Typography>
      </Box>
      <Divider />
      <List sx={{ flex: 1, px: 1, py: 1 }}>
        {navItems
          .filter((item) => !item.permission || hasPermission(item.permission as any))
          .map((item) => (
            <ListItemButton
              key={item.path}
              selected={location.pathname === item.path}
              onClick={() => handleNav(item.path)}
              sx={{ borderRadius: 1, mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14 }} />
            </ListItemButton>
          ))}
      </List>
      <Divider />
      <List sx={{ px: 1, py: 1 }}>
        {adminItems
          .filter((item) => !item.permission || hasPermission(item.permission as any))
          .map((item) => (
            <ListItemButton
              key={item.path}
              selected={location.pathname === item.path}
              onClick={() => handleNav(item.path)}
              sx={{ borderRadius: 1, mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14 }} />
            </ListItemButton>
          ))}
      </List>
    </Box>
  )

  return (
    <>
      {/* Mobile — temporary drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH },
        }}
      >
        {content}
      </Drawer>

      {/* Desktop — persistent drawer (slides in/out) */}
      <Drawer
        variant="persistent"
        open={desktopOpen}
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
            top: '64px',
            height: 'calc(100% - 64px)',
          },
        }}
      >
        {content}
      </Drawer>
    </>
  )
}
