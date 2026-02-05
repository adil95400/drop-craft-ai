import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export function useAvatarUpload(onSuccess?: () => void) {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)

  const uploadAvatar = async (file: File) => {
    if (!user) return null

    setUploading(true)
    try {
      // Validate image type
      if (!file.type.startsWith('image/')) {
        toast.error('Seules les images sont acceptées')
        return null
      }

      // Validate size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image trop volumineuse (max 2 Mo)')
        return null
      }

      const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
      const path = `${user.id}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(path)

      const publicUrl = urlData.publicUrl

      // Update profile with new avatar_url
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (updateError) throw updateError

      toast.success('Avatar mis à jour')
      onSuccess?.()
      return publicUrl
    } catch (err: any) {
      console.error('Avatar upload error:', err)
      toast.error(err.message || "Erreur lors de l'upload")
      return null
    } finally {
      setUploading(false)
    }
  }

  return { uploadAvatar, uploading }
}
