import { createClient } from '@supabase/supabase-js'

// Use Lovable's connected Supabase project if available; otherwise fall back to a valid placeholder URL
const fallbackUrl = 'https://placeholder.supabase.co'
const fallbackAnonKey = 'public-anon-key'

const injectedUrl = (globalThis as any).__SUPABASE_URL
const injectedAnon = (globalThis as any).__SUPABASE_ANON_KEY

const supabaseUrl = typeof injectedUrl === 'string' && injectedUrl.startsWith('http') ? injectedUrl : fallbackUrl
const supabaseAnonKey = typeof injectedAnon === 'string' && injectedAnon.length > 0 ? injectedAnon : fallbackAnonKey

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const uploadImage = async (file: File, userId: string) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/${Date.now()}.${fileExt}`
  
  const { data, error } = await supabase.storage
    .from('photos')
    .upload(fileName, file)
  
  if (error) throw error
  
  const { data: { publicUrl } } = supabase.storage
    .from('photos')
    .getPublicUrl(fileName)
  
  return { path: fileName, url: publicUrl }
}

export const deleteImage = async (path: string) => {
  const { error } = await supabase.storage
    .from('photos')
    .remove([path])
  
  if (error) throw error
}