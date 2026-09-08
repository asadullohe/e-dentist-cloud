import { EXCEL_TEXT, IMAGE_TEXT, IMPORT_TEXT, IMPORT_UI, todayISO } from '@e-dentist/shared'

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
import {
  importCommitSchema,
  patientCreateSchema,
  patientListSchema,
  patientUpdateSchema,
} from './schema.js'
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

  app.post('/patients/import/preview', write, async (req) => {
    const { clinicId } = clinicOf(req)

    const file = await req.file()
    if (!file) throw errors.badRequest(IMPORT_TEXT.no_file)

    // Birinchi qator sarlavhami — foydalanuvchi belgilaydi, taxmin qilinmaydi
    const field = file.fields.hasHeader
    const hasHeader =
      typeof field === 'object' && field !== null
        ? String((field as { value?: unknown }).value ?? 'true') !== 'false'
        : true

    return ok(
      await service.importPreview(
        opts.deps,
        clinicId,
        { buffer: await file.toBuffer(), filename: file.filename },
        hasHeader,
      ),
    )
  })

  app.post('/patients/import/commit', write, async (req) => {
    const { clinicId, userId } = clinicOf(req)
    const input = validateInput(importCommitSchema, req.body)
    return ok(await service.importCommit(opts.deps, clinicId, userId, input.token, input.mode))
  })

  app.get('/patients/import/errors/:token', write, async (req, reply) => {
    const { clinicId } = clinicOf(req)
    const { token } = req.params as { token: string }
    const file = await service.importErrors(opts.deps, clinicId, token)
    return reply
      .header('content-type', XLSX_TYPE)
      .header('content-disposition', attachment(IMPORT_UI.errors_file))
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
