// Davolash ssenariylari: bemor qaysi shifokorga, qaysi ketma-ketlikda
// keladi va tugagach tish xaritasida nima qoladi

import { type Ctx, chance, pick } from './context.js'
import { FRONT, MILK, MOLARS, type StaffKey, WISDOM } from './data.js'

type ToothStatus = 'karies' | 'plomba' | 'koronka' | 'implant' | 'olingan' | 'davolanmoqda'

export interface Step {
  service: string
  tooth?: number
  chart?: { tooth: number; status: ToothStatus; material?: string }
}

export interface Scenario {
  doctor: StaffKey
  steps: Step[]
  /// Tugamagan davolashda xaritaga yoziladigan holat
  pending?: { tooth: number; status: ToothStatus }
  /// Barcha qadam bajarilsa qoʻyiladigan koʻprik
  bridge?: { from: number; to: number }
  /// Davolanmagan, xaritada qoladigan kariyes
  caries?: number
}

export function scenarioFor(ctx: Ctx, child: boolean): Scenario {
  const therapist: StaffKey = chance(ctx, 0.6) ? 'dilnoza' : 'owner'
  if (child) {
    const t = pick(ctx, MILK)
    return {
      doctor: therapist,
      steps: [
        { service: 'consult' },
        { service: 'milkExtract', tooth: t, chart: { tooth: t, status: 'olingan' } },
        { service: 'sealant', tooth: 36 },
      ],
    }
  }
  const t = pick(ctx, MOLARS)
  const other = pick(
    ctx,
    MOLARS.filter((x) => x !== t),
  )
  const kind = pick(ctx, [
    'therapy',
    'therapy',
    'endo',
    'endo',
    'hygiene',
    'whitening',
    'extract',
    'crown',
    'crownZr',
    'implant',
    'veneer',
    'bridge',
  ] as const)
  switch (kind) {
    case 'therapy':
      return {
        doctor: therapist,
        caries: chance(ctx, 0.5) ? other : undefined,
        steps: [
          { service: 'consult' },
          { service: 'caries', tooth: t, chart: { tooth: t, status: 'plomba' } },
        ],
      }
    case 'endo':
      return {
        doctor: therapist,
        pending: { tooth: t, status: 'davolanmoqda' },
        steps: [
          { service: 'xray', tooth: t },
          { service: 'canal3', tooth: t },
          { service: 'filling', tooth: t, chart: { tooth: t, status: 'plomba' } },
        ],
      }
    case 'hygiene':
      return { doctor: therapist, steps: [{ service: 'cleaning' }, { service: 'fluor' }] }
    case 'whitening':
      return { doctor: therapist, steps: [{ service: 'cleaning' }, { service: 'whitening' }] }
    case 'extract': {
      const w = pick(ctx, WISDOM)
      return {
        doctor: 'sardor',
        steps: [
          { service: 'xray', tooth: w },
          { service: 'wisdom', tooth: w, chart: { tooth: w, status: 'olingan' } },
        ],
      }
    }
    case 'crown':
    case 'crownZr': {
      const zr = kind === 'crownZr'
      return {
        doctor: 'sardor',
        pending: { tooth: t, status: 'davolanmoqda' },
        steps: [
          { service: 'canal1', tooth: t },
          {
            service: zr ? 'crownZr' : 'crownMc',
            tooth: t,
            chart: { tooth: t, status: 'koronka', material: zr ? 'sirkoniy' : 'metall-keramika' },
          },
        ],
      }
    }
    case 'implant':
      return {
        doctor: 'sardor',
        steps: [
          { service: 'opg' },
          { service: 'extractHard', tooth: 36, chart: { tooth: 36, status: 'olingan' } },
          { service: 'implant', tooth: 36, chart: { tooth: 36, status: 'implant' } },
        ],
      }
    case 'veneer': {
      const [a, b] = [pick(ctx, FRONT.slice(0, 3)), pick(ctx, FRONT.slice(3))]
      return {
        doctor: 'sardor',
        steps: [
          { service: 'consult' },
          {
            service: 'veneer',
            tooth: a,
            chart: { tooth: a, status: 'koronka', material: 'keramika' },
          },
          {
            service: 'veneer',
            tooth: b,
            chart: { tooth: b, status: 'koronka', material: 'keramika' },
          },
        ],
      }
    }
    case 'bridge':
      return {
        doctor: 'sardor',
        bridge: { from: 44, to: 46 },
        steps: [
          { service: 'opg' },
          { service: 'extract', tooth: 45, chart: { tooth: 45, status: 'olingan' } },
          { service: 'bridgeUnit', tooth: 44 },
          { service: 'bridgeUnit', tooth: 45 },
          { service: 'bridgeUnit', tooth: 46 },
        ],
      }
  }
}
