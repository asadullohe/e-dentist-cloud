import { EXCEL_TEXT, IMAGE_TEXT, todayISO } from '@e-dentist/shared'

const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

/// Fayl nomida oʻzbekcha harflar bor — RFC 5987 koʻrinishi kerak
function attachment(filename: string): string {
  return `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`
}

import type { FastifyPluginAsync, FastifyRequest } from 'fastify'
import { errors } from '../../platform/errors.js'
import { requireAuth } from '../../platform/guards.js'
import { ok } from '../../platform/response.js'
import { validateInput } from '../../platform/validate.js'
import { patientCreateSchema, patientListSchema, patientUpdateSchema } from './schema.js'
import * as service from './service.js'

export interface PatientRouteOpts {
  deps: service.PatientDeps
}

/// Sessiyada klinika boʻlishi shart. Platforma admini bemor maʼlumotini
/// koʻrmaydi — uning uchun bu modul umuman ochilmaydi (tz.md 11-boʻlim)
function clinicOf(req: FastifyRequest): { clinicId: string; userId: string } {
  const session = requireAuth(req)
  if (!session.clinicId) throw errors.forbidden()
  return { clinicId: session.clinicId, userId: session.userId }
}

export const patientRoutes: FastifyPluginAsync<PatientRouteOpts> = async (app, opts) => {
  const read = { preHandler: app.requirePermission('patients.read') }
  const write = { preHandler: app.requirePermission('patients.write') }

  app.get('/patients', read, async (req) => {
    const { clinicId } = clinicOf(req)
    return ok(await service.list(opts.deps, clinicId, validateInput(patientListSchema, req.query)))
  })

  // Ikkalasi ham `/patients/:id` dan oldin: aks holda «export» bemor
  // identifikatori deb tushunilishi mumkin
  app.get('/patients/import/template', write, async (_req, reply) => {
    const file = await service.exportTemplate()
    return reply
      .header('content-type', XLSX_TYPE)
      .header('content-disposition', attachment(EXCEL_TEXT.template_file))
      .send(file)
  })

  app.get('/patients/export', read, async (req, reply) => {
    const { clinicId, userId } = clinicOf(req)
    const file = await service.exportPatients(opts.deps, clinicId, userId)
    const name = EXCEL_TEXT.export_file(todayISO())
    return reply
      .header('content-type', XLSX_TYPE)
      .header('content-disposition', attachment(name))
      .send(file)
  })

  app.get('/patients/:id', read, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    const { id } = req.params as { id: string }
    return ok(await service.get(opts.deps, clinicId, userId, id))
  })

  app.post('/patients', write, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    const input = validateInput(patientCreateSchema, req.body)
    return ok(await service.create(opts.deps, clinicId, userId, input))
  })

  app.patch('/patients/:id', write, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    const { id } = req.params as { id: string }
    const input = validateInput(patientUpdateSchema, req.body)
    return ok(await service.update(opts.deps, clinicId, userId, id, input))
  })

  app.get('/patients/:id/images', read, async (req) => {
    const { clinicId } = clinicOf(req)
    const { id } = req.params as { id: string }
    return ok(await service.listImages(opts.deps, clinicId, id))
  })

  app.post('/patients/:id/images', write, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    const { id } = req.params as { id: string }

    const file = await req.file()
    if (!file) throw errors.badRequest(IMAGE_TEXT.no_file)

    // Izoh fayl bilan bir formada keladi
    const caption =
      typeof file.fields.caption === 'object' && file.fields.caption !== null
        ? String((file.fields.caption as { value?: unknown }).value ?? '').trim()
        : ''

    return ok(
      await service.uploadImage(opts.deps, clinicId, userId, id, {
        buffer: await file.toBuffer(),
        mimetype: file.mimetype,
        caption: caption || null,
      }),
    )
  })

  app.delete('/images/:id', write, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    const { id } = req.params as { id: string }
    await service.removeImage(opts.deps, clinicId, userId, id)
    return ok({ deleted: true })
  })

  app.delete('/patients/:id', write, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    const { id } = req.params as { id: string }
    await service.remove(opts.deps, clinicId, userId, id)
    return ok({ deleted: true })
  })
}
