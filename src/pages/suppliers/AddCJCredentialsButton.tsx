import { Button } from '@/components/ui/button'
import { useAddCJCredentials } from '@/hooks/useAddCJCredentials'

export function AddCJCredentialsButton() {
  const { mutate: addCredentials, isPending } = useAddCJCredentials()

  const handleClick = () => {
    const accessToken = 'CJ4951242@api@4fbee21f4ee34be39249433c14caedc1'
    addCredentials(accessToken)
  }

  return (
    <Button 
      onClick={handleClick}
      disabled={isPending}
      variant="default"
    >
      {isPending ? 'Ajout en cours...' : 'Ajouter CJ Dropshipping'}
    </Button>
  )
}
