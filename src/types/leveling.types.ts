export type ContactStatus =
  | 'analyze'
  | 'enrolled'
  | 'not_interested'
  | 'ghosted'
  | 'waiting_list'
  | 'negotiation'
  | 'trial_class'
  | 'awaiting_response'

export interface LevelingFormCreate {
  full_name: string
  email: string
  phone: string
  instagram?: string
  birth_date?: string
  cpf?: string
  answers?: string
  availability?: string
  template_id?: string
}

export interface LevelingFormResponse {
  id: string
  full_name: string
  email: string
  phone: string
  instagram: string | null
  birth_date: string | null
  cpf: string | null
  answers: string | null
  availability: string | null
  contact_status: ContactStatus
  level_result: string | null
  recommendation: string | null
  template_id: string | null
  form_snapshot: import('./leveling-template.types').TemplateQuestion[] | null
  created_at: string
  updated_at: string
}
