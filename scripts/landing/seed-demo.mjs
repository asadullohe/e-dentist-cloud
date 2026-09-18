// Lokal kabinetga landing skrinshotlari uchun demo maʼlumot — API orqali,
// egasi sifatida. Faqat lokal bazada ishlatiladi: manzil qotirilgan,
// serverga qaratib boʻlmaydi. Ikkinchi marta ishga tushsa mavjudini qayta
// yozmaydi (bemor ismi, narxnoma nomi boʻyicha tekshiradi).
//
//   node scripts/landing/seed-demo.mjs
//
// Kirish: ui-sinov@example.com / sinov12345 (lokal sinov egasi)
const BASE = 'http://localhost:3000/api'
let cookie = ''

async function api(method, path, body) {
  const r = await fetch(BASE + path, {
    method,
    headers: { 'content-type': 'application/json', cookie },
    body: body ? JSON.stringify(body) : undefined,
  })
  const set = r.headers.get('set-cookie')
  if (set) cookie = set.split(';')[0]
  const json = await r.json().catch(() => ({}))
  if (!json.ok)
    console.log(
      '  !',
      method,
      path,
      json.error?.message ?? r.status,
      JSON.stringify(json.error?.fields ?? ''),
      JSON.stringify(body ?? '').slice(0, 120),
    )
  return json.data
}

const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const daysAgo = (n, base = new Date()) => {
  const d = new Date(base)
  d.setDate(d.getDate() - n)
  return d
}
const pick = (arr, i) => arr[i % arr.length]

await api('POST', '/auth/login', { email: 'ui-sinov@example.com', password: 'sinov12345' })
const staff = await api('GET', '/staff')
const doctors = staff.filter(
  (s) => s.payPercent > 0 || s.fullName.startsWith('Aliyev') || s.fullName.startsWith('Rasulova'),
)
const tech = staff.find((s) => s.fullName.startsWith('Usta'))
const docIds = doctors.map((d) => d.id)
console.log('shifokorlar:', doctors.map((d) => d.fullName).join(', '), '| texnik:', tech?.fullName)

// Narxnoma
const existingServices = await api('GET', '/services')
const SERVICES = [
  ['Konsultatsiya va koʻrik', 50_000],
  ['Fotopolimer plomba', 350_000],
  ['Kanal davolash (1 kanal)', 450_000],
  ['Professional tozalash', 300_000],
  ['Tish olish', 200_000],
  ['Metall-keramika koronka', 900_000],
  ['Sirkoniy koronka', 1_800_000],
  ['Implant (Osstem)', 4_500_000],
  ['Oqartirish', 1_200_000],
  ['Vinir', 2_500_000],
  ['Sut tishini olish', 120_000],
  ['Rentgen (vizograf)', 40_000],
]
const services = [...existingServices]
for (const [name, price] of SERVICES) {
  if (!services.some((s) => s.name === name))
    services.push(await api('POST', '/services', { name, price }))
}

// Bemorlar
const PATIENTS = [
  ['Karimova Madina Rustamovna', '90 123 45 67', '1991-03-14', 'Toshkent, Yunusobod 4-kv'],
  ['Toshpoʻlatov Sardor Akmalovich', '91 234 56 78', '1985-07-02', 'Toshkent, Chilonzor 19-kv'],
  ['Yusupova Nilufar Baxtiyorovna', '93 345 67 89', '1998-11-21', 'Toshkent, Mirzo Ulugʻbek'],
  ['Abdullayev Jasur Shavkatovich', '94 456 78 90', '1979-01-09', 'Toshkent, Sergeli'],
  ['Mirzayeva Dilnoza Farhodovna', '95 567 89 01', '2003-05-30', 'Toshkent, Yakkasaroy'],
  ['Rahimov Otabek Ulugʻbekovich', '97 678 90 12', '1968-09-17', 'Toshkent, Shayxontohur'],
  ['Saidova Gulnora Anvarovna', '98 789 01 23', '1975-12-05', 'Toshkent, Olmazor'],
  ['Xoʻjayev Bekzod Tohirovich', '99 312 34 56', '1993-04-25', 'Toshkent, Bektemir'],
  ['Nazarova Sevara Ilhomovna', '90 901 23 45', '2016-08-12', 'Toshkent, Yunusobod 11-kv'],
  ['Ergashev Doston Nodirovich', '91 012 34 56', '1988-02-18', 'Toshkent, Uchtepa'],
  ['Qodirova Zarina Muzaffarovna', '93 111 22 33', '1995-06-08', 'Toshkent, Mirobod'],
  ['Ismoilov Farrux Rustamovich', '94 222 33 44', '1982-10-27', 'Toshkent, Yashnobod'],
  ['Hamidova Feruza Qahramonovna', '95 333 44 55', '1972-03-03', 'Toshkent, Chilonzor 2-kv'],
  ['Umarov Shohrux Bahromovich', '97 444 55 66', '2010-01-15', 'Toshkent, Sergeli'],
  ['Tursunova Malika Sherzodovna', '98 555 66 77', '1999-09-09', 'Toshkent, Yunusobod'],
  ['Boboyev Alisher Karimovich', '99 666 77 88', '1960-05-20', 'Toshkent, Olmazor'],
]
const existingPatients = (await api('GET', '/patients?page=1&pageSize=100')).items
const patients = []
for (let i = 0; i < PATIENTS.length; i++) {
  const [fio, phone, birthDate, address] = PATIENTS[i]
  const found = existingPatients.find((p) => p.fio === fio)
  patients.push(
    found ??
      (await api('POST', '/patients', {
        fio,
        phone,
        birthDate,
        address,
        doctorId: pick(docIds, i),
      })),
  )
}
console.log('bemorlar:', patients.length)

// Tashriflar: oxirgi 3 oy, har bemorda 1–4 ta
const TREATMENTS = [1, 2, 3, 4, 0, 5, 11, 1, 8, 2, 4, 6, 1, 0, 3, 7]
const TEETH = [16, 26, 36, 46, 11, 21, 14, 24, 37, 47, 15, 25, 12, 22, 45, 35]
let visitCount = 0
for (let i = 0; i < patients.length; i++) {
  const p = patients[i]
  const existing = await api('GET', `/patients/${p.id}/visits`)
  if (existing.length > 0) continue
  const n = 1 + (i % 4)
  for (let k = 0; k < n; k++) {
    const svc = services[TREATMENTS[(i + k) % TREATMENTS.length] % services.length]
    const date = daysAgo(2 + ((i * 7 + k * 13) % 85))
    await api('POST', '/visits', {
      patientId: p.id,
      doctorId: pick(docIds, i),
      date: iso(date),
      treatment: svc.name,
      serviceId: svc.id,
      price: svc.price,
      tooth: pick(TEETH, i + k),
      note: k === 0 ? 'Bemor sovuqqa sezuvchanlikdan shikoyat qildi' : null,
    })
    visitCount++
  }
}
console.log('tashriflar:', visitCount)

// Tish xaritasi — birinchi 6 bemorga
const STATUS_SETS = [
  [
    [16, 'plomba'],
    [26, 'karies'],
    [36, 'koronka', 'metall-keramika'],
    [46, 'plomba'],
    [11, 'soglom'],
    [38, 'olingan'],
    [47, 'implant'],
  ],
  [
    [14, 'karies'],
    [24, 'plomba'],
    [37, 'davolanmoqda'],
    [18, 'olingan'],
    [28, 'olingan'],
    [21, 'koronka', 'sirkoniy'],
  ],
  [
    [36, 'plomba'],
    [46, 'karies'],
    [16, 'koronka', 'keramika'],
  ],
  [
    [11, 'koronka', 'sirkoniy'],
    [12, 'koronka', 'sirkoniy'],
    [21, 'koronka', 'sirkoniy'],
    [22, 'koronka', 'sirkoniy'],
    [36, 'implant'],
    [45, 'plomba'],
  ],
  [
    [16, 'karies'],
    [26, 'karies'],
    [36, 'plomba'],
  ],
  [
    [48, 'olingan'],
    [38, 'olingan'],
    [46, 'koronka', 'metall-keramika'],
    [47, 'koronka', 'metall-keramika'],
    [15, 'plomba'],
  ],
]
for (let i = 0; i < STATUS_SETS.length; i++) {
  for (const [tooth, status, material] of STATUS_SETS[i]) {
    await api('PUT', `/patients/${patients[i].id}/teeth/${tooth}`, {
      status,
      material: material ?? null,
    })
  }
}
// Koʻprik — 1-bemorda 44–46
await api('POST', `/patients/${patients[0].id}/bridges`, {
  from: 44,
  to: 46,
  material: 'metall-keramika',
})

// Toʻlovlar — tashriflarning ~70% ni yopadi, baʼzilari qarzdor
let payCount = 0
for (let i = 0; i < patients.length; i++) {
  const p = patients[i]
  const balance = await api('GET', `/patients/${p.id}/balance`)
  const owed = balance?.debt ?? balance?.balance ?? 0
  if (!owed || owed <= 0) continue
  const share = i % 3 === 0 ? 1 : i % 3 === 1 ? 0.5 : 0
  const amount = Math.round((owed * share) / 1000) * 1000
  if (amount > 0) {
    await api('POST', '/payments', { patientId: p.id, date: iso(daysAgo(1 + (i % 20))), amount })
    payCount++
  }
}
console.log('toʻlovlar:', payCount)

// Xarajatlar — joriy va oʻtgan oy
const EXPENSES = [
  ['materials', 'Fotopolimer materiallar (3M)', 2_400_000],
  ['rent', 'Ijara — sentabr', 6_000_000],
  ['utilities', 'Elektr va suv', 480_000],
  ['lab', 'Texnik ishlari — sirkoniy 4 dona', 2_000_000],
  ['ads', 'Instagram reklama', 700_000],
  ['materials', 'Anesteziya, ignalar', 350_000],
  ['equipment', 'Skaler uchi', 900_000],
  ['other', 'Ofis jihozlari', 210_000],
]
const thisMonth = iso(new Date()).slice(0, 7)
const existingExpenses = await api('GET', `/expenses?month=${thisMonth}`)
if ((existingExpenses?.items ?? existingExpenses ?? []).length < 3) {
  for (let i = 0; i < EXPENSES.length; i++) {
    const [category, description, amount] = EXPENSES[i]
    await api('POST', '/expenses', { date: iso(daysAgo(1 + i * 3)), category, description, amount })
  }
}

// Qabullar — bugun va shu hafta
const today = new Date()
const SLOTS = [
  ['09:00', 0],
  ['09:30', 1],
  ['10:00', 2],
  ['11:00', 3],
  ['11:30', 4],
  ['14:00', 5],
  ['15:00', 6],
  ['16:30', 7],
]
const todayList = await api('GET', `/appointments?from=${iso(today)}&to=${iso(today)}`)
if (todayList.length < 6) {
  for (const [time, i] of SLOTS) {
    const at = await api('POST', '/appointments', {
      patientId: patients[i].id,
      date: iso(today),
      time,
      doctorId: pick(docIds, i),
      note: i === 2 ? 'Kanal davolash, 2-bosqich' : undefined,
    })
    if (at && i < 3) await api('PATCH', `/appointments/${at.id}`, { status: 'arrived' })
  }
  for (let d = 1; d <= 5; d++) {
    for (let k = 0; k < 2 + (d % 3); k++) {
      const i = (d * 3 + k) % patients.length
      const date = new Date(today)
      date.setDate(date.getDate() + d)
      await api('POST', '/appointments', {
        patientId: patients[i].id,
        date: iso(date),
        time: pick(SLOTS, k + d)[0],
        doctorId: pick(docIds, i),
      })
    }
  }
}

// Navbat — bugun: 2 ta kutmoqda, 1 ta chaqirilgan
const queue = await api('GET', '/queue')
if (queue.length < 3) {
  const q1 = await api('POST', '/queue', { patientId: patients[8].id, doctorId: docIds[0] })
  const q2 = await api('POST', '/queue', {
    patientId: patients[9].id,
    doctorId: docIds[1 % docIds.length],
  })
  const q3 = await api('POST', '/queue', { patientId: patients[10].id, doctorId: docIds[0] })
  const mine = (q3 ?? q2 ?? q1)?.find((e) => e.patientId === patients[8].id)
  if (mine) await api('PATCH', `/queue/${mine.id}`, { action: 'call' })
}

// Naryadlar
const labs = await api('GET', '/lab-orders')
if (labs.length < 2 && tech) {
  await api('POST', '/lab-orders', {
    patientId: patients[3].id,
    techId: tech.id,
    teeth: [11, 12, 21, 22],
    workType: 'crown',
    material: 'zirconia',
    shade: 'A2',
    dueDate: iso(daysAgo(-5)),
    techPrice: 1_600_000,
  })
  await api('POST', '/lab-orders', {
    patientId: patients[5].id,
    techId: tech.id,
    teeth: [46, 47],
    workType: 'bridge',
    material: 'metal_ceramic',
    shade: 'A3',
    dueDate: iso(daysAgo(-2)),
    techPrice: 700_000,
  })
}
console.log('tayyor')
