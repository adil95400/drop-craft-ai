import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface BackButtonProps {
  to?: string | null
  label?: string
  className?: string
  onClick?: () => void
}

export function BackButton({ to, label = "Retour", className, onClick }: BackButtonProps) {
  const navigate = useNavigate()
  
  const handleBack = () => {
    if (onClick) {
      onClick()
    } else if (to) {
      navigate(to)
    } else {
      navigate(-1)
    }
  }
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className={`gap-2 ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  )
}
