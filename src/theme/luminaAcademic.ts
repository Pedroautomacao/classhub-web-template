// Design tokens do sistema "Lumina Academic" exportado pelo Stitch
// (projeto School Pilot Landing Page — id 14479346840030917576).
// Mapeia 1:1 com o design system criado lá pra que landing + auth + admin
// compartilhem o mesmo vocabulário visual.

export const luminaPalette = {
  primary: {
    main: '#1b656c',
    light: '#3a7e85',
    dark: '#004f55',
    container: '#abeef5',
    onContainer: '#002023',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#1b6d24',
    light: '#88d982',
    dark: '#005312',
    container: '#a0f399',
    onContainer: '#217128',
    contrastText: '#ffffff',
  },
  tertiary: {
    main: '#6c1ff3',
    light: '#844eff',
    dark: '#5400cc',
    container: '#e9ddff',
    onContainer: '#22005d',
    contrastText: '#ffffff',
  },
  error: {
    main: '#ba1a1a',
    container: '#ffdad6',
    onContainer: '#93000a',
    contrastText: '#ffffff',
  },
  neutral: {
    bg: '#f8f9fa',
    surface: '#ffffff',
    surfaceLow: '#f3f4f5',
    surfaceContainer: '#edeeef',
    surfaceHigh: '#e7e8e9',
    surfaceHighest: '#e1e3e4',
    surfaceDim: '#d9dadb',
    outline: '#6f797a',
    outlineVariant: '#bfc8c9',
    text: '#191c1d',
    textVariant: '#3f4849',
    inverseSurface: '#2e3132',
    inverseOnSurface: '#f0f1f2',
  },
} as const

export const luminaFonts = {
  headline: '"Hanken Grotesk", "Inter", "Helvetica", "Arial", sans-serif',
  body: '"Inter", "Helvetica", "Arial", sans-serif',
} as const

// Escala tipográfica derivada do designMd "Lumina Academic"
export const luminaTypography = {
  headlineXl: { fontFamily: luminaFonts.headline, fontSize: '48px', fontWeight: 700, lineHeight: '56px', letterSpacing: '-0.02em' },
  headlineLg: { fontFamily: luminaFonts.headline, fontSize: '32px', fontWeight: 600, lineHeight: '40px' },
  headlineLgMobile: { fontFamily: luminaFonts.headline, fontSize: '28px', fontWeight: 600, lineHeight: '36px' },
  headlineMd: { fontFamily: luminaFonts.headline, fontSize: '24px', fontWeight: 600, lineHeight: '32px' },
  bodyLg: { fontFamily: luminaFonts.body, fontSize: '18px', fontWeight: 400, lineHeight: '28px' },
  bodyMd: { fontFamily: luminaFonts.body, fontSize: '16px', fontWeight: 400, lineHeight: '24px' },
  labelMd: { fontFamily: luminaFonts.body, fontSize: '14px', fontWeight: 600, lineHeight: '20px', letterSpacing: '0.01em' },
  labelSm: { fontFamily: luminaFonts.body, fontSize: '12px', fontWeight: 500, lineHeight: '16px' },
} as const

// 8px é a unidade base do design — usado também como spacing factor do MUI
export const luminaShape = {
  borderRadiusBase: 8,
  borderRadiusCard: 16,
  borderRadiusContainer: 24,
} as const

// Gradiente padrão usado como fallback do Hero (Deep Teal → Forest Green)
export const luminaGradients = {
  hero: `linear-gradient(135deg, ${luminaPalette.primary.dark} 0%, ${luminaPalette.primary.main} 50%, ${luminaPalette.secondary.dark} 100%)`,
  authShell: `linear-gradient(160deg, ${luminaPalette.primary.container} 0%, ${luminaPalette.neutral.bg} 60%, ${luminaPalette.tertiary.container} 100%)`,
} as const

// Sombras "ambient" descritas no designMd (Level 1 / Level 2)
export const luminaShadows = {
  card: '0px 4px 20px rgba(0, 0, 0, 0.04)',
  floating: '0px 12px 30px rgba(0, 0, 0, 0.08)',
} as const
