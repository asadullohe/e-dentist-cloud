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

const NS = 'http://www.w3.org/2000/svg'
const el = (name, attrs = {}) => {
  const node = document.createElementNS(NS, name)
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v)
  return node
}

function drawTooth(svg, p) {
  const status = teeth[p.no] || 'soglom'
  const st = STYLE[status]
  const removed = status === 'olingan'
  const shape = outline(toothType(p.no), p.width, p.depth)

  const group = el('g', { class: 'tooth', tabindex: '0', role: 'button' })
  group.style.setProperty('--from', p.upper ? '-14px' : '14px')
  // Oʻrtadan chetga qarab chiqadi
  group.style.animationDelay = `${120 + p.index * 45}ms`

  const title = el('title')
  title.textContent = `${p.no} — ${st.label}`
  group.appendChild(title)

  const body = el('g', { transform: `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${p.angle.toFixed(1)})` })
  // Koʻtarilish animatsiyasi alohida guruhda: CSS transform SVG atributini
  // bekor qilib yubormasligi uchun bu guruhda transform atributi boʻlmasligi shart
  const lift = el('g', { class: 'tooth-lift' })
  // Olib tashlangan tishda ichi boʻsh — bosish maydoni koʻrinmas toʻrtburchak
  lift.appendChild(
    el('rect', { x: -p.width / 2, y: -p.depth / 2, width: p.width, height: p.depth, fill: 'transparent' })
  )
  const path = el('path', {
    class: 'crown-shape',
    d: shape.body,
    fill: st.fill,
    stroke: st.stroke,
    'stroke-width': '1.3'
  })
  if (removed) path.setAttribute('stroke-dasharray', '3 3')
  lift.appendChild(path)
  if (!removed) {
    lift.appendChild(
      el('path', {
        d: shape.groove,
        fill: 'none',
        stroke: st.stroke,
        'stroke-width': '1',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        opacity: '0.6'
      })
    )
  }
  body.appendChild(lift)
  group.appendChild(body)

  const off = p.depth / 2 + 13
  const label = el('text', {
    x: (p.x + p.nx * off).toFixed(1),
    y: (p.y + p.ny * off).toFixed(1),
    'text-anchor': 'middle',
    'dominant-baseline': 'central',
    'font-size': '12',
    'font-weight': status === 'soglom' ? '500' : '700',
    fill: status === 'soglom' ? '#8f98bd' : '#f4efe2',
    style: 'font-variant-numeric: tabular-nums; pointer-events:none'
  })
  label.textContent = p.no
  group.appendChild(label)

  const apply = () => {
    teeth[p.no] = teeth[p.no] === picked ? 'soglom' : picked
    render()
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

// Tepa panelga chegara — sahifa suringanda
const topBar = document.getElementById('top')
const onScroll = () => topBar.classList.toggle('scrolled', window.scrollY > 8)
onScroll()
window.addEventListener('scroll', onScroll, { passive: true })
