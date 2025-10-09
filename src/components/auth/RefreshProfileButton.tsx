import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { RefreshCw } from "lucide-react"
import { useState } from "react"
import { useProfileRefresh } from "@/hooks/useProfileRefresh"

export const RefreshProfileButton = () => {
  const { profile } = useAuth()
  const { refreshProfile } = useProfileRefresh()
  const [loading, setLoading] = useState(false)

  const handleRefresh = async () => {
    setLoading(true)
    try {
      await refreshProfile()
      // Force page reload to ensure all components get updated
      window.location.reload()
    } finally {
      setLoading(false)
    }
  }

  // Show current profile info for debugging
  const isAdmin = profile?.is_admin === true

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm text-muted-foreground mb-2">
        <strong>Informations actuelles:</strong><br />
        Email: {profile?.id || 'N/A'}<br />
        Admin: {isAdmin ? 'Oui' : 'Non'}<br />
        Mode admin: {profile?.admin_mode || 'Aucun'}
      </div>
      <Button 
        onClick={handleRefresh} 
        disabled={loading}
        variant="default"
        size="sm"
        className="w-fit bg-primary hover:bg-primary/90"
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Synchronisation...' : 'Actualiser le profil'}
      </Button>
      <p className="text-xs text-muted-foreground">
        Cliquez pour synchroniser vos droits depuis la base de données
      </p>
    </div>
  )
}