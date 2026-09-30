-- Mavjud klinikalarga Assistent roli (tz.md 20-boʻlim). Ruxsatlar
-- packages/shared/src/roles.ts dagi shablon bilan bir xil. Nom oʻzbekcha —
-- ekranda shablon nomi joriy tilda koʻrsatiladi (`roleLabel`)
INSERT INTO "roles" ("id", "clinic_id", "template", "name", "permissions", "is_owner", "updated_at")
SELECT gen_random_uuid(), c.id, 'assistent', 'Assistent',
       ARRAY['patients.read', 'patients.write', 'teeth.write', 'schedule.read',
             'schedule.write', 'queue.manage', 'plans.read', 'payroll.own'],
       false, CURRENT_TIMESTAMP
FROM "clinics" c
WHERE NOT EXISTS (
  SELECT 1 FROM "roles" r WHERE r.clinic_id = c.id AND r.template = 'assistent'
);
