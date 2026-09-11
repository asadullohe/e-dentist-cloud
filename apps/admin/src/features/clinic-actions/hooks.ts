import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CLINIC_KEYS,
  type ClinicCreatePayload,
  createClinic,
  extendClinic,
  removeClinicLogo,
  resendInvite,
  setClinicLogo,
  setClinicStatus,
} from '@/entities/clinic'

/// Javobda yangilangan kartochka keladi — uni darhol keshga qoʻyamiz,
/// roʻyxat esa qayta soʻraladi
function useClinicMutation<TArgs>(fn: (args: TArgs) => Promise<{ id: string }>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (card) => {
      queryClient.setQueryData(CLINIC_KEYS.card(card.id), card)
      queryClient.invalidateQueries({ queryKey: CLINIC_KEYS.all })
    },
  })
}

export function useExtendClinic() {
  return useClinicMutation(({ id, days }: { id: string; days: number }) => extendClinic(id, days))
}

export function useSetClinicStatus() {
  return useClinicMutation(({ id, status }: { id: string; status: 'active' | 'blocked' }) =>
    setClinicStatus(id, status),
  )
}

export function useCreateClinic() {
  return useClinicMutation((payload: ClinicCreatePayload) => createClinic(payload))
}

export function useResendInvite() {
  return useClinicMutation((id: string) => resendInvite(id))
}

export function useSetClinicLogo() {
  return useClinicMutation(({ id, file }: { id: string; file: File }) => setClinicLogo(id, file))
}

export function useRemoveClinicLogo() {
  return useClinicMutation((id: string) => removeClinicLogo(id))
}
