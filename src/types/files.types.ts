export type FileType = 'contract'

export interface FileMetadata {
  id: string
  reference_id: string
  type: FileType
  file_name: string
  created_at: string
  updated_at: string
}

export interface FileWithContent extends FileMetadata {
  content: string // base64
}
