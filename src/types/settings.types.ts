export interface LandingPageData {
  school_name: string
  welcome_text: string | null
  welcome_image: string | null
  whatsapp: string | null
  instagram: string | null
}

export interface SchoolSettings extends LandingPageData {
  id: string
  semester_start: string | null
  semester_end: string | null
  level_options: string[] | null
  updated_at: string
}
