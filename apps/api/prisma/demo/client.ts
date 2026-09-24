// Lokal API ga soʻrov yuboruvchi mijoz. Maʼlumot API orqali kiritiladi —
// ulush, taqsimot, qarz va xarita hisobi haqiqiy foydalanishdagidek boʻlsin

const BASE = process.env.DEMO_API_URL ?? `http://localhost:${process.env.API_PORT ?? 3000}/api`

type Envelope<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } }

export class DemoApiError extends Error {}

export class Client {
  private cookie = ''

  async login(email: string, password: string): Promise<void> {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    await unwrap(res, 'POST /auth/login')
    const session = res.headers.getSetCookie().find((c) => c.startsWith('ed_session='))
    if (!session) throw new DemoApiError(`${email}: sessiya cookie qaytmadi`)
    this.cookie = session.split(';')[0] ?? ''
  }

  get<T>(path: string): Promise<T> {
    return this.send<T>('GET', path)
  }

  post<T>(path: string, body: unknown): Promise<T> {
    return this.send<T>('POST', path, body)
  }

  patch<T>(path: string, body: unknown): Promise<T> {
    return this.send<T>('PATCH', path, body)
  }

  put<T>(path: string, body: unknown): Promise<T> {
    return this.send<T>('PUT', path, body)
  }

  private async send<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { cookie: this.cookie }
    if (body !== undefined) headers['content-type'] = 'application/json'
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    return unwrap<T>(res, `${method} ${path}`)
  }
}

/// Ochiq sahifa soʻrovi (bemor fikri) — cookie siz, har safar yangi qurilma
export async function publicPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  return unwrap<T>(res, `POST ${path}`)
}

export async function apiIsUp(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/health`)
    return res.ok
  } catch {
    return false
  }
}

async function unwrap<T>(res: Response, label: string): Promise<T> {
  const json = (await res.json()) as Envelope<T>
  if (!json.ok) {
    throw new DemoApiError(`${label} → ${res.status} ${json.error.code}: ${json.error.message}`)
  }
  return json.data
}

// ─────────────────────────────  Sanalar  ─────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0')

/// Mahalliy (TZ) sana YYYY-MM-DD — API shu shaklni kutadi
export function iso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function monthOf(d: Date): string {
  return iso(d).slice(0, 7)
}

export function daysFromToday(n: number): Date {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() + n)
  return d
}

export function hm(minutes: number): string {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`
}

export const isSunday = (d: Date) => d.getDay() === 0
