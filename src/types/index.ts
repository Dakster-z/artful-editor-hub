export interface Photo {
  id: string
  user_id: string
  title: string
  description?: string
  file_path: string
  file_url: string
  file_size: number
  mime_type: string
  created_at: string
  updated_at: string
}

export interface EditHistory {
  id: string
  photo_id: string
  operation: string
  parameters: Record<string, any>
  created_at: string
}

export interface FilterPreset {
  name: string
  filters: {
    brightness: number
    contrast: number
    saturation: number
    blur: number
    sepia: number
    grayscale: number
  }
}