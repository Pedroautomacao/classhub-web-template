import { useState } from 'react'
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Box,
  Avatar,
  Tooltip,
} from '@mui/material'
import { Menu as MenuIcon, Logout, DarkMode, LightMode } from '@mui/icons-material'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useThemeStore } from '@/store/theme.store'
import { useAuthStore } from '@/store/auth.store'
import { ProfileModal } from './ProfileModal'

interface TopbarProps {
  onMenuClick: () => void
  title?: string
}

export function Topbar({ onMenuClick, title }: TopbarProps) {
  const { user, logout } = useAuth()
  const avatarUrl = useAuthStore((s) => s.user?.avatar_url)
  const navigate = useNavigate()
  const { mode, toggleMode } = useThemeStore()
  const [profileOpen, setProfileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const initials = user?.full_name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        color="inherit"
        sx={{
          width: '100%',
          backgroundImage: 'linear-gradient(90deg, #1f5f6e 0%, #357e8c 100%)',
          backgroundColor: '#1f5f6e',
          color: '#ffffff',
          borderBottom: 'none',
          transition: 'width 0.2s ease, margin 0.2s ease',
        }}
      >
        <Toolbar>
          <IconButton edge="start" onClick={onMenuClick} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" fontWeight={600} sx={{ flexGrow: 1 }}>
            {title ?? 'ClassHub'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title={mode === 'light' ? 'Modo escuro' : 'Modo claro'}>
              <IconButton onClick={toggleMode} color="inherit" size="small">
                {mode === 'light' ? <DarkMode fontSize="small" /> : <LightMode fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Meu perfil">
              <IconButton onClick={() => setProfileOpen(true)} sx={{ p: 0.5 }}>
                <Avatar
                  src={avatarUrl ?? undefined}
                  sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 13 }}
                >
                  {initials}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Button startIcon={<Logout />} onClick={handleLogout} color="inherit" size="small">
              Sair
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  )
}
