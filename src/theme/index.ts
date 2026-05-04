import { createTheme } from '@mui/material/styles'

// ClassHub brand palette
const brand = {
  teal: '#76c5d5',
  tealDark: '#357e8c',
  tealDeep: '#1f5f6e',
  purple: '#7600ed',
  purpleLight: '#9b3af0',
  purpleDark: '#5200a8',
  navy: '#1f1b34',
  navyLight: '#2e2a46',
  magenta: '#d946a8',
}

export function buildTheme(mode: 'light' | 'dark') {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: brand.tealDark,
        light: brand.teal,
        dark: brand.tealDeep,
        contrastText: '#ffffff',
      },
      secondary: {
        main: brand.purple,
        light: brand.purpleLight,
        dark: brand.purpleDark,
        contrastText: '#ffffff',
      },
      background: {
        default: mode === 'light' ? '#f0f7f9' : '#14111f',
        paper: mode === 'light' ? '#ffffff' : '#1f1b34',
      },
      text: {
        primary: mode === 'light' ? brand.navy : '#f0f0f0',
      },
    },
    typography: {
      fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
      fontWeightMedium: 500,
      h1: { fontWeight: 700 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 600 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
    },
    shape: {
      borderRadius: 10,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 8,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: '0 2px 12px rgba(53,126,140,0.10)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            boxShadow: '0 2px 12px rgba(53,126,140,0.08)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            // backgroundImage override prevents MUI dark-mode elevation overlay from washing out the gradient
            backgroundImage: `linear-gradient(90deg, ${brand.tealDeep} 0%, ${brand.tealDark} 100%)`,
            backgroundColor: brand.tealDeep,
            color: '#ffffff',
          },
        },
      },
    },
  })
}

export default buildTheme('light')
