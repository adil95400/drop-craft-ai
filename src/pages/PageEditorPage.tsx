/**
 * Page Editor Route
 */
import { Helmet } from 'react-helmet-async';
import { PageEditor } from '@/components/page-builder';

export default function PageEditorPage() {
  return (
    <>
      <Helmet>
        <title>Éditeur de Page | Shopopti</title>
      </Helmet>
      <PageEditor />
    </>
  );
}
