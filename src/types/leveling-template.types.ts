export type QuestionType = 'single_choice' | 'multiple_choice' | 'text'

export interface TemplateQuestion {
  id: string
  type: QuestionType
  text: string
  options?: string[]
  required: boolean
}

export interface LevelingTemplate {
  id: string
  name: string
  questions: TemplateQuestion[]
  is_active: boolean
  created_at: string
  updated_at: string
}
