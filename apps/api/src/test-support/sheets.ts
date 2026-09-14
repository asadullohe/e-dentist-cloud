// Testlarda Excel javobini oʻqish.
//
// Oqimdan oʻqilganda read-excel-file barcha varaqlarni [{sheet, data}]
// koʻrinishida qaytaradi va `sheet` sozlamasini eʼtiborsiz qoldiradi —
// kerakli varaqni oʻzimiz tanlaymiz

export async function sheetRows(body: Buffer, index = 1): Promise<unknown[][]> {
  const { Readable } = await import('node:stream')
  const readXlsxFile = (await import('read-excel-file/node')).default
  const sheets = (await readXlsxFile(Readable.from(body))) as unknown as {
    sheet: string
    data: unknown[][]
  }[]
  return sheets[index - 1]?.data ?? []
}
