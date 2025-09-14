import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { RefreshCw } from "lucide-react"
import { useState } from "react"

export const RefreshProfileButton = () => {
  const { refetchProfile, profile } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleRefresh = async () => {
    setLoading(true)
    try {
      await refetchProfile()
      // Force page reload to ensure all components get updated
      window.location.reload()
    } finally {
      setLoading(false)
    }
  }

  // Show current profile info for debugging
  const isAdmin = profile?.role === 'admin' || profile?.is_admin === true

  return (
    <div className="flex flex-col gap-2 p-4 border rounded-lg">
      <div className="text-sm text-muted-foreground">
        Status: {profile?.role || 'user'} | Admin: {isAdmin ? 'Oui' : 'Non'}
      </div>
      <Button 
        onClick={handleRefresh} 
        disabled={loading}
        variant="outline"
        size="sm"
        className="w-fit"
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
        Actualiser le profil
      </Button>
    </div>
  )
}