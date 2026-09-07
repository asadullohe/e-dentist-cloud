import { UI_TEXT } from '@e-dentist/shared'
import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AuthLayout } from '@/app/layouts/AuthLayout'
import { useVerifyEmail } from '@/features/auth'
import { ApiError } from '@/shared/api'
import { Skeleton } from '@/shared/ui'

export function VerifyEmail() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const { mutate, isPending, isSuccess, isError, error } = useVerifyEmail()

  // StrictMode effektni ikki marta chaqiradi. Server takrorga bardosh, lekin
  // ortiqcha soʻrov yuborishning maʼnosi yoʻq
  const sent = useRef(false)

  useEffect(() => {
    if (sent.current) return
    sent.current = true
    mutate(token)
  }, [mutate, token])

  return (
    <AuthLayout
      centered
      footer={
        <Link to="/login" className="text-primary hover:underline">
          {UI_TEXT.login}
        </Link>
      }
    >
      {isPending && (
        <div className="space-y-2">
          <Skeleton className="mx-auto h-9 w-9 rounded-full" />
          <p className="text-muted-foreground text-sm">{UI_TEXT.verifying}</p>
        </div>
      )}
      {isSuccess && (
        <>
          <div className="text-4xl">✅</div>
          <h2 className="font-display mt-2.5 text-lg font-semibold">{UI_TEXT.verified}</h2>
          <p className="text-muted-foreground mt-2 text-sm">{UI_TEXT.verified_hint}</p>
        </>
      )}
      {isError && (
        <>
          <div className="text-4xl">⚠️</div>
          <p className="text-destructive mt-2.5 text-sm font-medium">
            {error instanceof ApiError ? error.message : UI_TEXT.offline}
          </p>
        </>
      )}
    </AuthLayout>
  )
}
