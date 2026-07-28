import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Grid,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  People,
  School,
  Assignment,
  Warning,
  PersonSearch,
  Group,
  PersonOff,
  HourglassEmpty,
  FiberManualRecord,
  Pending,
  HowToReg,
  InfoOutlined,
} from '@mui/icons-material'
import { dashboardApi } from '@/api/dashboard.api'
import { classesApi } from '@/api/classes.api'
import { PageHeader } from '@/components/common/PageHeader'
import { usePermission } from '@/hooks/usePermission'
import { Permission } from '@/utils/permissions'
import { getLiveClasses } from '@/utils/availability'

function getSPNow() {
  const sp = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  return { totalMinutes: sp.getHours() * 60 + sp.getMinutes(), dayIndex: sp.getDay() }
}

interface KpiCardProps {
  label: string
  value: number | undefined
  icon: React.ReactNode
  color?: string
  loading?: boolean
  highlight?: boolean
  hint?: string
  onClick?: () => void
}

function KpiCard({ label, value, icon, color = 'primary.main', loading, highlight, hint, onClick }: KpiCardProps) {
  const clickable = !!onClick && (value ?? 0) > 0
  return (
    <Card
      onClick={clickable ? onClick : undefined}
      sx={{
        height: '100%',
        border: highlight ? '2px solid' : undefined,
        borderColor: highlight ? 'warning.main' : undefined,
        cursor: clickable ? 'pointer' : 'default',
        transition: 'box-shadow 0.15s, transform 0.15s',
        ...(clickable && {
          '&:hover': { boxShadow: 4, transform: 'translateY(-1px)' },
        }),
      }}
    >
      <CardContent sx={{ p: '12px !important' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography variant="caption" color="text.secondary" display="block" lineHeight={1.3}>
                {label}
              </Typography>
              {hint && (
                <Tooltip title={hint}>
                  <InfoOutlined sx={{ fontSize: 14, color: 'text.disabled' }} />
                </Tooltip>
              )}
            </Stack>
            {loading ? (
              <Skeleton variant="text" width={40} height={36} />
            ) : (
              <Typography variant="h5" fontWeight={700} color={highlight ? 'warning.main' : color}>
                {value ?? 0}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              bgcolor: highlight ? 'warning.light' : `${color.split('.')[0]}.light`,
              borderRadius: 1.5,
              p: 0.75,
              display: 'flex',
              opacity: 0.8,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { hasPermission } = usePermission()
  const canApproveClosings = hasPermission(Permission.HOUR_CLOSINGS_APPROVE)

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: dashboardApi.getSummary,
    refetchInterval: 60_000,
  })

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesApi.list({ page_size: 9999 }),
    refetchInterval: 60_000,
  })
  const classes = classesData?.items ?? []

  const [spNow, setSpNow] = useState(getSPNow)
  useEffect(() => {
    const id = setInterval(() => setSpNow(getSPNow()), 60_000)
    return () => clearInterval(id)
  }, [])

  const liveCount = getLiveClasses(classes, spNow).length

  const go = (path: string, state?: object) => () => navigate(path, { state })

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral do sistema"
        helpContent={{
          what: 'O Dashboard é a tela inicial do sistema. Ele exibe os principais indicadores da escola em tempo real, permitindo uma visão rápida da situação geral.',
          actions: [
            'Visualizar total de alunos ativos, inativos e sem turma',
            'Ver quantidade de contratos ativos, expirados e próximos do vencimento',
            'Acompanhar formulários de nivelamento e matrículas pendentes de análise',
            'Navegar rapidamente para listas filtradas clicando nos cards',
          ],
          tips: [
            'Clique em qualquer card para ser redirecionado à lista correspondente já filtrada.',
            'Os dados são atualizados automaticamente ao recarregar a página.',
          ],
          flow: 'O Dashboard é o ponto de partida. A partir dele, navegue para Alunos, Contratos ou Nivelamento conforme a necessidade do dia.',
        }}
      />

      <Grid container spacing={2}>
        {/* Alunos */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.8}>
            Alunos
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            label="Alunos Ativos"
            value={data?.students_active}
            icon={<People color="primary" />}
            loading={isLoading}
            onClick={go('/admin/students', { status: 'active' })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            label="Alunos Inativos"
            value={data?.students_inactive}
            icon={<PersonOff color="action" />}
            color="text.secondary"
            loading={isLoading}
            hint="Considera apenas alunos inativados nos últimos 30 dias."
            onClick={go('/admin/students', { status: 'inactive' })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            label="Com Turma"
            value={data?.students_with_class}
            icon={<Group color="success" />}
            color="success.main"
            loading={isLoading}
            onClick={go('/admin/students', { status: 'with_class' })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            label="Sem Turma"
            value={data?.students_without_class}
            icon={<People color="warning" />}
            color="warning.main"
            loading={isLoading}
            onClick={go('/admin/students', { status: 'without_class' })}
          />
        </Grid>

        {/* Professores */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.8} mt={1}>
            Professores
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            label="Professores Ativos"
            value={data?.teachers_active}
            icon={<School color="primary" />}
            loading={isLoading}
            onClick={go('/admin/teachers', { training: 'active' })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            label="Em Treinamento"
            value={data?.teachers_in_training}
            icon={<HourglassEmpty color="warning" />}
            color="warning.main"
            loading={isLoading}
            onClick={go('/admin/teachers', { training: 'training' })}
          />
        </Grid>

        {/* Turmas ao vivo */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.8} mt={1}>
            Turmas
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            onClick={liveCount > 0 ? go('/admin/classes', { tab: 1 }) : undefined}
            sx={{
              height: '100%',
              border: liveCount > 0 ? '2px solid' : undefined,
              borderColor: liveCount > 0 ? 'error.main' : undefined,
              cursor: liveCount > 0 ? 'pointer' : 'default',
              transition: 'box-shadow 0.15s, transform 0.15s',
              ...(liveCount > 0 && { '&:hover': { boxShadow: 4, transform: 'translateY(-1px)' } }),
            }}
          >
            <CardContent sx={{ p: '12px !important' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                <Box>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    {liveCount > 0 && <FiberManualRecord sx={{ fontSize: 9, color: 'error.main' }} />}
                    <Typography variant="caption" color="text.secondary" lineHeight={1.3}>
                      Aulas ao Vivo
                    </Typography>
                  </Stack>
                  <Typography variant="h5" fontWeight={700} color={liveCount > 0 ? 'error.main' : 'text.primary'}>
                    {liveCount}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: liveCount > 0 ? 'error.light' : 'action.hover', borderRadius: 1.5, p: 0.75, display: 'flex', opacity: 0.8, flexShrink: 0 }}>
                  <School color={liveCount > 0 ? 'error' : 'action'} />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Contratos */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.8} mt={1}>
            Contratos
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            label="Contratos Ativos"
            value={data?.contracts_active}
            icon={<Assignment color="primary" />}
            loading={isLoading}
            onClick={go('/admin/contracts', { status: 'active' })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            label="Vencendo em 30 dias"
            value={data?.contracts_expiring_soon}
            icon={<Warning color="warning" />}
            highlight={(data?.contracts_expiring_soon ?? 0) > 0}
            loading={isLoading}
            onClick={go('/admin/contracts', { status: 'active', expiring_soon: true })}
          />
        </Grid>

        {/* Nivelamento */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.8} mt={1}>
            Nivelamento
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            label="Formulários Pendentes"
            value={data?.leveling_pending}
            icon={<PersonSearch color="secondary" />}
            color="secondary.main"
            highlight={(data?.leveling_pending ?? 0) > 0}
            loading={isLoading}
            onClick={go('/admin/leveling', { contact_status: 'analyze' })}
          />
        </Grid>

        {/* Matrículas */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.8} mt={1}>
            Matrículas
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            label="Matrículas hoje"
            value={data?.enrollment_submissions_today}
            icon={<HowToReg color="primary" />}
            loading={isLoading}
            onClick={go('/admin/enrollment')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            label="Rematrículas hoje"
            value={data?.re_enrollment_submissions_today}
            icon={<HowToReg color="success" />}
            color="success.main"
            loading={isLoading}
            onClick={go('/admin/re-enrollment')}
          />
        </Grid>

        {/* Fechamentos */}
        {canApproveClosings && (
          <>
            <Grid size={{ xs: 12 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.8} mt={1}>
                Fechamentos de Horas
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <KpiCard
                label="Aguardando Aprovação"
                value={data?.hour_closings_pending}
                icon={<Pending color="warning" />}
                color="warning.main"
                highlight={(data?.hour_closings_pending ?? 0) > 0}
                loading={isLoading}
                onClick={go('/admin/teachers', { tab: 1 })}
              />
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  )
}
