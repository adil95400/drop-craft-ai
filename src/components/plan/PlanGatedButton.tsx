import { ReactNode, useState } from 'react'
import { Lock, Crown, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button, ButtonProps } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuth } from '@/hooks/useAuth'
import { usePlan, PlanType } from '@/hooks/usePlan'
import { UpgradeDialog } from './UpgradeDialog'

interface PlanGatedButtonProps extends ButtonProps {
  children: ReactNode
  requiredPlan: PlanType
  showUpgradeModal?: boolean
  lockedText?: string
  to?: string
}

const planIcons = {
  free: null,
  pro: Star,
  ultra_pro: Crown
}

const planNames = {
  free: 'Gratuit',
  pro: 'Pro',
  ultra_pro: 'Ultra Pro'
}

export const PlanGatedButton = ({ 
  children, 
  requiredPlan, 
  showUpgradeModal = true,
  lockedText,
  to,
  onClick,
  disabled,
  ...props 
}: PlanGatedButtonProps) => {
  const { user } = useAuth()
  const { hasPlan } = usePlan(user)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const navigate = useNavigate()
  
  const hasAccess = hasPlan(requiredPlan)
  const PlanIcon = planIcons[requiredPlan]
  const planName = planNames[requiredPlan]

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!hasAccess) {
      e.preventDefault()
      if (showUpgradeModal) {
        setShowUpgrade(true)
      } else if (to) {
        navigate(to)
      }
      return
    }

    if (to) {
      navigate(to)
    } else {
      onClick?.(e)
    }
  }

  if (!hasAccess) {
    const tooltipText = lockedText || `Fonctionnalité ${planName} - Mise à niveau requise`
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative">
              <Button
                {...props}
                disabled
                variant="outline"
                onClick={handleClick}
                className="relative opacity-75 cursor-not-allowed"
              >
                <Lock className="h-4 w-4 mr-2" />
                {children}
                {PlanIcon && (
                  <PlanIcon className="h-3 w-3 ml-2 text-amber-500" />
                )}
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
        
        {showUpgrade && (
          <UpgradeDialog 
            requiredPlan={requiredPlan}
            isOpen={showUpgrade}
            onClose={() => setShowUpgrade(false)}
          />
        )}
      </TooltipProvider>
    )
  }

  return (
    <Button
      {...props}
      disabled={disabled}
      onClick={handleClick}
    >
      {children}
    </Button>
  )
}