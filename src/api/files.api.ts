import api from './axios'
import type { FileMetadata, FileWithContent, FileType } from '@/types'

export const filesApi = {
  create: (data: { reference_id: string; type: FileType; file_name: string; content: string }) =>
    api.post<FileMetadata>('/files/', data).then((r) => r.data),

  getByReference: (referenceId: string, type: FileType) =>
    api.get<FileMetadata | null>('/files/', { params: { reference_id: referenceId, type } }).then((r) => r.data),

  getContent: (fileId: string) =>
    api.get<FileWithContent>(`/files/${fileId}/content`).then((r) => r.data),

  replace: (fileId: string, data: { file_name: string; content: string }) =>
    api.put<FileMetadata>(`/files/${fileId}`, data).then((r) => r.data),

  delete: (fileId: string) =>
    api.delete(`/files/${fileId}`),
}

/** Converte um File do input em string base64 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Remove o prefixo "data:application/pdf;base64,"
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/** Faz download de um arquivo base64 no browser */
export function downloadBase64File(base64: string, fileName: string, mimeType = 'application/pdf') {
  const byteChars = atob(base64)
  const byteArray = new Uint8Array(byteChars.length)
  for (let i = 0; i < byteChars.length; i++) {
    byteArray[i] = byteChars.charCodeAt(i)
  }
  const blob = new Blob([byteArray], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}
