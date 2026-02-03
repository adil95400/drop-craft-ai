/**
 * Hook for managing import success animations
 * Provides centralized state and controls for celebratory feedback
 */
import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

interface ImportSuccessState {
  isVisible: boolean
  productCount: number
  productName?: string
}

export function useImportSuccessAnimation() {
  const navigate = useNavigate()
  const [state, setState] = useState<ImportSuccessState>({
    isVisible: false,
    productCount: 0,
    productName: undefined,
  })

  const showSuccessAnimation = useCallback((productCount: number, productName?: string) => {
    setState({
      isVisible: true,
      productCount,
      productName,
    })
  }, [])

  const hideSuccessAnimation = useCallback(() => {
    setState(prev => ({ ...prev, isVisible: false }))
  }, [])

  const handleViewProducts = useCallback(() => {
    hideSuccessAnimation()
    navigate('/products')
  }, [hideSuccessAnimation, navigate])

  const handleContinueImport = useCallback(() => {
    hideSuccessAnimation()
  }, [hideSuccessAnimation])

  return {
    ...state,
    showSuccessAnimation,
    hideSuccessAnimation,
    handleViewProducts,
    handleContinueImport,
  }
}
