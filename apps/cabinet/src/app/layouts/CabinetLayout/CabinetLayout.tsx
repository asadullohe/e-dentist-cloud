import { Outlet } from 'react-router-dom'
import { useSession } from '@/entities/session'
import { Sidebar } from '@/widgets/Sidebar'
import { TrialBanner } from '@/widgets/TrialBanner'

export function CabinetLayout() {
  const { data: session } = useSession()

  return (
    <div className="flex min-h-full">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-8 pt-7 pb-12">
        <TrialBanner clinic={session?.clinic ?? null} />
        <Outlet />
      </main>
    </div>
  )
}
