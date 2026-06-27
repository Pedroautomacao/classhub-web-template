export type NpsQuestionType =
  | 'nps'
  | 'rating'
  | 'scale'
  | 'single_choice'
  | 'multiple_choice'
  | 'text'

export type NpsBucket = 'detractor' | 'passive' | 'promoter'

export interface NpsQuestionConfig {
  /** scale: limite inferior · rating: ignorado (sempre 1) */
  min?: number
  /** rating: nº de estrelas · scale: limite superior */
  max?: number
  min_label?: string
  max_label?: string
}

export interface NpsQuestionCondition {
  /** id de uma pergunta tipo `nps` */
  question_id: string
  /** mostra a pergunta só quando a resposta cai em uma destas faixas */
  buckets: NpsBucket[]
}

export interface NpsQuestion {
  id: string
  type: NpsQuestionType
  text: string
  options?: string[]
  required: boolean
  config?: NpsQuestionConfig
  condition?: NpsQuestionCondition
}

export interface NpsTemplate {
  id: string
  name: string
  questions: NpsQuestion[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export type NpsAnswerValue = number | string | string[]

export interface NpsResponseCreate {
  template_id?: string
  answers: Record<string, NpsAnswerValue>
}

export interface NpsResponse {
  id: string
  template_id: string | null
  answers: Record<string, NpsAnswerValue> | null
  form_snapshot: NpsQuestion[] | null
  created_at: string
}
