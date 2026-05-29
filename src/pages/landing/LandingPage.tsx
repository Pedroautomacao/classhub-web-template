import { Box } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { settingsApi } from '@/api/settings.api'
import { plansApi } from '@/api/plans.api'
import { LandingNavbar } from '@/components/landing/LandingNavbar'
import { HeroSection } from '@/components/landing/HeroSection'
import { PlansSection } from '@/components/landing/PlansSection'
import { MethodologySection } from '@/components/landing/MethodologySection'
import { LandingFooter } from '@/components/landing/LandingFooter'

export function LandingPage() {
  const navigate = useNavigate()

  const { data: landing, isLoading: loadingLanding } = useQuery({
    queryKey: ['landing'],
    queryFn: settingsApi.getLanding,
  })

  const { data: plans, isLoading: loadingPlans } = useQuery({
    queryKey: ['public-plans'],
    queryFn: plansApi.listPublic,
  })

  const schoolName = landing?.school_name ?? 'Escola ClassHub'
  const welcomeText =
    landing?.welcome_text ??
    'Transforme seu futuro com uma metodologia de ensino inovadora que une tecnologia de ponta e excelência acadêmica. Nossa plataforma oferece um ambiente estruturado para o aprendizado acelerado de idiomas.'
  // welcome_image hoje guarda a imagem da landing — na Fase 6 será renomeado
  // para hero_bg_url e a UI do admin atualizada. Aqui consumimos o campo atual.
  const dynamicBg = landing?.welcome_image ?? null
  const whatsapp = landing?.whatsapp ?? null
  const instagram = landing?.instagram ?? null

  return (
    <Box sx={{ bgcolor: 'background.default' }}>
      <LandingNavbar schoolName={schoolName} onLoginClick={() => navigate('/login')} />
      <HeroSection
        schoolName={schoolName}
        welcomeText={welcomeText}
        dynamicBg={dynamicBg}
        loading={loadingLanding}
        onLevelingClick={() => navigate('/leveling')}
      />
      <PlansSection
        plans={plans}
        loading={loadingPlans}
        whatsapp={whatsapp}
        schoolName={schoolName}
      />
      <MethodologySection />
      <LandingFooter schoolName={schoolName} whatsapp={whatsapp} instagram={instagram} />
    </Box>
  )
}
