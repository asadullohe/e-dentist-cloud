import { Outlet } from 'react-router-dom'
import { useSession } from '@/entities/session'
import { MobileNav, Sidebar } from '@/widgets/Sidebar'
import { TrialBanner } from '@/widgets/TrialBanner'

export function CabinetLayout() {
  const { data: session } = useSession()

  return (
    <div className="flex min-h-full">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav />
        <main className="min-w-0 flex-1 overflow-y-auto px-3 pt-5 pb-12 sm:px-8 sm:pt-7">
          <TrialBanner clinic={session?.clinic ?? null} />
          <Outlet />
        </main>
      </div>
    </div>
  )
}
