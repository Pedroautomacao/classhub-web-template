import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { PublicLayout } from '@/layouts/PublicLayout'
import { AdminLayout } from '@/layouts/AdminLayout'
import { PrivateRoute } from './PrivateRoute'

const LandingPage = lazy(() => import('@/pages/landing/LandingPage').then((m) => ({ default: m.LandingPage })))
const LevelingFormPage = lazy(() => import('@/pages/landing/LevelingFormPage').then((m) => ({ default: m.LevelingFormPage })))
const EnrollmentFormPage = lazy(() => import('@/pages/landing/EnrollmentFormPage').then((m) => ({ default: m.EnrollmentFormPage })))
const ReEnrollmentFormPage = lazy(() => import('@/pages/landing/ReEnrollmentFormPage').then((m) => ({ default: m.ReEnrollmentFormPage })))
const DashboardPage = lazy(() => import('@/pages/admin/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const StudentsListPage = lazy(() => import('@/pages/admin/students/StudentsListPage').then((m) => ({ default: m.StudentsListPage })))
const TeachersListPage = lazy(() => import('@/pages/admin/teachers/TeachersListPage').then((m) => ({ default: m.TeachersListPage })))
const ClassesListPage = lazy(() => import('@/pages/admin/classes/ClassesListPage').then((m) => ({ default: m.ClassesListPage })))
const ContractsListPage = lazy(() => import('@/pages/admin/contracts/ContractsListPage').then((m) => ({ default: m.ContractsListPage })))
const PaymentsListPage = lazy(() => import('@/pages/admin/payments/PaymentsListPage').then((m) => ({ default: m.PaymentsListPage })))
const PlansListPage = lazy(() => import('@/pages/admin/plans/PlansListPage').then((m) => ({ default: m.PlansListPage })))
const LevelingListPage = lazy(() => import('@/pages/admin/leveling/LevelingListPage').then((m) => ({ default: m.LevelingListPage })))
const EnrollmentPage = lazy(() => import('@/pages/admin/enrollment/EnrollmentPage').then((m) => ({ default: m.EnrollmentPage })))
const ReEnrollmentPage = lazy(() => import('@/pages/admin/enrollment/ReEnrollmentPage').then((m) => ({ default: m.ReEnrollmentPage })))
const UsersListPage = lazy(() => import('@/pages/admin/users/UsersListPage').then((m) => ({ default: m.UsersListPage })))
const SettingsPage = lazy(() => import('@/pages/admin/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const ShareableLinksPage = lazy(() => import('@/pages/admin/links/ShareableLinksPage').then((m) => ({ default: m.ShareableLinksPage })))
const TeacherPortalPage = lazy(() => import('@/pages/admin/teacher-portal/TeacherPortalPage').then((m) => ({ default: m.TeacherPortalPage })))
const LevelingTemplatesPage = lazy(() => import('@/pages/admin/leveling-templates/LevelingTemplatesPage').then((m) => ({ default: m.LevelingTemplatesPage })))

function PageLoader() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <CircularProgress />
    </Box>
  )
}

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <Lazy><LandingPage /></Lazy> },
      { path: '/leveling', element: <Lazy><LevelingFormPage /></Lazy> },
      { path: '/enrollment', element: <Lazy><EnrollmentFormPage /></Lazy> },
      { path: '/re-enrollment', element: <Lazy><ReEnrollmentFormPage /></Lazy> },
    ],
  },
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin', element: <Lazy><DashboardPage /></Lazy> },
          { path: '/admin/dashboard', element: <Lazy><DashboardPage /></Lazy> },
          { path: '/admin/students', element: <Lazy><StudentsListPage /></Lazy> },
          { path: '/admin/teachers', element: <Lazy><TeachersListPage /></Lazy> },
          { path: '/admin/classes', element: <Lazy><ClassesListPage /></Lazy> },
          { path: '/admin/contracts', element: <Lazy><ContractsListPage /></Lazy> },
          { path: '/admin/payments', element: <Lazy><PaymentsListPage /></Lazy> },
          { path: '/admin/plans', element: <Lazy><PlansListPage /></Lazy> },
          { path: '/admin/leveling', element: <Lazy><LevelingListPage /></Lazy> },
          { path: '/admin/enrollment', element: <Lazy><EnrollmentPage /></Lazy> },
          { path: '/admin/re-enrollment', element: <Lazy><ReEnrollmentPage /></Lazy> },
          { path: '/admin/users', element: <Lazy><UsersListPage /></Lazy> },
          { path: '/admin/settings', element: <Lazy><SettingsPage /></Lazy> },
          { path: '/admin/links', element: <Lazy><ShareableLinksPage /></Lazy> },
          { path: '/admin/teacher-portal', element: <Lazy><TeacherPortalPage /></Lazy> },
          { path: '/admin/leveling-templates', element: <Lazy><LevelingTemplatesPage /></Lazy> },
        ],
      },
    ],
  },
])
