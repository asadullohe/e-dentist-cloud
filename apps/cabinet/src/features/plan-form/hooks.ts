import { TOAST_TEXT } from '@e-dentist/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PLAN_KEYS, type PlanStageDraft, type PlanStatus } from '@/entities/plan'
import * as api from './api'

/// Reja oʻzgarsa roʻyxat ham, kartochka ham eskiradi — ikkalasi yangilanadi
function usePlanMutation<TArgs, TResult>(
  fn: (args: TArgs) => Promise<TResult>,
  meta: { success?: (data: TResult, variables: TArgs) => string; inlineErrors?: boolean },
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PLAN_KEYS.all }),
    meta,
  })
}

export function useSavePlan(id: string | null) {
  return usePlanMutation(
    (payload: api.PlanPayload) => (id ? api.updatePlan(id, payload) : api.createPlan(payload)),
    { success: () => (id ? TOAST_TEXT.plan_updated : TOAST_TEXT.plan_created), inlineErrors: true },
  )
}

/// Mazmun har oʻzgarishda toʻliq yuboriladi — band qoʻshilganda ham,
/// tortib tartiblanganda ham. Tartib oʻzgarishida toast ortiqcha: foydalanuvchi
/// natijani koʻrib turibdi, har tortishda xabar chiqsa bezor qiladi
export function useSavePlanContent(id: string, options: { silent?: boolean } = {}) {
  return usePlanMutation((stages: PlanStageDraft[]) => api.savePlanContent(id, stages), {
    ...(options.silent ? {} : { success: () => TOAST_TEXT.plan_updated }),
    inlineErrors: true,
  })
}

export function useSkipPlanItem(planId: string) {
  return usePlanMutation(
    ({ itemId, skip }: { itemId: string; skip: boolean }) => api.skipPlanItem(planId, itemId, skip),
    {
      success: (_data, { skip }) => (skip ? TOAST_TEXT.plan_item_skipped : TOAST_TEXT.plan_updated),
    },
  )
}

export function useSetPlanStatus(id: string) {
  return usePlanMutation(
    ({ status, reason }: { status: PlanStatus; reason?: string | null }) =>
      api.setPlanStatus(id, status, reason),
    {
      success: (_data, { status }) =>
        status === 'sent'
          ? TOAST_TEXT.plan_sent
          : status === 'accepted'
            ? TOAST_TEXT.plan_accepted
            : status === 'declined'
              ? TOAST_TEXT.plan_declined
              : TOAST_TEXT.plan_cancelled,
      inlineErrors: true,
    },
  )
}
