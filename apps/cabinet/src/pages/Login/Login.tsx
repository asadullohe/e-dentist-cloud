import { UI_TEXT } from '@e-dentist/shared'
import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../../app/layouts/AuthLayout'
import { useLogin } from '../../features/auth'
import { fieldErrors, formError } from '../../shared/api'
import { Field } from '../../shared/ui'
import styles from './Login.module.scss'

export function Login() {
  const navigate = useNavigate()
  const { mutateAsync, isPending, error } = useLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const fields = fieldErrors(error)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    try {
      await mutateAsync({ email, password })
      navigate('/', { replace: true })
    } catch {
      // Xato `error` da — quyida koʻrsatiladi
    }
  }

  return (
    <AuthLayout
      footer={
        <>
          {UI_TEXT.no_account} <Link to="/register">{UI_TEXT.register}</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <Field label={UI_TEXT.email} error={fields.email}>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </Field>
        <Field label={UI_TEXT.password} error={fields.password}>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </Field>
        {formError(error) && <div className={styles.error}>{formError(error)}</div>}
        <button className={`btn ${styles.submit}`} type="submit" disabled={isPending}>
          {isPending ? UI_TEXT.loading : UI_TEXT.login}
        </button>
      </form>
    </AuthLayout>
  )
}
