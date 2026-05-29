import { createTheme } from '@mui/material/styles'
import {
  luminaPalette,
  luminaFonts,
  luminaShape,
  luminaShadows,
} from './luminaAcademic'

export function buildTheme(mode: 'light' | 'dark') {
  const isDark = mode === 'dark'
  return createTheme({
    palette: {
      mode,
      primary: {
        main: luminaPalette.primary.main,
        light: luminaPalette.primary.light,
        dark: luminaPalette.primary.dark,
        contrastText: luminaPalette.primary.contrastText,
      },
      secondary: {
        main: luminaPalette.secondary.main,
        light: luminaPalette.secondary.light,
        dark: luminaPalette.secondary.dark,
        contrastText: luminaPalette.secondary.contrastText,
      },
      error: {
        main: luminaPalette.error.main,
        contrastText: luminaPalette.error.contrastText,
      },
      background: {
        default: isDark ? '#14171a' : luminaPalette.neutral.bg,
        paper: isDark ? '#1f2326' : luminaPalette.neutral.surface,
      },
      text: {
        primary: isDark ? '#f0f1f2' : luminaPalette.neutral.text,
        secondary: isDark ? '#cbd5d6' : luminaPalette.neutral.textVariant,
      },
      divider: isDark ? '#2e3132' : luminaPalette.neutral.outlineVariant,
    },
    typography: {
      fontFamily: luminaFonts.body,
      fontWeightRegular: 400,
      fontWeightMedium: 500,
      fontWeightBold: 700,
      h1: { fontFamily: luminaFonts.headline, fontWeight: 700, letterSpacing: '-0.02em' },
      h2: { fontFamily: luminaFonts.headline, fontWeight: 700 },
      h3: { fontFamily: luminaFonts.headline, fontWeight: 600 },
      h4: { fontFamily: luminaFonts.headline, fontWeight: 600 },
      h5: { fontFamily: luminaFonts.headline, fontWeight: 600 },
      h6: { fontFamily: luminaFonts.headline, fontWeight: 600 },
      subtitle1: { fontFamily: luminaFonts.body, fontWeight: 600 },
      button: { fontFamily: luminaFonts.body, fontWeight: 600, textTransform: 'none' },
    },
    shape: {
      borderRadius: luminaShape.borderRadiusBase,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: luminaShape.borderRadiusBase,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: luminaShape.borderRadiusCard,
            boxShadow: luminaShadows.card,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
          elevation1: {
            boxShadow: luminaShadows.card,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: `linear-gradient(90deg, ${luminaPalette.primary.dark} 0%, ${luminaPalette.primary.main} 100%)`,
            backgroundColor: luminaPalette.primary.dark,
            color: '#ffffff',
            boxShadow: luminaShadows.card,
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: luminaShape.borderRadiusBase,
          },
        },
      },
    },
  })
}

export default buildTheme('light')
