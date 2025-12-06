import { Helmet } from 'react-helmet-async'
import { VisualWorkflowEditor } from '@/components/automation/VisualWorkflowEditor'

export default function WorkflowEditorPage() {
  return (
    <>
      <Helmet>
        <title>Éditeur de Workflows - ShopOpti</title>
        <meta name="description" content="Créez des workflows d'automatisation if/then comme Channable" />
      </Helmet>
      
      <VisualWorkflowEditor />
    </>
  )
}
