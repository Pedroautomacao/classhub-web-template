import api from './axios'
import type { EnrollmentSubmission, PaginatedResponse } from '@/types'

interface SubmissionListParams {
  search?: string
  created_after?: string
  created_before?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  page?: number
  page_size?: number
}

interface ReEnrollmentListParams extends SubmissionListParams {
  renewed?: boolean
}

export const enrollmentSubmissionsApi = {
  listEnrollment: (params?: SubmissionListParams) =>
    api
      .get<PaginatedResponse<EnrollmentSubmission>>('/enrollment-submissions/enrollment', { params })
      .then((r) => r.data),

  listReEnrollment: (params?: ReEnrollmentListParams) =>
    api
      .get<PaginatedResponse<EnrollmentSubmission>>('/enrollment-submissions/re-enrollment', { params })
      .then((r) => r.data),
}
