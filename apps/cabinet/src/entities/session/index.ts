export { fetchSession } from './api'
export {
  type DoctorScope,
  SESSION_QUERY_KEY,
  useDoctorScope,
  useHasPermission,
  useSession,
} from './hooks'
export type { Session, SessionClinic, SessionRole, SessionSubscription, SessionUser } from './model'
