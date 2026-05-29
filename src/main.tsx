import { StrictMode, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { buildTheme } from '@/theme'
import { useThemeStore } from '@/store/theme.store'
import App from './App'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      // staleTime: 0 (default) → todo remount de componente refaz fetch.
      // Isso garante que ao trocar de menu ou de sub-tab os dados são
      // sempre frescos. Queries específicas podem sobrescrever via opção
      // staleTime quando quisermos manter cache (ex: lookups que mudam pouco).
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
    },
  },
})

function Root() {
  const mode = useThemeStore((s) => s.mode)
  const theme = useMemo(() => buildTheme(mode), [mode])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Root />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>
)
