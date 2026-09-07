import { UI_TEXT } from '@e-dentist/shared'
import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AuthLayout } from '../../app/layouts/AuthLayout'
import { useVerifyEmail } from '../../features/auth'
import { ApiError } from '../../shared/api'
import styles from './VerifyEmail.module.scss'

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
    <AuthLayout centered footer={<Link to="/login">{UI_TEXT.login}</Link>}>
      {isPending && <p className={styles.hint}>{UI_TEXT.verifying}</p>}
      {isSuccess && (
        <>
          <div className={styles.icon}>✅</div>
          <h2 className={styles.title}>{UI_TEXT.verified}</h2>
          <p className={styles.hint}>{UI_TEXT.verified_hint}</p>
        </>
      )}
      {isError && (
        <>
          <div className={styles.icon}>⚠️</div>
          <div className={styles.error}>
            {error instanceof ApiError ? error.message : UI_TEXT.offline}
          </div>
        </>
      )}
    </AuthLayout>
  )
}
