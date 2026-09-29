// Sayt uchun kichik skript: sarlavhadagi odontogramma va tepa panel.
// Xarita kabinetdagi ToothChart bilan bir xil: tishlar ustidan koʻrinishda,
// ravoq shaklida. Geometriya packages/teeth dagi placeArch ning nusxasi —
// sayt statik, qurish bosqichi yoʻq, shuning uchun import qilinmaydi

// Sahifa tili: <html lang="uz"> yoki "ru" (/ru/) — nomlar shunga qarab
const RU = document.documentElement.lang === 'ru'
const LABELS = RU
  ? { soglom: 'Здоровый', karies: 'Кариес', plomba: 'Пломба', koronka: 'Коронка', implant: 'Имплант', olingan: 'Удалён', chart: 'Пример зубной карты' }
  : { soglom: 'Sogʻlom', karies: 'Karies', plomba: 'Plomba', koronka: 'Koronka', implant: 'Implant', olingan: 'Olib tashlangan', chart: 'Tish xaritasi namunasi' }

// Ranglar packages/teeth dagi STATUS_STYLE bilan bir xil
const STATUSES = [
  { key: 'soglom', label: LABELS.soglom, fill: '#fdfcf8', stroke: '#a8a79f' },
  { key: 'karies', label: LABELS.karies, fill: '#fac775', stroke: '#ba7517' },
  { key: 'plomba', label: LABELS.plomba, fill: '#b5d4f4', stroke: '#185fa5' },
  { key: 'koronka', label: LABELS.koronka, fill: '#cecbf6', stroke: '#534ab7' },
  { key: 'implant', label: LABELS.implant, fill: '#9fe1cb', stroke: '#0f6e56' },
  { key: 'olingan', label: LABELS.olingan, fill: 'none', stroke: '#b4b2a9' }
]
const STYLE = Object.fromEntries(STATUSES.map((s) => [s.key, s]))

// Tishning ustidan koʻrinishdagi oʻlchami [ravoq boʻylab, ravoqqa tik],
// FDI ikkinchi raqami tartibida (1 — markaziy kesuvchi)
const SIZES = {
  upper: [[34, 30], [27, 27], [30, 32], [27, 36], [27, 36], [40, 42], [37, 40], [34, 38]],
  lower: [[22, 26], [24, 27], [28, 31], [27, 34], [28, 35], [42, 40], [39, 39], [35, 37]]
}
const ARCHES = [
  { upper: true, cx: 210, center: 285, a: 128, b: 215, quadrants: [1, 2] },
  { upper: false, cx: 210, center: 335, a: 118, b: 205, quadrants: [4, 3] }
]

function toothType(no) {
  const d = no % 10
  if (d <= 2) return 'incisor'
  if (d === 3) return 'canine'
  if (d <= 5) return 'premolar'
  return 'molar'
}

// Ravoq — yarim ellips; tishlar teng burchak emas, oʻz kengligicha teng yoy oladi
function placeArch(arch) {
  const sign = arch.upper ? -1 : 1
  const table = []
  let length = 0
  let prev = null
  for (let i = 0; i <= 600; i++) {
    const t = (i / 600) * (Math.PI / 2)
    const p = [arch.a * Math.sin(t), sign * arch.b * Math.cos(t)]
    if (prev) length += Math.hypot(p[0] - prev[0], p[1] - prev[1])
    table.push([t, length])
    prev = p
  }
  const paramAt = (arc) => (table.find(([, l]) => l >= arc) || table[600])[0]
  const sizes = arch.upper ? SIZES.upper : SIZES.lower
  const GAP = 2
  const k = length / sizes.reduce((sum, [w]) => sum + w + GAP, 0)
  const kDepth = Math.max(0.8, Math.min(k, 1.6))

  const placed = []
  ;[-1, 1].forEach((side, sideIndex) => {
    let arc = 0
    sizes.forEach(([w0, d0], index) => {
      const width = w0 * k
      arc += (GAP * k) / 2 + width / 2
      const t = paramAt(arc)
      arc += width / 2 + (GAP * k) / 2
      let nx = (side * Math.sin(t)) / arch.a
      let ny = (sign * Math.cos(t)) / arch.b
      const norm = Math.hypot(nx, ny)
      nx /= norm
      ny /= norm
      placed.push({
        no: arch.quadrants[sideIndex] * 10 + index + 1,
        x: arch.cx + side * arch.a * Math.sin(t),
        y: arch.center + sign * arch.b * Math.cos(t),
        angle: (Math.atan2(-nx, ny) * 180) / Math.PI,
        nx,
        ny,
        width,
        depth: d0 * kDepth,
        index
      })
    })
  })
  return placed
}

function rounded(w, d, r) {
  const x = w / 2
  const y = d / 2
  return `M${-x + r},${-y}H${x - r}Q${x},${-y} ${x},${-y + r}V${y - r}Q${x},${y} ${x - r},${y}H${-x + r}Q${-x},${y} ${-x},${y - r}V${-y + r}Q${-x},${-y} ${-x + r},${-y}Z`
}

// Siluet va chaynov yuzasidagi egatlar. Lokal koordinatada +y — ravoqdan tashqariga
function outline(type, w, d) {
  if (type === 'incisor') {
    return {
      body: `M${-w / 2},${d * 0.2}Q${-w / 2},${d / 2} 0,${d / 2}Q${w / 2},${d / 2} ${w / 2},${d * 0.2}Q${w * 0.38},${-d / 2} 0,${-d / 2}Q${-w * 0.38},${-d / 2} ${-w / 2},${d * 0.2}Z`,
      groove: `M${-w * 0.3},${d * 0.18}Q0,${d * 0.34} ${w * 0.3},${d * 0.18}`
    }
  }
  if (type === 'canine') {
    return {
      body: `M0,${d / 2}Q${w / 2},${d / 2} ${w / 2},0Q${w / 2},${-d / 2} 0,${-d / 2}Q${-w / 2},${-d / 2} ${-w / 2},0Q${-w / 2},${d / 2} 0,${d / 2}Z`,
      groove: `M${-w * 0.28},${d * 0.02}L0,${d * 0.2}L${w * 0.28},${d * 0.02}`
    }
  }
  if (type === 'premolar') {
    return { body: rounded(w, d, Math.min(w, d) * 0.45), groove: `M0,${-d * 0.26}Q${w * 0.1},0 0,${d * 0.26}` }
  }
  return {
    body: rounded(w, d, Math.min(w, d) * 0.36),
    groove: `M${w * 0.02},${-d * 0.32}L${-w * 0.06},${-d * 0.04}L${w * 0.04},${d * 0.32}M${-w * 0.06},${-d * 0.04}L${-w * 0.3},${-d * 0.1}M${w * 0.01},${d * 0.08}L${w * 0.3},${d * 0.14}`
  }
}

// Geometriya oʻzgarmas — bir marta hisoblanadi
const PLACED = ARCHES.flatMap((arch) => placeArch(arch).map((p) => ({ ...p, upper: arch.upper })))

// Namuna karta — dasturdagi demo bemor kabi
const teeth = { 16: 'plomba', 26: 'karies', 38: 'olingan', 36: 'koronka', 45: 'implant' }
let picked = 'karies'
// Tish raqami → uni qayta boʻyash va joyi (jonli namuna shu orqali bosadi)
const TEETH = new Map()
let chartSvg = null
// Harakatni kamaytirish yoqilgan boʻlsa — namuna ham, scroll animatsiyasi ham yoʻq
const MOTION = !window.matchMedia('(prefers-reduced-motion: reduce)').matches

const NS = 'http://www.w3.org/2000/svg'
const el = (name, attrs = {}) => {
  const node = document.createElementNS(NS, name)
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v)
  return node
}

// Tish bir marta chiziladi; holat oʻzgarganda faqat ranglari yangilanadi.
// Butun xarita qayta qurilsa «chiqish» animatsiyasi hamma tishda qaytadan oʻynaydi
function drawTooth(svg, p) {
  const shape = outline(toothType(p.no), p.width, p.depth)

  const group = el('g', { class: 'tooth', tabindex: '0', role: 'button' })
  group.style.setProperty('--from', p.upper ? '-14px' : '14px')
  // Oʻrtadan chetga qarab chiqadi — karta kirib boʻlgach
  group.style.animationDelay = `${520 + p.index * 45}ms`

  const title = el('title')
  group.appendChild(title)

  const body = el('g', { transform: `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${p.angle.toFixed(1)})` })
  // Koʻtarilish animatsiyasi alohida guruhda: CSS transform SVG atributini
  // bekor qilib yubormasligi uchun bu guruhda transform atributi boʻlmasligi shart
  const lift = el('g', { class: 'tooth-lift' })
  // Olib tashlangan tishda ichi boʻsh — bosish maydoni koʻrinmas toʻrtburchak
  lift.appendChild(
    el('rect', { x: -p.width / 2, y: -p.depth / 2, width: p.width, height: p.depth, fill: 'transparent' })
  )
  const path = el('path', { class: 'crown-shape', d: shape.body, 'stroke-width': '1.3' })
  const groove = el('path', {
    d: shape.groove,
    fill: 'none',
    'stroke-width': '1',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    opacity: '0.6'
  })
  lift.append(path, groove)
  body.appendChild(lift)
  group.appendChild(body)

  const off = p.depth / 2 + 13
  const label = el('text', {
    x: (p.x + p.nx * off).toFixed(1),
    y: (p.y + p.ny * off).toFixed(1),
    'text-anchor': 'middle',
    'dominant-baseline': 'central',
    'font-size': '12',
    style: 'font-variant-numeric: tabular-nums; pointer-events:none'
  })
  label.textContent = p.no
  group.appendChild(label)

  const paint = () => {
    const status = teeth[p.no] || 'soglom'
    const st = STYLE[status]
    const removed = status === 'olingan'
    title.textContent = `${p.no} — ${st.label}`
    path.setAttribute('fill', st.fill)
    path.setAttribute('stroke', st.stroke)
    if (removed) path.setAttribute('stroke-dasharray', '3 3')
    else path.removeAttribute('stroke-dasharray')
    groove.setAttribute('stroke', st.stroke)
    groove.style.display = removed ? 'none' : ''
    label.setAttribute('font-weight', status === 'soglom' ? '500' : '700')
    label.setAttribute('fill', status === 'soglom' ? '#8f98bd' : '#f4efe2')
  }
  paint()
  TEETH.set(p.no, { paint, group, p })

  const apply = () => {
    teeth[p.no] = teeth[p.no] === picked ? 'soglom' : picked
    paint()
  }
  group.addEventListener('click', apply)
  group.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      apply()
    }
  })
  svg.appendChild(group)
}

function render() {
  const host = document.getElementById('chart')
  const svg = el('svg', { viewBox: '0 0 420 610', 'aria-label': LABELS.chart })
  svg.appendChild(el('line', { x1: '210', y1: '200', x2: '210', y2: '420', stroke: '#2b3357' }))
  svg.appendChild(el('line', { x1: '95', y1: '310', x2: '325', y2: '310', stroke: '#2b3357' }))
  for (const p of PLACED) drawTooth(svg, p)
  host.replaceChildren(svg)
  chartSvg = svg
}

function renderLegend() {
  const host = document.getElementById('legend')
  host.replaceChildren(
    ...STATUSES.map((s) => {
      const b = document.createElement('button')
      b.className = s.key === picked ? 'on' : ''
      b.type = 'button'
      b.setAttribute('aria-pressed', String(s.key === picked))
      const sw = document.createElement('i')
      sw.style.background = s.fill === 'none' ? 'transparent' : s.fill
      if (s.key === 'olingan') sw.style.borderStyle = 'dashed'
      sw.style.borderColor = s.stroke
      b.append(sw, document.createTextNode(s.label))
      b.addEventListener('click', () => {
        picked = s.key
        renderLegend()
      })
      return b
    })
  )
}

render()
renderLegend()

// ---------- Jonli namuna: «shifokor» bir necha tishni oʻzi belgilaydi ----------
// Tashrifchi xaritani oʻzi bosib koʻrmasa ham, u qanday ishlashini koʻradi.
// Xaritaga yoki holatlarga tegilsa — darhol toʻxtaydi, qolgani tashrifchiniki
const DEMO = [
  ['karies', 24],
  ['plomba', 24],
  ['koronka', 11],
  ['koronka', 21],
  ['olingan', 47],
  ['implant', 47]
]

function tap(no) {
  const tooth = TEETH.get(no)
  if (!tooth || !chartSvg) return
  const ring = el('circle', { class: 'tap-ring', cx: tooth.p.x.toFixed(1), cy: tooth.p.y.toFixed(1), r: '22' })
  chartSvg.appendChild(ring)
  ring.addEventListener('animationend', () => ring.remove())
  tooth.group.classList.remove('tapped')
  // Reflow — ketma-ket bosishda animatsiya qaytadan boshlansin
  void tooth.group.getBoundingClientRect()
  tooth.group.classList.add('tapped')
}

function startDemo() {
  const card = document.querySelector('.chart-card')
  let stopped = false
  const timers = []
  const stop = () => {
    stopped = true
    for (const t of timers) clearTimeout(t)
  }
  card.addEventListener('pointerdown', stop, { once: true })
  card.addEventListener('keydown', stop, { once: true })

  // Tishlar chiqib boʻlgach boshlanadi; har qadam — holat tanlash, keyin bosish
  let at = 600
  for (const [status, no] of DEMO) {
    timers.push(
      setTimeout(() => {
        if (stopped) return
        picked = status
        renderLegend()
      }, at),
      setTimeout(() => {
        if (stopped) return
        teeth[no] = status
        TEETH.get(no)?.paint()
        tap(no)
      }, at + 450)
    )
    at += 1300
  }
  // Oxirida tanlov boshlangʻich holatga qaytadi — tashrifchi karies bilan boshlaydi
  timers.push(
    setTimeout(() => {
      if (stopped) return
      picked = 'karies'
      renderLegend()
    }, at)
  )
}

if (MOTION) {
  // Xarita ekranga chiqqanda (telefonda u sarlavhadan pastda) — bir marta
  const seen = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return
      seen.disconnect()
      setTimeout(startDemo, 1100)
    },
    { threshold: 0.4 }
  )
  seen.observe(document.getElementById('chart'))
}

// ---------- Scroll bilan ochilish ----------
// Faqat ekrandan pastdagi elementlar yashiriladi: sahifa ochilganda koʻrinib
// turgan narsa miltillamaydi. JS ishlamasa — hammasi oddiy koʻrinadi
const REVEAL = [
  ['.strip .wrap > div', 90],
  ['.sec-head', 0],
  ['.feature-text', 0],
  ['.feature-text li', 70],
  ['.feature .shot', 0],
  ['.queue-grid > .shot', 0],
  ['.queue-side > *', 110],
  ['.checks li', 70],
  ['.privacy-grid .card', 90],
  ['.cta-row.center', 0],
  ['details', 40],
  ['.help', 0]
]

if (MOTION && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('in')
        io.unobserve(entry.target)
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
  )
  const fold = window.innerHeight
  for (const [selector, step] of REVEAL) {
    // Bir guruh ichida ketma-ket: roʻyxat bandlari, kartalar
    const groups = new Map()
    for (const node of document.querySelectorAll(selector)) {
      if (node.getBoundingClientRect().top < fold) continue
      const index = groups.get(node.parentElement) ?? 0
      groups.set(node.parentElement, index + 1)
      node.classList.add('reveal')
      node.style.setProperty('--d', `${Math.min(index * step, 600)}ms`)
      io.observe(node)
    }
  }
  // Skrinshot oʻz tomonidan kiradi: chapda turgani chapdan, oʻngdagisi oʻngdan.
  // Joy haqiqiy joylashuvdan olinadi — telefonda rasm matn ostida, u pastdan chiqadi
  for (const feature of document.querySelectorAll('.feature')) {
    const shot = feature.querySelector('.shot')
    const text = feature.querySelector('.feature-text')
    if (!shot || !text) continue
    const a = shot.getBoundingClientRect()
    const b = text.getBoundingClientRect()
    if (a.top >= b.bottom - 1) continue
    shot.classList.add(a.left < b.left ? 'from-left' : 'from-right')
  }
}

// Tepa panelga chegara — sahifa suringanda
const topBar = document.getElementById('top')
const onScroll = () => topBar.classList.toggle('scrolled', window.scrollY > 8)
onScroll()
window.addEventListener('scroll', onScroll, { passive: true })
