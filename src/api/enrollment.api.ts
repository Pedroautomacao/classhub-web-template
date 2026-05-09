import api from './axios'
import type { EnrollmentRequest, ReEnrollmentRequest, EnrollmentResponse, PublicEnrollmentRequest, PublicReEnrollmentRequest, StudentLookupResult } from '@/types'

export const enrollmentApi = {
  enroll: (data: EnrollmentRequest) =>
    api.post<EnrollmentResponse>('/enrollment/', data).then((r) => r.data),

  reEnroll: (data: ReEnrollmentRequest) =>
    api.post<EnrollmentResponse>('/enrollment/re-enroll', data).then((r) => r.data),

  publicEnroll: (data: PublicEnrollmentRequest) =>
    api.post<EnrollmentResponse>('/enrollment/public', data).then((r) => r.data),

  publicReEnroll: (data: PublicReEnrollmentRequest) =>
    api.post<EnrollmentResponse>('/enrollment/re-enroll/public', data).then((r) => r.data),

  lookupByCpf: (cpf: string) =>
    api.get<StudentLookupResult>('/enrollment/lookup', { params: { cpf } }).then((r) => r.data),
}
