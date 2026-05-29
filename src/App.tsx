import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { router } from '@/router'
import { settingsApi } from '@/api/settings.api'

function App() {
  const { data } = useQuery({
    queryKey: ['landing'],
    queryFn: settingsApi.getLanding,
    staleTime: Infinity,
  })

  // Sincroniza <title> e <meta name="description"> com as configurações da
  // escola — importante pra SEO e pra abas/preview compartilhadas.
  useEffect(() => {
    if (!data) return
    if (data.school_name) {
      document.title = data.school_name
    }
    if (data.welcome_text) {
      const meta = document.querySelector('meta[name="description"]')
      if (meta) meta.setAttribute('content', data.welcome_text)
    }
  }, [data])

  return <RouterProvider router={router} />
}

export default App
