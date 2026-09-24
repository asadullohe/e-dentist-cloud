// Namuna klinikaning qoʻzgʻalmas maʼlumotlari: xodimlar, xizmatlar katalogi,
// ismlar. Narxlar Toshkentdagi oʻrtacha narxlarga yaqin (soʻm)

export const PASSWORD = 'tabassum123'

export const CLINIC = {
  name: 'Tabassum Dental',
  phone: '+998712004545',
  publicPhone: '+998 71 200 45 45',
  address: 'Toshkent sh., Chilonzor tumani, Bunyodkor shoh koʻchasi, 12',
}

export type StaffKey = 'owner' | 'dilnoza' | 'sardor' | 'malika' | 'bobur' | 'nodira'
export type Template = 'egasi' | 'shifokor' | 'qabulxona' | 'texnik' | 'kuzatuvchi'

export interface StaffSpec {
  key: StaffKey
  fullName: string
  email: string
  template: Template
  salaryAmount: number
  payPercent: number
}

export const STAFF: StaffSpec[] = [
  {
    key: 'owner',
    fullName: 'Rahimov Akmal',
    email: 'egasi@tabassum.uz',
    template: 'egasi',
    salaryAmount: 0,
    payPercent: 0,
  },
  {
    key: 'dilnoza',
    fullName: 'Karimova Dilnoza',
    email: 'dilnoza@tabassum.uz',
    template: 'shifokor',
    salaryAmount: 0,
    payPercent: 30,
  },
  {
    key: 'sardor',
    fullName: 'Yusupov Sardor',
    email: 'sardor@tabassum.uz',
    template: 'shifokor',
    salaryAmount: 2_000_000,
    payPercent: 35,
  },
  {
    key: 'malika',
    fullName: 'Tursunova Malika',
    email: 'malika@tabassum.uz',
    template: 'qabulxona',
    salaryAmount: 4_000_000,
    payPercent: 0,
  },
  {
    key: 'bobur',
    fullName: 'Aliyev Bobur',
    email: 'bobur@tabassum.uz',
    template: 'texnik',
    salaryAmount: 3_500_000,
    payPercent: 0,
  },
  {
    key: 'nodira',
    fullName: 'Ismoilova Nodira',
    email: 'nodira@tabassum.uz',
    template: 'kuzatuvchi',
    salaryAmount: 3_000_000,
    payPercent: 0,
  },
]

export type Area = 'tooth' | 'range' | 'arch' | 'mouth'

export interface ServiceSpec {
  key: string
  name: string
  price: number
  area: Area
  techPrice?: number
}

export const CATALOG: { type: string; services: ServiceSpec[] }[] = [
  {
    type: 'Diagnostika',
    services: [
      { key: 'consult', name: 'Konsultatsiya', price: 50_000, area: 'mouth' },
      { key: 'xray', name: 'Rentgen (vizograf)', price: 40_000, area: 'tooth' },
      { key: 'opg', name: 'Panoramik snimka (OPG)', price: 120_000, area: 'mouth' },
    ],
  },
  {
    type: 'Gigiyena',
    services: [
      { key: 'cleaning', name: 'Professional tozalash', price: 350_000, area: 'mouth' },
      { key: 'fluor', name: 'Ftorlash', price: 150_000, area: 'arch' },
      { key: 'whitening', name: 'Oqartirish (Zoom)', price: 1_500_000, area: 'mouth' },
    ],
  },
  {
    type: 'Terapiya',
    services: [
      { key: 'temp', name: 'Vaqtinchalik plomba', price: 100_000, area: 'tooth' },
      { key: 'filling', name: 'Fotopolimer plomba', price: 450_000, area: 'tooth' },
      { key: 'caries', name: 'Karies davolash', price: 350_000, area: 'tooth' },
      { key: 'canal1', name: 'Kanal davolash (1 kanal)', price: 400_000, area: 'tooth' },
      { key: 'canal3', name: 'Kanal davolash (3 kanal)', price: 900_000, area: 'tooth' },
      { key: 'pulpit', name: 'Pulpit davolash', price: 600_000, area: 'tooth' },
    ],
  },
  {
    type: 'Jarrohlik',
    services: [
      { key: 'extract', name: 'Tish olish (oddiy)', price: 200_000, area: 'tooth' },
      { key: 'extractHard', name: 'Tish olish (murakkab)', price: 500_000, area: 'tooth' },
      { key: 'wisdom', name: 'Aql tishini olish', price: 700_000, area: 'tooth' },
      { key: 'implant', name: 'Implant oʻrnatish (Osstem)', price: 6_000_000, area: 'tooth' },
      { key: 'sinus', name: 'Sinus lifting', price: 4_000_000, area: 'tooth' },
    ],
  },
  {
    type: 'Ortopediya',
    services: [
      {
        key: 'crownMc',
        name: 'Metall-keramika toj',
        price: 1_200_000,
        area: 'tooth',
        techPrice: 400_000,
      },
      {
        key: 'crownZr',
        name: 'Sirkoniy toj',
        price: 2_500_000,
        area: 'tooth',
        techPrice: 900_000,
      },
      {
        key: 'bridgeUnit',
        name: 'Koʻprik (1 birlik, metall-keramika)',
        price: 1_200_000,
        area: 'range',
        techPrice: 400_000,
      },
      {
        key: 'veneer',
        name: 'Vinir (E-max)',
        price: 3_000_000,
        area: 'tooth',
        techPrice: 1_000_000,
      },
      {
        key: 'denture',
        name: 'Olinadigan protez',
        price: 3_500_000,
        area: 'arch',
        techPrice: 1_200_000,
      },
    ],
  },
  {
    type: 'Bolalar stomatologiyasi',
    services: [
      { key: 'milkExtract', name: 'Sut tishini olish', price: 100_000, area: 'tooth' },
      { key: 'sealant', name: 'Fissura germetizatsiyasi', price: 150_000, area: 'tooth' },
    ],
  },
]

export const MALE = [
  'Jasur',
  'Bekzod',
  'Sherzod',
  'Rustam',
  'Aziz',
  'Otabek',
  'Farrux',
  'Doniyor',
  'Ulugʻbek',
  'Shoxrux',
  'Javohir',
  'Anvar',
  'Laziz',
  'Timur',
  'Islom',
]
export const FEMALE = [
  'Madina',
  'Nilufar',
  'Gulnora',
  'Shahnoza',
  'Zarina',
  'Feruza',
  'Kamola',
  'Sevara',
  'Dildora',
  'Munisa',
  'Mohira',
  'Lola',
  'Nargiza',
  'Barno',
]
// Familiyaning erkak shakli; ayolga «-a» qoʻshiladi
export const SURNAMES = [
  'Karimov',
  'Rahimov',
  'Toshmatov',
  'Xolmatov',
  'Nazarov',
  'Abdullayev',
  'Saidov',
  'Ergashev',
  'Qodirov',
  'Mirzayev',
  'Sultonov',
  'Yoʻldoshev',
  'Hasanov',
  'Umarov',
  'Jalilov',
  'Azimov',
]
export const RUSSIAN = [
  'Ivanova Olga',
  'Petrov Sergey',
  'Kim Viktoriya',
  'Smirnova Yelena',
  'Pak Dmitriy',
]
export const DISTRICTS = [
  'Chilonzor tumani',
  'Yunusobod tumani',
  'Mirzo Ulugʻbek tumani',
  'Sergeli tumani',
  'Yakkasaroy tumani',
  'Olmazor tumani',
  'Uchtepa tumani',
]
export const PHONE_CODES = ['90', '91', '93', '94', '97', '99', '88', '33']

// Doimiy tishlar (FDI) — oldingi va chaynov tishlari alohida
export const MOLARS = [16, 17, 26, 27, 36, 37, 46, 47, 14, 15, 24, 25, 34, 35, 44, 45]
export const FRONT = [11, 12, 13, 21, 22, 23]
export const WISDOM = [18, 28, 38, 48]
export const MILK = [54, 55, 64, 65, 74, 75, 84, 85]

/// Takrorlanadigan tasodif (mulberry32) — skript har safar bir xil klinika
/// yaratadi, shuning uchun muammo boʻlsa uni qayta koʻrsatish oson
export function rng(seed: number): () => number {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
