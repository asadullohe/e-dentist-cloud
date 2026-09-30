import { CLINIC_KINDS, type ClinicKind, UI_TEXT } from '@e-dentist/shared'
import { Link, useSearchParams } from 'react-router-dom'
import { AuthLayout } from '@/app/layouts/AuthLayout'
import { useRegister } from '@/features/auth'
import { KindStep } from './KindStep'
import { RegisterForm } from './RegisterForm'

function parseKind(value: string | null): ClinicKind | null {
  return (CLINIC_KINDS as readonly string[]).includes(value ?? '') ? (value as ClinicKind) : null
}

/// Ikki qadam: tur → forma (tz.md 20-boʻlim). Tur URL da (`?kind=solo`):
/// brauzerning «orqaga» tugmasi tanlovga qaytaradi, landing esa toʻgʻri
/// formaga havola bera oladi
export function Register() {
  const { mutateAsync, isPending, isSuccess } = useRegister()
  const [params, setParams] = useSearchParams()
  const kind = parseKind(params.get('kind'))

  if (isSuccess) {
    return (
      <AuthLayout
        centered
        footer={
          <Link to="/login" className="text-primary hover:underline">
            {UI_TEXT.login}
          </Link>
        }
      >
        <div className="text-4xl">📬</div>
        <h2 className="mt-2.5 text-lg font-semibold">{UI_TEXT.mail_sent}</h2>
        <p className="text-muted-foreground mt-2 text-sm">{UI_TEXT.mail_sent_hint}</p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      footer={
        <>
          {UI_TEXT.have_account}{' '}
          <Link to="/login" className="text-primary hover:underline">
            {UI_TEXT.login}
          </Link>
        </>
      }
    >
      {kind ? (
        // `key`: tur almashsa forma boshidan — boshqa turning xatolari qolmasin
        <RegisterForm
          key={kind}
          kind={kind}
          onChangeKind={() => setParams({})}
          submit={mutateAsync}
          isPending={isPending}
        />
      ) : (
        <KindStep onSelect={(next) => setParams({ kind: next })} />
      )}
    </AuthLayout>
  )
}
