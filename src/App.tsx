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

  useEffect(() => {
    if (data?.school_name) {
      document.title = data.school_name
    }
  }, [data?.school_name])

  return <RouterProvider router={router} />
}

export default App
