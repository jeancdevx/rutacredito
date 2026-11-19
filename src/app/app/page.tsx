import { Suspense } from 'react'

import WorkspaceApp from '@/components/WorkspaceApp'

export default function AppPage() {
  return (
    <Suspense
      fallback={
        <main id='main' className='empty-page'>
          <p>Abriendo tu espacio…</p>
        </main>
      }
    >
      <WorkspaceApp />
    </Suspense>
  )
}
