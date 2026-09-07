import { KABINET } from '@e-dentist/shared'
import { useAuth } from '../lib/auth'

export function BoshSahifa() {
  const { men } = useAuth()

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">
            {KABINET.xush_kelibsiz}, {men?.user.fullName}
          </h1>
          <div className="page-sub">{men?.clinic?.name}</div>
        </div>
      </div>
      <div className="card">
        <p className="muted">{KABINET.bosh_sahifa_izoh}</p>
      </div>
    </>
  )
}
