// Sayt uchun kichik skript: sarlavhadagi odontogramma va yuklab olish tugmasi.
// Tish shakllari dasturdagi ToothChart bilan bir xil — bir xil koʻrinsin.

// ---- Yuklab olish havolalari (faqat shu yerni oʻzgartirasiz) ----
// Oʻrnatuvchi fayllar (81–98 MB) saytga sigʻmaydi — hammasi GitHub Releases'da turadi.
// Yangi versiyada faqat quyidagi tag raqamini almashtirasiz.
const RELEASE = 'https://github.com/asadullohe/e-dentist-repo/releases/download/v1.2.0'
const DOWNLOADS = {
  win: `${RELEASE}/E-Dentist-Setup-1.2.0.exe`,
  mac: `${RELEASE}/E-Dentist-1.2.0-arm64.dmg`,
  android: `${RELEASE}/E-Dentist-1.2.0.apk`,
}

const UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
const LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]

const SHAPES = {
  incisor:
    'M -12 -36 L 12 -36 C 14 -22 14 -10 11 -1 C 9 5 7 9 5 11 C 4 21 2 34 0 34 C -2 34 -4 21 -5 11 C -7 9 -9 5 -11 -1 C -14 -10 -14 -22 -12 -36 Z',
  canine:
    'M 0 -40 C 6 -34 11 -26 12 -16 C 13 -6 12 2 9 8 C 7 11 5 12 4 14 C 3 24 1 35 0 35 C -1 35 -3 24 -4 14 C -5 12 -7 11 -9 8 C -12 2 -13 -6 -12 -16 C -11 -26 -6 -34 0 -40 Z',
  premolar:
    'M -14 -30 C -10 -37 -4 -37 0 -32 C 4 -37 10 -37 14 -30 C 16 -22 16 -10 13 -2 C 11 4 8 8 5 10 C 4 20 2 33 0 33 C -2 33 -4 20 -5 10 C -8 8 -11 4 -13 -2 C -16 -10 -16 -22 -14 -30 Z',
  molar:
    'M -20 -28 C -17 -35 -12 -36 -9 -31 C -6 -36 -2 -36 0 -31 C 2 -36 6 -36 9 -31 C 12 -36 17 -35 20 -28 C 22 -20 22 -10 20 -2 C 18 4 15 7 12 9 C 12 18 11 30 8 30 C 5 30 5 20 3 14 C 2 12 -2 12 -3 14 C -5 20 -5 30 -8 30 C -11 30 -12 18 -12 9 C -15 7 -18 4 -20 -2 C -22 -10 -22 -20 -20 -28 Z',
}

const STATUSES = [
  { key: 'soglom', label: 'Sogʻlom', grad: ['#fffdf6', '#eae0c6'], stroke: '#c3b89e' },
  { key: 'karies', label: 'Karies', grad: ['#f7e7bd', '#dcae4f'], stroke: '#b97f10' },
  { key: 'plomba', label: 'Plomba', grad: ['#dcebf8', '#8fb8d9'], stroke: '#2b6ca3' },
  { key: 'koronka', label: 'Koronka', grad: ['#fdfbf2', '#d6c79c'], stroke: '#9a8340' },
  { key: 'implant', label: 'Implant', grad: ['#d8efe9', '#7dbfae'], stroke: '#0e5e54' },
  { key: 'olingan', label: 'Olib tashlangan', grad: ['#f2eee5', '#e0d9c8'], stroke: '#b6ad99' },
]
const STYLE = Object.fromEntries(STATUSES.map((s) => [s.key, s]))

const TYPE_SCALE = { incisor: 0.94, canine: 0.98, premolar: 1.02, molar: 1.06 }
const TYPE_WIDTH = { incisor: 28, canine: 26, premolar: 32, molar: 44 }

function toothType(no) {
  const d = no % 10
  if (d <= 2) return 'incisor'
  if (d === 3) return 'canine'
  if (d <= 5) return 'premolar'
  return 'molar'
}

function archLayout(list) {
  const GAP = 3
  const widths = list.map((no) => {
    const t = toothType(no)
    return TYPE_WIDTH[t] * TYPE_SCALE[t] * 0.95
  })
  const total = widths.reduce((a, b) => a + b, 0) + GAP * (list.length - 1)
  let acc = 0
  return list.map((_, i) => {
    const center = acc + widths[i] / 2
    acc += widths[i] + GAP
    return center / total
  })
}

function archPos(t, upper) {
  const x = 64 + 632 * t
  const lift = 100 * Math.sin(Math.PI * t)
  return { x, y: upper ? 162 - lift : 344 + lift, rot: (upper ? 0.5 - t : t - 0.5) * 52 }
}

// Namuna karta — dasturdagi demo bemor kabi
const teeth = { 16: 'plomba', 26: 'karies', 38: 'olingan', 36: 'koronka', 45: 'implant' }
let picked = 'karies'

const NS = 'http://www.w3.org/2000/svg'
const el = (name, attrs = {}) => {
  const node = document.createElementNS(NS, name)
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v)
  return node
}

function drawTooth(g, no, upper, x, y, rot, index) {
  const status = teeth[no] || 'soglom'
  const st = STYLE[status]
  const type = toothType(no)
  const removed = status === 'olingan'

  const group = el('g', { class: 'tooth', tabindex: '0', role: 'button' })
  group.style.setProperty('--from', upper ? '-14px' : '14px')
  group.style.animationDelay = `${120 + index * 26}ms`

  const title = el('title')
  title.textContent = `${no} — ${st.label}`
  group.appendChild(title)

  const body = el('g', { transform: `translate(${x} ${y}) rotate(${rot})` })
  // Koʻtarilish animatsiyasi alohida guruhda: CSS transform SVG atributini
  // bekor qilib yubormasligi uchun bu guruhda transform atributi boʻlmasligi shart
  const lift = el('g', { class: 'tooth-lift' })
  const scaled = el('g', {
    transform: `scale(${TYPE_SCALE[type] * 0.95} ${upper ? -0.95 : 0.95})`,
  })
  const path = el('path', {
    class: 'crown-shape',
    d: SHAPES[type],
    fill: `url(#g-${status})`,
    stroke: st.stroke,
    'stroke-width': removed ? 1.4 : 1.1,
    'vector-effect': 'non-scaling-stroke',
  })
  if (removed) path.setAttribute('stroke-dasharray', '4 3')
  scaled.appendChild(path)
  if (removed) {
    scaled.appendChild(
      el('path', {
        d: 'M -9 -30 L 9 -12 M 9 -30 L -9 -12',
        stroke: st.stroke,
        'stroke-width': '2',
        'stroke-linecap': 'round',
      }),
    )
  } else {
    scaled.appendChild(
      el('ellipse', {
        cx: '-5',
        cy: '-24',
        rx: '4.5',
        ry: '7',
        fill: '#fff',
        opacity: '0.5',
        transform: 'rotate(-18 -5 -24)',
      }),
    )
  }
  lift.appendChild(scaled)
  body.appendChild(lift)
  group.appendChild(body)

  const rad = (rot * Math.PI) / 180
  const off = upper ? -58 : 60
  const label = el('text', {
    x: x - off * Math.sin(rad),
    y: y + off * Math.cos(rad) + 4,
    'text-anchor': 'middle',
    'font-size': '11.5',
    'font-weight': '700',
    fill: status === 'soglom' ? '#8f98bd' : st.stroke,
    style: 'font-variant-numeric: tabular-nums; pointer-events:none',
  })
  label.textContent = no
  group.appendChild(label)

  const apply = () => {
    teeth[no] = teeth[no] === picked ? 'soglom' : picked
    render()
  }
  group.addEventListener('click', apply)
  group.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      apply()
    }
  })
  g.appendChild(group)
}

function render() {
  const host = document.getElementById('chart')
  const svg = el('svg', { viewBox: '0 0 760 424', 'aria-label': 'Tish xaritasi namunasi' })

  const defs = el('defs')
  for (const s of STATUSES) {
    const grad = el('linearGradient', { id: `g-${s.key}`, x1: '0', y1: '0', x2: '0.25', y2: '1' })
    grad.appendChild(el('stop', { offset: '0', 'stop-color': s.grad[0] }))
    grad.appendChild(el('stop', { offset: '1', 'stop-color': s.grad[1] }))
    defs.appendChild(grad)
  }
  svg.appendChild(defs)

  svg.appendChild(
    el('line', {
      x1: '150',
      y1: '240',
      x2: '610',
      y2: '240',
      stroke: '#2b3357',
      'stroke-dasharray': '3 5',
    }),
  )

  const layoutU = archLayout(UPPER)
  UPPER.forEach((no, i) => {
    const p = archPos(layoutU[i], true)
    drawTooth(svg, no, true, p.x, p.y, p.rot, i)
  })
  const layoutL = archLayout(LOWER)
  LOWER.forEach((no, i) => {
    const p = archPos(layoutL[i], false)
    drawTooth(svg, no, false, p.x, p.y - 46, p.rot, i)
  })

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
      sw.style.background = `linear-gradient(160deg, ${s.grad[0]}, ${s.grad[1]})`
      sw.style.borderColor = s.stroke
      b.append(sw, document.createTextNode(s.label))
      b.addEventListener('click', () => {
        picked = s.key
        renderLegend()
      })
      return b
    }),
  )
}

render()
renderLegend()

// Qaysi tizim ekanini aniqlab, asosiy tugmani oʻshanga qaratamiz
// Kartalardagi havolalar ham shu roʻyxatdan olinadi
for (const [id, href] of Object.entries(DOWNLOADS)) {
  const link = document.querySelector(`#dl-${id} .btn`)
  if (link) link.href = href
}

const ua = navigator.userAgent
const os = /Android/i.test(ua)
  ? { id: 'android', label: 'Android uchun yuklab olish', file: DOWNLOADS.android }
  : /Mac/i.test(ua) && !/iPhone|iPad/i.test(ua)
    ? { id: 'mac', label: 'macOS uchun yuklab olish', file: DOWNLOADS.mac }
    : /Win/i.test(ua)
      ? { id: 'win', label: 'Windows uchun yuklab olish', file: DOWNLOADS.win }
      : null

const hero = document.getElementById('heroDownload')
if (os) {
  hero.textContent = os.label
  hero.href = os.file
  hero.setAttribute('download', '')
  document.getElementById(`dl-${os.id}`)?.classList.add('primary')
}

// Tepa panelga chegara — sahifa suringanda
const topBar = document.getElementById('top')
const onScroll = () => topBar.classList.toggle('scrolled', window.scrollY > 8)
onScroll()
window.addEventListener('scroll', onScroll, { passive: true })
