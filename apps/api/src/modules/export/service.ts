// Toʻliq eksport: klinikaning barcha maʼlumoti bitta zip arxivda.
//
// Modul oʻz jadvaliga ega emas — har bir boʻlim oʻz modulining xizmat
// qatlamidan soʻraladi (tz.md 2-boʻlim). Rasmlar arxivga qoʻshilmaydi:
// ular MinIO da va hajmi katta, kartochkadan alohida yuklab olinadi.

import { EXPORT_FILES, EXPORT_UI, formatDate, todayISO } from '@e-dentist/shared'
import AdmZip from 'adm-zip'
import { AUDIT_ACTION, writeAudit } from '../../platform/audit.js'
import type { Db } from '../../platform/db.js'
import { errors } from '../../platform/errors.js'
import { withClinic } from '../../platform/tenant.js'
import * as auth from '../auth/service.js'
import * as clinics from '../clinics/service.js'
import * as expenses from '../expenses/service.js'
import * as lab from '../lab/service.js'
import * as patients from '../patients/service.js'
import * as payments from '../payments/service.js'
import * as schedule from '../schedule/service.js'
import * as services from '../services/service.js'
import * as visits from '../visits/service.js'
import * as sheets from './sheets.js'

export interface ExportDeps {
  db: Db
}

export interface Archive {
  fileName: string
  buffer: Buffer
}

const WIDTH = {
  visits: [14, 28, 40, 8, 16, 40],
  teeth: [28, 8, 20, 20, 40],
  bridges: [28, 24, 20],
  payments: [14, 28, 16, 40],
  appointments: [20, 28, 18, 40],
  expenses: [14, 20, 40, 16],
  lab: [14, 28, 20, 20, 10, 20, 24, 16, 16, 12, 40],
  services: [40, 16],
}

export function buildArchive(deps: ExportDeps, clinicId: string, userId: string): Promise<Archive> {
  return withClinic(deps.db, clinicId, async (tx) => {
    const clinic = await clinics.findClinic(tx, clinicId)
    if (!clinic) throw errors.notFound()

    const [people, visitRows, teethRows, bridgeRows] = await Promise.all([
      patients.exportRowsTx(tx),
      visits.exportVisitsTx(tx),
      visits.exportTeethTx(tx),
      visits.exportBridgesTx(tx),
    ])
    const [paymentRows, appointmentRows, expenseRows, labRows, serviceRows] = await Promise.all([
      payments.exportPaymentsTx(tx),
      schedule.exportAppointmentsTx(tx),
      expenses.exportExpensesTx(tx),
      lab.exportOrdersTx(tx),
      services.listTx(tx),
    ])

    const names = new Map(people.map((person) => [person.id, person.fio]))
    const techNames = await auth.staffNamesTx(tx, [
      ...new Set(labRows.map((row) => row.techId).filter((id): id is string => id !== null)),
    ])

    const [
      patientsFile,
      visitsFile,
      teethFile,
      bridgesFile,
      paymentsFile,
      appointmentsFile,
      expensesFile,
      labFile,
      servicesFile,
    ] = await Promise.all([
      patients.buildPatientsSheet(people),
      sheets.toBuffer('Tashriflar', sheets.visitsSheet(visitRows, names), WIDTH.visits),
      sheets.toBuffer('Tish xaritasi', sheets.teethSheet(teethRows, names), WIDTH.teeth),
      sheets.toBuffer('Koʻpriklar', sheets.bridgesSheet(bridgeRows, names), WIDTH.bridges),
      sheets.toBuffer('Toʻlovlar', sheets.paymentsSheet(paymentRows, names), WIDTH.payments),
      sheets.toBuffer(
        'Qabullar',
        sheets.appointmentsSheet(appointmentRows, names),
        WIDTH.appointments,
      ),
      sheets.toBuffer('Xarajatlar', sheets.expensesSheet(expenseRows), WIDTH.expenses),
      sheets.toBuffer(
        'Naryadlar',
        sheets.labSheet(labRows, names, techNames, (index) => labRows[index]?.techId ?? null),
        WIDTH.lab,
      ),
      sheets.toBuffer('Narxnoma', sheets.servicesSheet(serviceRows), WIDTH.services),
    ])

    const zip = new AdmZip()
    zip.addFile(EXPORT_FILES.patients, patientsFile)
    zip.addFile(EXPORT_FILES.visits, visitsFile)
    zip.addFile(EXPORT_FILES.teeth, teethFile)
    zip.addFile('koppriklar.xlsx', bridgesFile)
    zip.addFile(EXPORT_FILES.payments, paymentsFile)
    zip.addFile(EXPORT_FILES.appointments, appointmentsFile)
    zip.addFile(EXPORT_FILES.expenses, expensesFile)
    zip.addFile(EXPORT_FILES.lab, labFile)
    zip.addFile(EXPORT_FILES.services, servicesFile)
    zip.addFile(
      EXPORT_FILES.readme,
      Buffer.from(EXPORT_UI.readme(clinic.name, formatDate(todayISO())), 'utf8'),
    )

    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.data_exported,
      entity: 'clinic',
      entityId: clinicId,
      meta: { patients: people.length, visits: visitRows.length },
    })

    return {
      fileName: EXPORT_FILES.archive(todayISO()),
      buffer: zip.toBuffer(),
    }
  })
}
