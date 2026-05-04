export interface AvailabilitySlot {
  start: string
  end: string
}

export interface AvailabilityDay {
  day: string
  slots: AvailabilitySlot[]
}

export interface Teacher {
  id: string
  name: string
  email: string
  phone: string | null
  is_training: boolean
  hourly_rate: number
  availability: AvailabilityDay[] | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}
