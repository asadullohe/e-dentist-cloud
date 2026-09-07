import { Outlet } from 'react-router-dom'
import { useSession } from '@/entities/session'
import { Sidebar } from '@/widgets/Sidebar'
import { TrialBanner } from '@/widgets/TrialBanner'

export function CabinetLayout() {
  const { data: session } = useSession()

  return (
    <div className="flex min-h-full">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-y-auto px-4 pt-7 pb-12 sm:px-8">
        <TrialBanner clinic={session?.clinic ?? null} />
        <Outlet />
      </main>
    </div>
  )
}
